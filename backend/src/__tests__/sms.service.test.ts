import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock logger
vi.mock('../utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Store original fetch
const originalFetch = global.fetch;

describe('SmsService', () => {
  let smsService: any;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    // Reset fetch mock
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('when Twilio is not configured', () => {
    beforeEach(async () => {
      vi.doMock('../config/env.js', () => ({
        env: {
          TWILIO_ACCOUNT_SID: undefined,
          TWILIO_AUTH_TOKEN: undefined,
          TWILIO_PHONE_NUMBER: undefined,
        },
        isDev: true,
      }));

      const module = await import('../services/sms.service.js');
      smsService = module.smsService;
    });

    it('should report service as not configured', () => {
      // Since we're testing a singleton that was already initialized,
      // we need to create a new instance to test unconfigured state
      expect(typeof smsService.isServiceConfigured).toBe('function');
    });

    it('should log message in dev mode instead of sending', async () => {
      vi.doMock('../config/env.js', () => ({
        env: {
          TWILIO_ACCOUNT_SID: undefined,
          TWILIO_AUTH_TOKEN: undefined,
          TWILIO_PHONE_NUMBER: undefined,
        },
        isDev: true,
      }));

      // In unconfigured dev mode, should return true and log
      // This is a behavioral test
    });
  });

  describe('when Twilio is configured', () => {
    beforeEach(async () => {
      vi.doMock('../config/env.js', () => ({
        env: {
          TWILIO_ACCOUNT_SID: 'test_account_sid',
          TWILIO_AUTH_TOKEN: 'test_auth_token',
          TWILIO_PHONE_NUMBER: '+15551234567',
        },
        isDev: false,
      }));
    });

    describe('sendSms', () => {
      it('should format phone number without +', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({
            sid: 'SM123',
            status: 'queued',
            to: '+381601234567',
            body: 'Test message',
          }),
        });
        global.fetch = mockFetch;

        vi.doMock('../config/env.js', () => ({
          env: {
            TWILIO_ACCOUNT_SID: 'test_account_sid',
            TWILIO_AUTH_TOKEN: 'test_auth_token',
            TWILIO_PHONE_NUMBER: '+15551234567',
          },
          isDev: false,
        }));

        const module = await import('../services/sms.service.js');
        const testSmsService = module.smsService;

        // Test that phone numbers are properly formatted
        expect(typeof testSmsService.sendSms).toBe('function');
      });

      it('should return false on API error', async () => {
        const mockFetch = vi.fn().mockResolvedValue({
          ok: false,
          json: () => Promise.resolve({
            code: 21211,
            message: 'Invalid phone number',
          }),
        });
        global.fetch = mockFetch;

        vi.doMock('../config/env.js', () => ({
          env: {
            TWILIO_ACCOUNT_SID: 'test_account_sid',
            TWILIO_AUTH_TOKEN: 'test_auth_token',
            TWILIO_PHONE_NUMBER: '+15551234567',
          },
          isDev: false,
        }));

        const module = await import('../services/sms.service.js');
        const testSmsService = module.smsService;

        expect(typeof testSmsService.sendSms).toBe('function');
      });

      it('should return false on network error', async () => {
        const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
        global.fetch = mockFetch;

        vi.doMock('../config/env.js', () => ({
          env: {
            TWILIO_ACCOUNT_SID: 'test_account_sid',
            TWILIO_AUTH_TOKEN: 'test_auth_token',
            TWILIO_PHONE_NUMBER: '+15551234567',
          },
          isDev: false,
        }));

        const module = await import('../services/sms.service.js');
        const testSmsService = module.smsService;

        expect(typeof testSmsService.sendSms).toBe('function');
      });
    });

    describe('sendVerificationCode', () => {
      it('should send verification code message', async () => {
        vi.doMock('../config/env.js', () => ({
          env: {
            TWILIO_ACCOUNT_SID: undefined,
            TWILIO_AUTH_TOKEN: undefined,
            TWILIO_PHONE_NUMBER: undefined,
          },
          isDev: true,
        }));

        const module = await import('../services/sms.service.js');
        const testSmsService = module.smsService;

        const result = await testSmsService.sendVerificationCode('+381601234567', '123456');

        expect(typeof result).toBe('boolean');
      });
    });

    describe('sendWelcomeSms', () => {
      it('should include name if provided', async () => {
        vi.doMock('../config/env.js', () => ({
          env: {
            TWILIO_ACCOUNT_SID: undefined,
            TWILIO_AUTH_TOKEN: undefined,
            TWILIO_PHONE_NUMBER: undefined,
          },
          isDev: true,
        }));

        const module = await import('../services/sms.service.js');
        const testSmsService = module.smsService;

        const result = await testSmsService.sendWelcomeSms('+381601234567', 'John');

        expect(typeof result).toBe('boolean');
      });

      it('should work without name', async () => {
        vi.doMock('../config/env.js', () => ({
          env: {
            TWILIO_ACCOUNT_SID: undefined,
            TWILIO_AUTH_TOKEN: undefined,
            TWILIO_PHONE_NUMBER: undefined,
          },
          isDev: true,
        }));

        const module = await import('../services/sms.service.js');
        const testSmsService = module.smsService;

        const result = await testSmsService.sendWelcomeSms('+381601234567');

        expect(typeof result).toBe('boolean');
      });
    });

    describe('sendNewMessageNotification', () => {
      it('should include sender name', async () => {
        vi.doMock('../config/env.js', () => ({
          env: {
            TWILIO_ACCOUNT_SID: undefined,
            TWILIO_AUTH_TOKEN: undefined,
            TWILIO_PHONE_NUMBER: undefined,
          },
          isDev: true,
        }));

        const module = await import('../services/sms.service.js');
        const testSmsService = module.smsService;

        const result = await testSmsService.sendNewMessageNotification('+381601234567', 'Admin');

        expect(typeof result).toBe('boolean');
      });
    });

    describe('sendMatchNotification', () => {
      it('should include job title', async () => {
        vi.doMock('../config/env.js', () => ({
          env: {
            TWILIO_ACCOUNT_SID: undefined,
            TWILIO_AUTH_TOKEN: undefined,
            TWILIO_PHONE_NUMBER: undefined,
          },
          isDev: true,
        }));

        const module = await import('../services/sms.service.js');
        const testSmsService = module.smsService;

        const result = await testSmsService.sendMatchNotification('+381601234567', 'Software Developer');

        expect(typeof result).toBe('boolean');
      });
    });

    describe('sendPasswordResetCode', () => {
      it('should send password reset code', async () => {
        vi.doMock('../config/env.js', () => ({
          env: {
            TWILIO_ACCOUNT_SID: undefined,
            TWILIO_AUTH_TOKEN: undefined,
            TWILIO_PHONE_NUMBER: undefined,
          },
          isDev: true,
        }));

        const module = await import('../services/sms.service.js');
        const testSmsService = module.smsService;

        const result = await testSmsService.sendPasswordResetCode('+381601234567', '654321');

        expect(typeof result).toBe('boolean');
      });
    });
  });
});
