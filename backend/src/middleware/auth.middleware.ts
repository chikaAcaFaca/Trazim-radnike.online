import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../config/database.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        phone?: string | null;
        phoneVerified: boolean;
        role: string;
        profileType: string;
      };
    }
  }
}

/**
 * Extract Bearer token from Authorization header
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Middleware to require authentication
 * Verifies JWT token and attaches user to request
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new ApiError(401, 'Authentication required');
    }

    const payload = authService.verifyAccessToken(token);

    // Fetch full user data for additional fields
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        phone: true,
        phoneVerified: true,
        role: true,
        profileType: true,
      },
    });

    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    req.user = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      phoneVerified: user.phoneVerified,
      role: user.role,
      profileType: user.profileType,
    };

    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else {
      next(new ApiError(401, 'Invalid authentication token'));
    }
  }
}

/**
 * Middleware to optionally parse authentication
 * Does not throw error if no token provided
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);

    if (token) {
      const payload = authService.verifyAccessToken(token);

      // Fetch full user data
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          phone: true,
          phoneVerified: true,
          role: true,
          profileType: true,
        },
      });

      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          phone: user.phone,
          phoneVerified: user.phoneVerified,
          role: user.role,
          profileType: user.profileType,
        };
      }
    }

    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
}

/**
 * Middleware to require specific role(s)
 * Must be used after requireAuth
 */
export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Insufficient permissions'));
    }

    next();
  };
}

/**
 * Middleware to require admin role
 */
export const requireAdmin = requireRole('ADMIN');

/**
 * Alias for requireAuth (for cleaner code)
 */
export const authenticate = requireAuth;

/**
 * Middleware to require employer role or higher
 */
export const requireEmployer = requireRole('EMPLOYER', 'ADMIN');

/**
 * Middleware to require verified phone
 * Must be used after requireAuth
 */
export async function requireVerifiedPhone(req: Request, _res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { phoneVerified: true },
    });

    if (!user?.phoneVerified) {
      throw new ApiError(403, 'Phone verification required');
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to require verified email
 * Must be used after requireAuth
 */
export async function requireVerifiedEmail(req: Request, _res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      throw new ApiError(401, 'Authentication required');
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { emailVerified: true },
    });

    if (!user?.emailVerified) {
      throw new ApiError(403, 'Email verification required');
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to check resource ownership
 * Allows ADMIN to bypass ownership check
 */
export function requireOwnership(
  getResourceUserId: (req: Request) => Promise<string | null>
) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Authentication required');
      }

      // Admin can access any resource
      if (req.user.role === 'ADMIN') {
        return next();
      }

      const resourceUserId = await getResourceUserId(req);

      if (!resourceUserId) {
        throw new ApiError(404, 'Resource not found');
      }

      if (resourceUserId !== req.user.id) {
        throw new ApiError(403, 'Access denied');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
