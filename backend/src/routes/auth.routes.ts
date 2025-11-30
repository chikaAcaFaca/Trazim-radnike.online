import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { authService } from '../services/auth.service.js';
import { emailService } from '../services/email.service.js';
import { oauthService } from '../services/oauth.service.js';
import { smsService } from '../services/sms.service.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../config/database.js';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number format')
      .optional(),
    gdprConsent: z.literal(true, {
      errorMap: () => ({ message: 'GDPR consent is required' }),
    }),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
  }),
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
});

const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
  }),
});

const sendPhoneCodeSchema = z.object({
  body: z.object({
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number format')
      .optional(),
  }),
});

const verifyPhoneSchema = z.object({
  body: z.object({
    code: z.string().length(6, 'Code must be 6 digits'),
  }),
});

const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
  }),
});

const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
  }),
});

// Helper for async route handlers
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 */
router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, phone, gdprConsent } = req.body;

    logger.info({ email }, 'New user registration attempt');

    const result = await authService.register({
      email,
      password,
      phone,
      gdprConsent,
    });

    // Create email verification token and send email
    const emailToken = await authService.createEmailVerificationToken(result.user.id);
    await emailService.sendVerificationEmail(result.user.email, emailToken);

    logger.info({ email: result.user.email }, 'Verification email sent');

    res.status(201).json({
      success: true,
      message: 'Registracija uspešna. Proverite email za verifikaciju.',
      data: {
        user: result.user,
        tokens: result.tokens,
      },
    });
  })
);

/**
 * @route POST /api/auth/login
 * @desc Login user
 */
router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;

    logger.info({ email }, 'Login attempt');

    const result = await authService.login({ email, password });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        tokens: result.tokens,
      },
    });
  })
);

/**
 * @route POST /api/auth/refresh
 * @desc Refresh access token
 */
router.post(
  '/refresh',
  validate(refreshSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;

    const tokens = await authService.refreshTokens(refreshToken);

    res.json({
      success: true,
      data: { tokens },
    });
  })
);

/**
 * @route POST /api/auth/logout
 * @desc Logout user (client-side token removal)
 */
router.post('/logout', requireAuth, (_req: Request, res: Response) => {
  // JWT tokens are stateless, so logout is handled client-side
  // In production, you might want to implement token blacklisting
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

/**
 * @route GET /api/auth/me
 * @desc Get current user
 */
router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getUserById(req.user!.id);

    res.json({
      success: true,
      data: { user },
    });
  })
);

/**
 * @route POST /api/auth/email/verify
 * @desc Verify email with token
 */
router.post(
  '/email/verify',
  validate(verifyEmailSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.body;

    await authService.verifyEmail(token);

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  })
);

/**
 * @route POST /api/auth/email/resend
 * @desc Resend email verification
 */
router.post(
  '/email/resend',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    // Get user email
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { email: true, emailVerified: true },
    });

    if (!user) {
      throw new ApiError(404, 'Korisnik nije pronađen');
    }

    if (user.emailVerified) {
      throw new ApiError(400, 'Email je već verifikovan');
    }

    const emailToken = await authService.createEmailVerificationToken(req.user!.id);
    await emailService.sendVerificationEmail(user.email, emailToken);

    logger.info({ email: user.email }, 'Verification email resent');

    res.json({
      success: true,
      message: 'Verifikacioni email je poslat',
    });
  })
);

/**
 * @route POST /api/auth/phone/send-code
 * @desc Send phone verification code
 */
router.post(
  '/phone/send-code',
  requireAuth,
  validate(sendPhoneCodeSchema),
  asyncHandler(async (req: Request, res: Response) => {
    // Get user's phone number
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { phone: true, phoneVerified: true },
    });

    if (!user) {
      throw new ApiError(404, 'Korisnik nije pronađen');
    }

    // Check if phone number exists
    const phone = req.body.phone || user.phone;
    if (!phone) {
      throw new ApiError(400, 'Broj telefona nije unet');
    }

    // Update phone if new one provided
    if (req.body.phone && req.body.phone !== user.phone) {
      await prisma.user.update({
        where: { id: req.user!.id },
        data: { phone: req.body.phone, phoneVerified: false },
      });
    }

    if (user.phoneVerified && !req.body.phone) {
      throw new ApiError(400, 'Telefon je već verifikovan');
    }

    const code = await authService.createPhoneVerificationCode(req.user!.id);

    // Send SMS via Twilio
    const smsSent = await smsService.sendVerificationCode(phone, code);

    if (!smsSent && process.env.NODE_ENV === 'production') {
      throw new ApiError(500, 'Greška pri slanju SMS-a. Pokušajte ponovo.');
    }

    logger.info({ phone, smsSent }, 'Phone verification code sent');

    res.json({
      success: true,
      message: 'Verifikacioni kod je poslat na vaš telefon',
      // Only include code in development if SMS wasn't sent
      ...(process.env.NODE_ENV === 'development' && !smsSent && { devCode: code }),
    });
  })
);

/**
 * @route POST /api/auth/phone/verify
 * @desc Verify phone with code
 */
router.post(
  '/phone/verify',
  requireAuth,
  validate(verifyPhoneSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.body;

    await authService.verifyPhone(req.user!.id, code);

    res.json({
      success: true,
      message: 'Phone verified successfully',
    });
  })
);

/**
 * @route POST /api/auth/forgot-password
 * @desc Request password reset
 */
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    const token = await authService.createPasswordResetToken(email);

    // Send email if token was created (user exists)
    if (token) {
      await emailService.sendPasswordResetEmail(email, token);
      logger.info({ email }, 'Password reset email sent');
    }

    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'Ako email postoji, link za reset lozinke je poslat',
    });
  })
);

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password with token
 */
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { token, password } = req.body;

    await authService.resetPassword(token, password);

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  })
);

// ==========================================
// OAuth Routes
// ==========================================

/**
 * @route GET /api/auth/oauth/providers
 * @desc Get available OAuth providers
 */
router.get('/oauth/providers', (_req: Request, res: Response) => {
  const providers = oauthService.getAvailableProviders();
  res.json({
    success: true,
    data: { providers },
  });
});

/**
 * @route GET /api/auth/oauth/google
 * @desc Get Google OAuth URL
 */
router.get(
  '/oauth/google',
  asyncHandler(async (_req: Request, res: Response) => {
    if (!oauthService.isProviderConfigured('google')) {
      throw new ApiError(400, 'Google OAuth nije dostupan');
    }
    const url = oauthService.getGoogleAuthUrl();
    res.json({
      success: true,
      data: { url },
    });
  })
);

/**
 * @route POST /api/auth/oauth/google/callback
 * @desc Handle Google OAuth callback
 */
router.post(
  '/oauth/google/callback',
  asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.body;

    if (!code) {
      throw new ApiError(400, 'Authorization code je obavezan');
    }

    const result = await oauthService.handleGoogleCallback(code);

    logger.info({ email: result.user.email }, 'Google OAuth login successful');

    res.json({
      success: true,
      message: result.isNewUser ? 'Nalog je kreiran' : 'Uspešna prijava',
      data: {
        user: result.user,
        tokens: result.tokens,
        isNewUser: result.isNewUser,
      },
    });
  })
);

/**
 * @route GET /api/auth/oauth/facebook
 * @desc Get Facebook OAuth URL
 */
router.get(
  '/oauth/facebook',
  asyncHandler(async (_req: Request, res: Response) => {
    if (!oauthService.isProviderConfigured('facebook')) {
      throw new ApiError(400, 'Facebook OAuth nije dostupan');
    }
    const url = oauthService.getFacebookAuthUrl();
    res.json({
      success: true,
      data: { url },
    });
  })
);

/**
 * @route POST /api/auth/oauth/facebook/callback
 * @desc Handle Facebook OAuth callback
 */
router.post(
  '/oauth/facebook/callback',
  asyncHandler(async (req: Request, res: Response) => {
    const { code } = req.body;

    if (!code) {
      throw new ApiError(400, 'Authorization code je obavezan');
    }

    const result = await oauthService.handleFacebookCallback(code);

    logger.info({ email: result.user.email }, 'Facebook OAuth login successful');

    res.json({
      success: true,
      message: result.isNewUser ? 'Nalog je kreiran' : 'Uspešna prijava',
      data: {
        user: result.user,
        tokens: result.tokens,
        isNewUser: result.isNewUser,
      },
    });
  })
);

/**
 * @route POST /api/auth/oauth/facebook/deletion
 * @desc Facebook Data Deletion Callback
 * Required by Facebook for GDPR compliance
 * https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback
 */
router.post(
  '/oauth/facebook/deletion',
  asyncHandler(async (req: Request, res: Response) => {
    const { signed_request } = req.body;

    if (!signed_request) {
      throw new ApiError(400, 'signed_request is required');
    }

    try {
      // Parse the signed request from Facebook
      // Note: encodedSig can be used for HMAC verification with FACEBOOK_APP_SECRET
      const [_encodedSig, payload] = signed_request.split('.');

      // Decode the payload
      const data = JSON.parse(
        Buffer.from(payload, 'base64').toString('utf-8')
      );

      const userId = data.user_id;

      logger.info({ facebookUserId: userId }, 'Facebook data deletion request received');

      // Find user by Facebook ID and soft delete their data
      const user = await prisma.user.findFirst({
        where: { oauthId: userId, oauthProvider: 'facebook' },
      });

      if (user) {
        // Soft delete user data
        await prisma.user.update({
          where: { id: user.id },
          data: {
            deletedAt: new Date(),
            email: `deleted_${user.id}@deleted.local`,
            phone: null,
            oauthId: null,
            oauthProvider: null,
          },
        });

        logger.info({ userId: user.id }, 'User data deleted per Facebook request');
      }

      // Generate a confirmation code for Facebook
      const confirmationCode = `DEL_${Date.now()}_${userId}`;

      // Facebook expects this specific response format
      res.json({
        url: `https://trazim-radnike.online/deletion-status?id=${confirmationCode}`,
        confirmation_code: confirmationCode,
      });
    } catch (error) {
      logger.error({ error }, 'Error processing Facebook deletion request');
      throw new ApiError(400, 'Invalid signed_request');
    }
  })
);

export default router;
