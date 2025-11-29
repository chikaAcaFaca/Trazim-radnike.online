import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { postService } from '../services/post.service.js';
import { uploadService } from '../services/upload.service.js';

const router = Router();

// Multer configuration for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max per image
  },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Validation schemas
const createPostSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    content: z.string().min(10, 'Content must be at least 10 characters').max(5000),
    type: z.enum(['STORY', 'PROMO', 'NEWS', 'UPDATE']).optional(),
    excerpt: z.string().max(300).optional(),
    ogTitle: z.string().max(100).optional(),
    ogDescription: z.string().max(200).optional(),
  }),
});

const updatePostSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200).optional(),
    content: z.string().min(10).max(5000).optional(),
    type: z.enum(['STORY', 'PROMO', 'NEWS', 'UPDATE']).optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
    excerpt: z.string().max(300).optional().nullable(),
    coverImage: z.string().url().optional().nullable(),
    ogTitle: z.string().max(100).optional().nullable(),
    ogDescription: z.string().max(200).optional().nullable(),
  }),
});

// Helper for async route handlers
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ==========================================
// PRIVATE ROUTES (require authentication)
// ==========================================

/**
 * @route POST /api/posts
 * @desc Create a new post
 */
router.post(
  '/',
  requireAuth,
  validate(createPostSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const post = await postService.createPost(req.user!.id, req.body);

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: { post },
    });
  })
);

/**
 * @route GET /api/posts
 * @desc Get all posts for current user's company
 */
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await postService.getPostsByUserId(req.user!.id, page, limit);

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * @route GET /api/posts/:id
 * @desc Get single post by ID (owner view)
 */
router.get(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const post = await postService.getPostById(req.user!.id, req.params.id);

    res.json({
      success: true,
      data: { post },
    });
  })
);

/**
 * @route PUT /api/posts/:id
 * @desc Update a post
 */
router.put(
  '/:id',
  requireAuth,
  validate(updatePostSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const post = await postService.updatePost(req.user!.id, req.params.id, req.body);

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: { post },
    });
  })
);

/**
 * @route DELETE /api/posts/:id
 * @desc Delete a post
 */
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    await postService.deletePost(req.user!.id, req.params.id);

    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  })
);

/**
 * @route POST /api/posts/:id/images
 * @desc Upload image to post
 */
router.post(
  '/:id/images',
  requireAuth,
  upload.single('image'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file provided',
      });
      return;
    }

    // Save the image file
    const { url, fileName } = await uploadService.saveFile(
      req.file,
      req.user!.id,
      'POST_IMAGE'
    );

    // Add to post
    const image = await postService.addImageToPost(req.user!.id, req.params.id, {
      url,
      fileName,
      fileSize: req.file.size,
      caption: req.body.caption,
    });

    res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: { image },
    });
  })
);

/**
 * @route DELETE /api/posts/:id/images/:imageId
 * @desc Remove image from post
 */
router.delete(
  '/:id/images/:imageId',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    await postService.removeImageFromPost(req.user!.id, req.params.id, req.params.imageId);

    res.json({
      success: true,
      message: 'Image removed successfully',
    });
  })
);

/**
 * @route POST /api/posts/:id/publish
 * @desc Publish a post
 */
router.post(
  '/:id/publish',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const post = await postService.updatePost(req.user!.id, req.params.id, {
      status: 'PUBLISHED',
    });

    res.json({
      success: true,
      message: 'Post published successfully',
      data: { post },
    });
  })
);

// ==========================================
// PUBLIC ROUTES (no authentication)
// ==========================================

/**
 * @route GET /api/posts/public/:slug
 * @desc Get public post by slug
 */
router.get(
  '/public/:slug',
  asyncHandler(async (req: Request, res: Response) => {
    const post = await postService.getPublicPostBySlug(req.params.slug);

    res.json({
      success: true,
      data: { post },
    });
  })
);

/**
 * @route GET /api/posts/company/:companySlug
 * @desc Get public posts by company slug
 */
router.get(
  '/company/:companySlug',
  asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await postService.getPublicPostsByCompanySlug(
      req.params.companySlug,
      page,
      limit
    );

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * @route POST /api/posts/public/:slug/share
 * @desc Track share action
 */
router.post(
  '/public/:slug/share',
  asyncHandler(async (req: Request, res: Response) => {
    const post = await postService.getPublicPostBySlug(req.params.slug);
    await postService.incrementShareCount(post.id);

    res.json({
      success: true,
      message: 'Share tracked',
    });
  })
);

export default router;
