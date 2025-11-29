import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { requireAuth, optionalAuth, requireVerifiedPhone } from '../middleware/auth.middleware.js';
import { jobService } from '../services/job.service.js';

const router = Router();

// Validation schemas
const createJobSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    descriptionFull: z.string().min(50, 'Description must be at least 50 characters'),
    descriptionPublic: z.string().max(500).optional(),
    salary: z.string().max(100).optional(),
    salaryMin: z.number().min(0).optional(),
    salaryMax: z.number().min(0).optional(),
    salaryCurrency: z.enum(['EUR', 'USD', 'RSD', 'HRK', 'BAM']).optional(),
    numWorkers: z.number().min(1).max(1000),
    location: z.string().min(2, 'Location is required').max(200),
    locationCity: z.string().max(100).optional(),
    locationCountry: z.string().length(2).optional(),
    workHours: z.string().max(200).optional(),
    housing: z.boolean().optional(),
    housingDesc: z.string().max(500).optional(),
    experience: z.string().max(500).optional(),
    languages: z.array(z.string()).optional(),
    requirements: z.string().max(1000).optional(),
    benefits: z.string().max(1000).optional(),
    urgency: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
  }),
});

const updateJobSchema = z.object({
  body: z.object({
    title: z.string().min(3).max(200).optional(),
    descriptionFull: z.string().min(50).optional(),
    descriptionPublic: z.string().max(500).optional().nullable(),
    salary: z.string().max(100).optional().nullable(),
    salaryMin: z.number().min(0).optional().nullable(),
    salaryMax: z.number().min(0).optional().nullable(),
    salaryCurrency: z.enum(['EUR', 'USD', 'RSD', 'HRK', 'BAM']).optional(),
    numWorkers: z.number().min(1).max(1000).optional(),
    location: z.string().min(2).max(200).optional(),
    locationCity: z.string().max(100).optional().nullable(),
    locationCountry: z.string().length(2).optional().nullable(),
    workHours: z.string().max(200).optional().nullable(),
    housing: z.boolean().optional(),
    housingDesc: z.string().max(500).optional().nullable(),
    experience: z.string().max(500).optional().nullable(),
    languages: z.array(z.string()).optional(),
    requirements: z.string().max(1000).optional().nullable(),
    benefits: z.string().max(1000).optional().nullable(),
    urgency: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']).optional(),
    status: z.enum(['DRAFT', 'POSTED', 'CLOSED', 'FILLED']).optional(),
    visibility: z.enum(['PRIVATE', 'SECRET', 'PUBLIC']).optional(),
  }),
});

const secretLinkSchema = z.object({
  body: z.object({
    expiresInDays: z.number().min(1).max(365).optional(),
  }),
});

// Helper for async route handlers
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * @route POST /api/jobs
 * @desc Create a new job
 */
router.post(
  '/',
  requireAuth,
  requireVerifiedPhone,
  validate(createJobSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const job = await jobService.createJob(req.user!.id, req.body);

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: { job },
    });
  })
);

/**
 * @route GET /api/jobs
 * @desc List user's jobs
 */
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { status, visibility, search } = req.query;

    const jobs = await jobService.listJobs(req.user!.id, {
      status: status as string | undefined,
      visibility: visibility as string | undefined,
      search: search as string | undefined,
    });

    res.json({
      success: true,
      data: { jobs },
    });
  })
);

/**
 * @route GET /api/jobs/search
 * @desc Search public jobs (for job board)
 */
router.get(
  '/search',
  asyncHandler(async (req: Request, res: Response) => {
    const { q, location, page, limit } = req.query;

    const { adminService } = await import('../services/admin.service.js');
    const result = await adminService.searchPublicJobs({
      query: q as string | undefined,
      location: location as string | undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    res.json({
      success: true,
      data: result,
    });
  })
);

/**
 * @route GET /api/jobs/public/:slug
 * @desc Get public job view by slug
 */
router.get(
  '/public/:slug',
  asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;
    const { rf } = req.query; // Secret token from query param

    const job = await jobService.getJobBySlug(slug, rf as string | undefined);

    res.json({
      success: true,
      data: { job },
    });
  })
);

/**
 * @route GET /api/jobs/:id
 * @desc Get job by ID
 */
router.get(
  '/:id',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { rf } = req.query; // Secret token from query param

    const job = await jobService.getJob(id, req.user?.id, rf as string | undefined);

    res.json({
      success: true,
      data: { job },
    });
  })
);

/**
 * @route PUT /api/jobs/:id
 * @desc Update job
 */
router.put(
  '/:id',
  requireAuth,
  validate(updateJobSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const job = await jobService.updateJob(req.params.id, req.user!.id, req.body);

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: { job },
    });
  })
);

/**
 * @route DELETE /api/jobs/:id
 * @desc Delete job (soft delete)
 */
router.delete(
  '/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    await jobService.deleteJob(req.params.id, req.user!.id);

    res.json({
      success: true,
      message: 'Job deleted successfully',
    });
  })
);

/**
 * @route POST /api/jobs/:id/publish
 * @desc Publish job
 */
router.post(
  '/:id/publish',
  requireAuth,
  requireVerifiedPhone,
  asyncHandler(async (req: Request, res: Response) => {
    const job = await jobService.publishJob(req.params.id, req.user!.id);

    res.json({
      success: true,
      message: 'Job published successfully',
      data: { job },
    });
  })
);

/**
 * @route POST /api/jobs/:id/close
 * @desc Close job
 */
router.post(
  '/:id/close',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const job = await jobService.updateJob(req.params.id, req.user!.id, {
      status: 'CLOSED',
    });

    res.json({
      success: true,
      message: 'Job closed successfully',
      data: { job },
    });
  })
);

/**
 * @route POST /api/jobs/:id/secret
 * @desc Generate secret link for job
 */
router.post(
  '/:id/secret',
  requireAuth,
  validate(secretLinkSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { expiresInDays } = req.body;

    const result = await jobService.generateSecretLink(
      req.params.id,
      req.user!.id,
      expiresInDays
    );

    // Generate full URL
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const secretUrl = `${baseUrl}/oglas/${req.params.id}?rf=${result.secretToken}`;

    res.json({
      success: true,
      message: 'Secret link generated',
      data: {
        secretToken: result.secretToken,
        secretExpiresAt: result.secretExpiresAt,
        secretUrl,
      },
    });
  })
);

/**
 * @route POST /api/jobs/:id/secret/reset
 * @desc Reset (invalidate) secret link
 */
router.post(
  '/:id/secret/reset',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    await jobService.resetSecretLink(req.params.id, req.user!.id);

    res.json({
      success: true,
      message: 'Secret link invalidated',
    });
  })
);

export default router;
