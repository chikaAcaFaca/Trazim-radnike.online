import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { profileService } from '../services/profile.service.js';
import { uploadService } from '../services/upload.service.js';

const router = Router();

// Multer configuration for logo upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max for logo
  },
  fileFilter: (_req, file, cb) => {
    // Only allow images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Validation schemas
const updateProfileSchema = z.object({
  body: z.object({
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number format')
      .optional()
      .nullable(),
  }),
});

const createCompanySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Company name must be at least 2 characters'),
    country: z.string().length(2, 'Country must be a 2-letter code'),
    city: z.string().min(2, 'City must be at least 2 characters').optional(),
    industry: z.string().min(2, 'Industry must be at least 2 characters').optional(),
    description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
    website: z.string().url('Invalid website URL').optional(),
    // Business registration fields
    pib: z.string().regex(/^\d{9}$/, 'PIB must be exactly 9 digits').optional(),
    maticniBroj: z.string().regex(/^\d{8}$/, 'Maticni broj must be exactly 8 digits').optional(),
    contactName: z.string().min(2, 'Contact name must be at least 2 characters').optional(),
    contactPhone: z.string().regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number format').optional(),
    address: z.string().max(500, 'Address must be less than 500 characters').optional(),
  }),
});

const updateCompanySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Company name must be at least 2 characters').optional(),
    country: z.string().length(2, 'Country must be a 2-letter code').optional(),
    city: z.string().min(2, 'City must be at least 2 characters').optional().nullable(),
    industry: z.string().min(2, 'Industry must be at least 2 characters').optional().nullable(),
    description: z.string().max(1000, 'Description must be less than 1000 characters').optional().nullable(),
    website: z.string().url('Invalid website URL').optional().nullable(),
    // Business registration fields
    pib: z.string().regex(/^\d{9}$/, 'PIB must be exactly 9 digits').optional().nullable(),
    maticniBroj: z.string().regex(/^\d{8}$/, 'Maticni broj must be exactly 8 digits').optional().nullable(),
    contactName: z.string().min(2, 'Contact name must be at least 2 characters').optional().nullable(),
    contactPhone: z.string().regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number format').optional().nullable(),
    contactEmail: z.string().email('Invalid email').optional().nullable(),
    address: z.string().max(500, 'Address must be less than 500 characters').optional().nullable(),
    // Location
    latitude: z.number().min(-90).max(90).optional().nullable(),
    longitude: z.number().min(-180).max(180).optional().nullable(),
    // Social media
    facebookUrl: z.string().url('Invalid Facebook URL').optional().nullable(),
    instagramUrl: z.string().url('Invalid Instagram URL').optional().nullable(),
    twitterUrl: z.string().url('Invalid X/Twitter URL').optional().nullable(),
    linkedinUrl: z.string().url('Invalid LinkedIn URL').optional().nullable(),
    eVizitkUrl: z.string().url('Invalid e-vizitka URL').optional().nullable(),
    bzrPortalUrl: z.string().url('Invalid BZR Portal URL').optional().nullable(),
    // Visibility
    isPublicProfile: z.boolean().optional(),
    // Profile customization
    profileTemplate: z.enum(['modern', 'classic', 'minimal', 'bold', 'elegant']).optional(),
    profileColorSet: z.enum(['blue', 'green', 'purple', 'orange', 'custom']).optional(),
    profilePrimaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional().nullable(),
    profileSecondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional().nullable(),
    profileAccentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional().nullable(),
  }),
});

// Helper for async route handlers
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * @route GET /api/profile
 * @desc Get current user profile with company
 */
router.get(
  '/',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const profile = await profileService.getProfile(req.user!.id);

    res.json({
      success: true,
      data: { profile },
    });
  })
);

/**
 * @route PUT /api/profile
 * @desc Update user profile (phone)
 */
router.put(
  '/',
  requireAuth,
  validate(updateProfileSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await profileService.updateProfile(req.user!.id, req.body);

    res.json({
      success: true,
      data: { user },
    });
  })
);

/**
 * @route GET /api/profile/stats
 * @desc Get user statistics (jobs, messages)
 */
router.get(
  '/stats',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await profileService.getUserStats(req.user!.id);

    res.json({
      success: true,
      data: { stats },
    });
  })
);

/**
 * @route GET /api/profile/jobs/recent
 * @desc Get recent jobs for dashboard
 */
router.get(
  '/jobs/recent',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const jobs = await profileService.getRecentJobs(req.user!.id);

    res.json({
      success: true,
      data: { jobs },
    });
  })
);

/**
 * @route POST /api/profile/company
 * @desc Create company for user
 */
router.post(
  '/company',
  requireAuth,
  validate(createCompanySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const company = await profileService.createCompany(req.user!.id, req.body);

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: { company },
    });
  })
);

/**
 * @route PUT /api/profile/company
 * @desc Update company
 */
router.put(
  '/company',
  requireAuth,
  validate(updateCompanySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const company = await profileService.updateCompany(req.user!.id, req.body);

    res.json({
      success: true,
      message: 'Company updated successfully',
      data: { company },
    });
  })
);

/**
 * @route GET /api/profile/company
 * @desc Get user's company
 */
router.get(
  '/company',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const company = await profileService.getCompanyByUserId(req.user!.id);

    res.json({
      success: true,
      data: { company },
    });
  })
);

/**
 * @route GET /api/profile/public/:slug
 * @desc Get public company profile (business card only - NO job listings)
 * @access Public
 */
router.get(
  '/public/:slug',
  asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.params;
    const company = await profileService.getPublicCompanyProfile(slug);

    res.json({
      success: true,
      data: { company },
    });
  })
);

/**
 * @route POST /api/profile/company/logo
 * @desc Upload company logo
 */
router.post(
  '/company/logo',
  requireAuth,
  upload.single('logo'),
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: 'No file provided',
      });
      return;
    }

    // Save the logo file
    const { url } = await uploadService.saveFile(
      req.file,
      req.user!.id,
      'COMPANY_LOGO'
    );

    // Update company with logo URL
    const company = await profileService.updateCompany(req.user!.id, {
      logoUrl: url,
    });

    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      data: {
        company,
        logoUrl: url,
      },
    });
  })
);

/**
 * @route DELETE /api/profile/company/logo
 * @desc Delete company logo
 */
router.delete(
  '/company/logo',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    // Update company to remove logo URL
    const company = await profileService.updateCompany(req.user!.id, {
      logoUrl: null,
    });

    res.json({
      success: true,
      message: 'Logo deleted successfully',
      data: { company },
    });
  })
);

export default router;
