import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

// Types
export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterInput {
  email: string;
  password: string;
  phone?: string;
  gdprConsent: boolean;
}

export interface LoginInput {
  email: string;
  password: string;
}

// Token expiry parsing
function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 900; // Default 15 minutes

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 60 * 60 * 24;
    default: return 900;
  }
}

class AuthService {
  private readonly SALT_ROUNDS = 12;
  private readonly accessTokenExpiry: number;
  private readonly refreshTokenExpiry: number;

  constructor() {
    this.accessTokenExpiry = parseExpiry(env.JWT_EXPIRES_IN);
    // Refresh token expiry is used in generateRefreshToken
    this.refreshTokenExpiry = parseExpiry(env.JWT_REFRESH_EXPIRES_IN);
  }

  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compare a password with its hash
   */
  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT access token
   */
  generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: this.accessTokenExpiry,
    });
  }

  /**
   * Generate JWT refresh token
   */
  generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
      expiresIn: this.refreshTokenExpiry,
    });
  }

  /**
   * Generate both access and refresh tokens
   */
  generateTokens(user: { id: string; email: string; role: string }): AuthTokens {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
      expiresIn: this.accessTokenExpiry,
    };
  }

  /**
   * Verify and decode access token
   */
  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    } catch (error) {
      throw new ApiError(401, 'Invalid or expired access token');
    }
  }

  /**
   * Verify and decode refresh token
   */
  verifyRefreshToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
    } catch (error) {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }
  }

  /**
   * Register a new user
   */
  async register(input: RegisterInput) {
    const { email, password, phone, gdprConsent } = input;

    // Check GDPR consent
    if (!gdprConsent) {
      throw new ApiError(400, 'GDPR consent is required');
    }

    // Check if email exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existingEmail) {
      throw new ApiError(400, 'Email is already registered');
    }

    // Check if phone exists (if provided)
    if (phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone },
      });
      if (existingPhone) {
        throw new ApiError(400, 'Phone number is already registered');
      }
    }

    // Validate password strength
    this.validatePassword(password);

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        phone: phone || null,
        passwordHash,
        role: 'EMPLOYER',
        gdprConsent: true,
        gdprConsentAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokens = this.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, tokens };
  }

  /**
   * Login user with email and password
   */
  async login(input: LoginInput) {
    const { email, password } = input;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Check if user is soft-deleted
    if (user.deletedAt) {
      throw new ApiError(401, 'Account has been deactivated');
    }

    // Verify password
    const isValidPassword = await this.comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new ApiError(401, 'Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const tokens = this.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        phoneVerified: user.phoneVerified,
        emailVerified: user.emailVerified,
        role: user.role,
      },
      tokens,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(refreshToken: string) {
    // Verify refresh token
    const payload = this.verifyRefreshToken(refreshToken);

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user || user.deletedAt) {
      throw new ApiError(401, 'User not found or deactivated');
    }

    // Generate new tokens
    return this.generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        phoneVerified: true,
        emailVerified: true,
        role: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
            country: true,
            city: true,
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    return user;
  }

  /**
   * Validate password strength
   */
  private validatePassword(password: string): void {
    if (password.length < 8) {
      throw new ApiError(400, 'Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      throw new ApiError(400, 'Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      throw new ApiError(400, 'Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      throw new ApiError(400, 'Password must contain at least one number');
    }
  }

  /**
   * Generate a secure random token
   */
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Create email verification token
   */
  async createEmailVerificationToken(userId: string): Promise<string> {
    const token = this.generateSecureToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verificationToken.create({
      data: {
        userId,
        token,
        type: 'EMAIL_VERIFICATION',
        expiresAt,
      },
    });

    return token;
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string) {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      throw new ApiError(400, 'Invalid verification token');
    }

    if (verificationToken.type !== 'EMAIL_VERIFICATION') {
      throw new ApiError(400, 'Invalid token type');
    }

    if (verificationToken.usedAt) {
      throw new ApiError(400, 'Token has already been used');
    }

    if (verificationToken.expiresAt < new Date()) {
      throw new ApiError(400, 'Token has expired');
    }

    // Update user and token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerified: true },
      }),
      prisma.verificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { success: true };
  }

  /**
   * Create phone verification code
   */
  async createPhoneVerificationCode(userId: string): Promise<string> {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing phone verification tokens for this user
    await prisma.verificationToken.deleteMany({
      where: {
        userId,
        type: 'PHONE_VERIFICATION',
      },
    });

    // Create new token
    await prisma.verificationToken.create({
      data: {
        userId,
        token: code,
        type: 'PHONE_VERIFICATION',
        expiresAt,
      },
    });

    return code;
  }

  /**
   * Verify phone with code
   */
  async verifyPhone(userId: string, code: string) {
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        userId,
        token: code,
        type: 'PHONE_VERIFICATION',
      },
    });

    if (!verificationToken) {
      throw new ApiError(400, 'Invalid verification code');
    }

    if (verificationToken.usedAt) {
      throw new ApiError(400, 'Code has already been used');
    }

    if (verificationToken.expiresAt < new Date()) {
      throw new ApiError(400, 'Code has expired');
    }

    // Update user and token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { phoneVerified: true },
      }),
      prisma.verificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { success: true };
  }

  /**
   * Create password reset token
   */
  async createPasswordResetToken(email: string): Promise<string | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't reveal if user exists
      return null;
    }

    const token = this.generateSecureToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.verificationToken.create({
      data: {
        userId: user.id,
        token,
        type: 'PASSWORD_RESET',
        expiresAt,
      },
    });

    return token;
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string) {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      throw new ApiError(400, 'Invalid reset token');
    }

    if (verificationToken.type !== 'PASSWORD_RESET') {
      throw new ApiError(400, 'Invalid token type');
    }

    if (verificationToken.usedAt) {
      throw new ApiError(400, 'Token has already been used');
    }

    if (verificationToken.expiresAt < new Date()) {
      throw new ApiError(400, 'Token has expired');
    }

    // Validate new password
    this.validatePassword(newPassword);

    // Hash new password
    const passwordHash = await this.hashPassword(newPassword);

    // Update user and token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: verificationToken.userId },
        data: { passwordHash },
      }),
      prisma.verificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { success: true };
  }
}

export const authService = new AuthService();
