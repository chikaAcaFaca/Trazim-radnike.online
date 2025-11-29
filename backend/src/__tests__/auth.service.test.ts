import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock bcrypt
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
    verify: vi.fn(),
  },
}));

// Mock env
vi.mock('../config/env.js', () => ({
  env: {
    JWT_SECRET: 'test-jwt-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    JWT_EXPIRES_IN: '15m',
    JWT_REFRESH_EXPIRES_IN: '7d',
  },
}));

// Import after mocks
import { authService } from '../services/auth.service.js';
import { prisma } from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash password with bcrypt', async () => {
      const password = 'TestPassword123';
      const hashedPassword = 'hashed_password';
      vi.mocked(bcrypt.hash).mockResolvedValue(hashedPassword as never);

      const result = await authService.hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
      expect(result).toBe(hashedPassword);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching passwords', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await authService.comparePassword('password', 'hash');

      expect(bcrypt.compare).toHaveBeenCalledWith('password', 'hash');
      expect(result).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const result = await authService.comparePassword('wrong', 'hash');

      expect(result).toBe(false);
    });
  });

  describe('generateTokens', () => {
    it('should generate access and refresh tokens', () => {
      vi.mocked(jwt.sign).mockReturnValue('mocked_token' as never);

      const user = { id: 'user-123', email: 'test@test.com', role: 'EMPLOYER' };
      const tokens = authService.generateTokens(user);

      expect(jwt.sign).toHaveBeenCalledTimes(2);
      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(tokens).toHaveProperty('expiresIn');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify and return payload for valid token', () => {
      const payload = { userId: 'user-123', email: 'test@test.com', role: 'EMPLOYER' };
      vi.mocked(jwt.verify).mockReturnValue(payload as never);

      const result = authService.verifyAccessToken('valid_token');

      expect(jwt.verify).toHaveBeenCalledWith('valid_token', 'test-jwt-secret');
      expect(result).toEqual(payload);
    });

    it('should throw ApiError for invalid token', () => {
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => authService.verifyAccessToken('invalid_token')).toThrow(ApiError);
    });
  });

  describe('register', () => {
    it('should throw error if GDPR consent is not given', async () => {
      await expect(authService.register({
        email: 'test@test.com',
        password: 'TestPassword123',
        gdprConsent: false,
      })).rejects.toThrow('GDPR consent is required');
    });

    it('should throw error if email already exists', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'existing-user',
        email: 'test@test.com',
      } as any);

      await expect(authService.register({
        email: 'test@test.com',
        password: 'TestPassword123',
        gdprConsent: true,
      })).rejects.toThrow('Email is already registered');
    });

    it('should throw error if password is too short', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(authService.register({
        email: 'test@test.com',
        password: 'short',
        gdprConsent: true,
      })).rejects.toThrow('Password must be at least 8 characters');
    });

    it('should throw error if password lacks uppercase', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(authService.register({
        email: 'test@test.com',
        password: 'testpassword123',
        gdprConsent: true,
      })).rejects.toThrow('uppercase');
    });

    it('should throw error if password lacks lowercase', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(authService.register({
        email: 'test@test.com',
        password: 'TESTPASSWORD123',
        gdprConsent: true,
      })).rejects.toThrow('lowercase');
    });

    it('should throw error if password lacks number', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(authService.register({
        email: 'test@test.com',
        password: 'TestPassword',
        gdprConsent: true,
      })).rejects.toThrow('number');
    });

    it('should create user with valid input', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed_password' as never);
      vi.mocked(jwt.sign).mockReturnValue('mocked_token' as never);
      vi.mocked(prisma.user.create).mockResolvedValue({
        id: 'new-user-id',
        email: 'test@test.com',
        phone: null,
        role: 'EMPLOYER',
        createdAt: new Date(),
      } as any);

      const result = await authService.register({
        email: 'test@test.com',
        password: 'TestPassword123',
        gdprConsent: true,
      });

      expect(prisma.user.create).toHaveBeenCalled();
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
    });
  });

  describe('login', () => {
    it('should throw error if user not found', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(authService.login({
        email: 'test@test.com',
        password: 'TestPassword123',
      })).rejects.toThrow('Invalid email or password');
    });

    it('should throw error if user is deleted', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        email: 'test@test.com',
        passwordHash: 'hash',
        deletedAt: new Date(),
      } as any);

      await expect(authService.login({
        email: 'test@test.com',
        password: 'TestPassword123',
      })).rejects.toThrow('Account has been deactivated');
    });

    it('should throw error if password is incorrect', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        email: 'test@test.com',
        passwordHash: 'hash',
        deletedAt: null,
      } as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(authService.login({
        email: 'test@test.com',
        password: 'WrongPassword123',
      })).rejects.toThrow('Invalid email or password');
    });

    it('should login successfully with valid credentials', async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        email: 'test@test.com',
        phone: '+381601234567',
        phoneVerified: true,
        emailVerified: false,
        passwordHash: 'hash',
        role: 'EMPLOYER',
        deletedAt: null,
      } as any);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);
      vi.mocked(jwt.sign).mockReturnValue('mocked_token' as never);

      const result = await authService.login({
        email: 'test@test.com',
        password: 'TestPassword123',
      });

      expect(prisma.user.update).toHaveBeenCalled();
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe('test@test.com');
    });
  });

  describe('refreshTokens', () => {
    it('should throw error for invalid refresh token', async () => {
      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('Invalid');
      });

      await expect(authService.refreshTokens('invalid_token'))
        .rejects.toThrow(ApiError);
    });

    it('should throw error if user not found', async () => {
      vi.mocked(jwt.verify).mockReturnValue({
        userId: 'user-123',
        email: 'test@test.com',
        role: 'EMPLOYER',
      } as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(authService.refreshTokens('valid_token'))
        .rejects.toThrow('User not found or deactivated');
    });

    it('should generate new tokens for valid refresh', async () => {
      vi.mocked(jwt.verify).mockReturnValue({
        userId: 'user-123',
        email: 'test@test.com',
        role: 'EMPLOYER',
      } as never);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        email: 'test@test.com',
        role: 'EMPLOYER',
        deletedAt: null,
      } as any);
      vi.mocked(jwt.sign).mockReturnValue('new_token' as never);

      const result = await authService.refreshTokens('valid_token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('generateSecureToken', () => {
    it('should generate token of specified length', () => {
      const token = authService.generateSecureToken(16);
      // 16 bytes = 32 hex characters
      expect(token.length).toBe(32);
    });

    it('should generate unique tokens', () => {
      const token1 = authService.generateSecureToken();
      const token2 = authService.generateSecureToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe('createPhoneVerificationCode', () => {
    it('should create 6-digit verification code', async () => {
      vi.mocked(prisma.verificationToken.deleteMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.verificationToken.create).mockResolvedValue({} as any);

      const code = await authService.createPhoneVerificationCode('user-123');

      expect(code.length).toBe(6);
      expect(parseInt(code)).toBeGreaterThanOrEqual(100000);
      expect(parseInt(code)).toBeLessThan(1000000);
    });

    it('should delete existing verification tokens', async () => {
      vi.mocked(prisma.verificationToken.deleteMany).mockResolvedValue({ count: 1 });
      vi.mocked(prisma.verificationToken.create).mockResolvedValue({} as any);

      await authService.createPhoneVerificationCode('user-123');

      expect(prisma.verificationToken.deleteMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-123',
          type: 'PHONE_VERIFICATION',
        },
      });
    });
  });

  describe('verifyPhone', () => {
    it('should throw error for invalid code', async () => {
      vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue(null);

      await expect(authService.verifyPhone('user-123', '123456'))
        .rejects.toThrow('Invalid verification code');
    });

    it('should throw error for already used code', async () => {
      vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue({
        id: 'token-123',
        userId: 'user-123',
        token: '123456',
        type: 'PHONE_VERIFICATION',
        usedAt: new Date(),
        expiresAt: new Date(Date.now() + 600000),
      } as any);

      await expect(authService.verifyPhone('user-123', '123456'))
        .rejects.toThrow('Code has already been used');
    });

    it('should throw error for expired code', async () => {
      vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue({
        id: 'token-123',
        userId: 'user-123',
        token: '123456',
        type: 'PHONE_VERIFICATION',
        usedAt: null,
        expiresAt: new Date(Date.now() - 1000), // Expired
      } as any);

      await expect(authService.verifyPhone('user-123', '123456'))
        .rejects.toThrow('Code has expired');
    });

    it('should verify phone successfully', async () => {
      vi.mocked(prisma.verificationToken.findFirst).mockResolvedValue({
        id: 'token-123',
        userId: 'user-123',
        token: '123456',
        type: 'PHONE_VERIFICATION',
        usedAt: null,
        expiresAt: new Date(Date.now() + 600000),
      } as any);
      vi.mocked(prisma.$transaction).mockResolvedValue([{}, {}]);

      const result = await authService.verifyPhone('user-123', '123456');

      expect(result.success).toBe(true);
    });
  });
});
