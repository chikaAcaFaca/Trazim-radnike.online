import { vi } from 'vitest';

// Mock environment variables
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('PORT', '3001');
vi.stubEnv('JWT_SECRET', 'test-jwt-secret-key-for-testing-only');
vi.stubEnv('JWT_REFRESH_SECRET', 'test-jwt-refresh-secret-key-for-testing');
vi.stubEnv('JWT_EXPIRES_IN', '15m');
vi.stubEnv('JWT_REFRESH_EXPIRES_IN', '7d');
vi.stubEnv('DATABASE_URL', 'file:./test.db');
vi.stubEnv('CORS_ORIGIN', 'http://localhost:3000');

// Mock Prisma
vi.mock('../config/database.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    company: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    job: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    verificationToken: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn((operations) => Promise.all(operations)),
  },
}));

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
