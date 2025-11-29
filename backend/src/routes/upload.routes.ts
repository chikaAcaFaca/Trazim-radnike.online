import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { uploadService } from '../services/upload.service.js';

const router = Router();

// Multer configuration - memory storage for processing before saving
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  },
});

// Validation schemas
const uploadFileSchema = z.object({
  body: z.object({
    jobId: z.string().uuid().optional(),
    uploadType: z.enum(['JOB_DOCUMENT', 'COMPANY_LOGO', 'CHAT_ATTACHMENT', 'OTHER']).optional(),
    description: z.string().max(500).optional(),
  }),
});

const updateUploadSchema = z.object({
  body: z.object({
    description: z.string().max(500),
  }),
});

// Helper for async route handlers
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * @route POST /api/uploads
 * @desc Upload a file
 */
router.post(
  '/',
  requireAuth,
  upload.single('file'),
  validate(uploadFileSchema),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file provided',
      });
      return;
    }

    const { jobId, uploadType = 'OTHER', description } = req.body;

    // Save file to disk
    const { filePath, url } = await uploadService.saveFile(
      req.file,
      req.user!.id,
      uploadType
    );

    // Create database record
    const uploadRecord = await uploadService.createUpload(
      {
        jobId,
        userId: req.user!.id,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        uploadType,
        description,
      },
      filePath,
      url
    );

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: { upload: uploadRecord },
    });
  })
);

/**
 * @route POST /api/uploads/multiple
 * @desc Upload multiple files
 */
router.post(
  '/multiple',
  requireAuth,
  upload.array('files', 10), // Max 10 files
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No files provided',
      });
      return;
    }

    const { jobId, uploadType = 'OTHER', description } = req.body;
    const uploads = [];

    for (const file of files) {
      // Save file to disk
      const { filePath, url } = await uploadService.saveFile(
        file,
        req.user!.id,
        uploadType
      );

      // Create database record
      const uploadRecord = await uploadService.createUpload(
        {
          jobId,
          userId: req.user!.id,
          fileName: file.originalname,
          fileType: file.mimetype,
          fileSize: file.size,
          uploadType,
          description,
        },
        filePath,
        url
      );

      uploads.push(uploadRecord);
    }

    res.status(201).json({
      success: true,
      message: `${uploads.length} files uploaded successfully`,
      data: { uploads },
    });
  })
);

/**
 * @route GET /api/uploads
 * @desc List uploads for user or job
 */
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { jobId, uploadType } = req.query;

    const uploads = await uploadService.listUploads(req.user!.id, {
      jobId: jobId as string | undefined,
      uploadType: uploadType as string | undefined,
    });

    res.json({
      success: true,
      data: { uploads },
    });
  })
);

/**
 * @route GET /api/uploads/:id
 * @desc Get upload by ID
 */
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const uploadRecord = await uploadService.getUpload(req.params.id, req.user!.id);

    res.json({
      success: true,
      data: { upload: uploadRecord },
    });
  })
);

/**
 * @route PUT /api/uploads/:id
 * @desc Update upload description
 */
router.put(
  '/:id',
  requireAuth,
  validate(updateUploadSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { description } = req.body;

    const uploadRecord = await uploadService.updateUpload(
      req.params.id,
      req.user!.id,
      description
    );

    res.json({
      success: true,
      message: 'Upload updated successfully',
      data: { upload: uploadRecord },
    });
  })
);

/**
 * @route DELETE /api/uploads/:id
 * @desc Delete upload
 */
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    await uploadService.deleteUpload(req.params.id, req.user!.id);

    res.json({
      success: true,
      message: 'Upload deleted successfully',
    });
  })
);

/**
 * @route GET /api/uploads/job/:jobId
 * @desc Get uploads for a specific job (with secret token support)
 */
router.get(
  '/job/:jobId',
  asyncHandler(async (req: Request, res: Response) => {
    const { jobId } = req.params;
    const { rf } = req.query; // Secret token

    // Get user from optional auth header
    let userId: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.substring(7);
        // Simple decode - in production, verify JWT properly
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(
          token,
          process.env.JWT_ACCESS_SECRET || 'access-secret-change-in-production'
        ) as { sub: string };
        userId = decoded.sub;
      } catch {
        // Invalid token, continue without auth
      }
    }

    const uploads = await uploadService.getJobUploads(
      jobId,
      userId,
      rf as string | undefined
    );

    res.json({
      success: true,
      data: { uploads },
    });
  })
);

export default router;
