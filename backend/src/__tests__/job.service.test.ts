import { describe, it, expect, vi, beforeEach } from 'vitest';

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
import { jobService } from '../services/job.service.js';
import { prisma } from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';

describe('JobService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSecretToken', () => {
    it('should generate 64-character hex token', () => {
      const token = jobService.generateSecretToken();

      expect(token.length).toBe(64);
      expect(/^[a-f0-9]+$/.test(token)).toBe(true);
    });

    it('should generate unique tokens', () => {
      const token1 = jobService.generateSecretToken();
      const token2 = jobService.generateSecretToken();

      expect(token1).not.toBe(token2);
    });
  });

  describe('createJob', () => {
    it('should throw error if company does not exist', async () => {
      vi.mocked(prisma.company.findUnique).mockResolvedValue(null);

      await expect(jobService.createJob('user-123', {
        title: 'Test Job',
        descriptionFull: 'Full description',
        numWorkers: 5,
        location: 'Serbia',
      })).rejects.toThrow('You must create a company profile first');
    });

    it('should throw error if phone not verified', async () => {
      vi.mocked(prisma.company.findUnique).mockResolvedValue({
        id: 'company-123',
        userId: 'user-123',
        name: 'Test Company',
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        phoneVerified: false,
      } as any);

      await expect(jobService.createJob('user-123', {
        title: 'Test Job',
        descriptionFull: 'Full description',
        numWorkers: 5,
        location: 'Serbia',
      })).rejects.toThrow('Phone verification required');
    });

    it('should create job successfully', async () => {
      vi.mocked(prisma.company.findUnique).mockResolvedValue({
        id: 'company-123',
        userId: 'user-123',
        name: 'Test Company',
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        phoneVerified: true,
      } as any);
      vi.mocked(prisma.job.findUnique).mockResolvedValue(null); // For slug uniqueness
      vi.mocked(prisma.job.create).mockResolvedValue({
        id: 'job-123',
        title: 'Test Job',
        slug: 'test-job-2024',
        descriptionFull: 'Full description',
        numWorkers: 5,
        location: 'Serbia',
        status: 'DRAFT',
        visibility: 'PRIVATE',
      } as any);

      const result = await jobService.createJob('user-123', {
        title: 'Test Job',
        descriptionFull: 'Full description',
        numWorkers: 5,
        location: 'Serbia',
      });

      expect(prisma.job.create).toHaveBeenCalled();
      expect(result.status).toBe('DRAFT');
      expect(result.visibility).toBe('PRIVATE');
    });
  });

  describe('getJob', () => {
    it('should throw 404 if job not found', async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue(null);

      await expect(jobService.getJob('job-123'))
        .rejects.toThrow('Job not found');
    });

    it('should throw 404 if job is deleted', async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue({
        id: 'job-123',
        deletedAt: new Date(),
        company: { userId: 'user-123' },
      } as any);

      await expect(jobService.getJob('job-123'))
        .rejects.toThrow('Job not found');
    });

    it('should return full access for owner', async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue({
        id: 'job-123',
        title: 'Test Job',
        languages: '["English","Serbian"]',
        deletedAt: null,
        company: { userId: 'owner-123' },
        uploads: [],
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'owner-123',
        role: 'EMPLOYER',
      } as any);

      const result = await jobService.getJob('job-123', 'owner-123');

      expect(result.accessLevel).toBe('full');
      expect(result.languages).toEqual(['English', 'Serbian']);
    });

    it('should return full access for admin', async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue({
        id: 'job-123',
        title: 'Test Job',
        languages: '[]',
        deletedAt: null,
        company: { userId: 'other-user' },
        uploads: [],
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'admin-123',
        role: 'ADMIN',
      } as any);

      const result = await jobService.getJob('job-123', 'admin-123');

      expect(result.accessLevel).toBe('full');
    });

    it('should return secret access with valid token', async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue({
        id: 'job-123',
        title: 'Test Job',
        languages: '[]',
        deletedAt: null,
        secretToken: 'valid-secret',
        secretExpiresAt: new Date(Date.now() + 86400000),
        company: { userId: 'other-user' },
        uploads: [],
      } as any);

      const result = await jobService.getJob('job-123', undefined, 'valid-secret');

      expect(result.accessLevel).toBe('secret');
      expect(result.secretToken).toBeUndefined();
    });

    it('should return public limited access for public jobs', async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue({
        id: 'job-123',
        slug: 'test-job',
        title: 'Test Job',
        descriptionPublic: 'Public description',
        numWorkers: 5,
        location: 'Serbia',
        locationCity: 'Belgrade',
        locationCountry: 'Serbia',
        languages: '[]',
        visibility: 'PUBLIC',
        status: 'POSTED',
        deletedAt: null,
        company: {
          userId: 'other-user',
          name: 'Test Company',
          city: 'Belgrade',
        },
        uploads: [],
      } as any);

      const result = await jobService.getJob('job-123');

      expect(result.accessLevel).toBe('public');
      expect(result).not.toHaveProperty('descriptionFull');
      expect(result).not.toHaveProperty('salary');
    });

    it('should throw 403 for private job without access', async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue({
        id: 'job-123',
        visibility: 'PRIVATE',
        status: 'DRAFT',
        deletedAt: null,
        company: { userId: 'other-user' },
        uploads: [],
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'random-user',
        role: 'EMPLOYER',
      } as any);

      await expect(jobService.getJob('job-123', 'random-user'))
        .rejects.toThrow('Access denied');
    });
  });

  describe('getJobBySlug', () => {
    it('should throw 404 for non-existent job', async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue(null);

      await expect(jobService.getJobBySlug('non-existent'))
        .rejects.toThrow('Job not found');
    });

    it('should return full data with secret token', async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue({
        id: 'job-123',
        slug: 'test-job',
        title: 'Test Job',
        descriptionFull: 'Full description',
        languages: '["English"]',
        secretToken: 'valid-secret',
        secretExpiresAt: new Date(Date.now() + 86400000),
        deletedAt: null,
        company: { name: 'Test Company' },
      } as any);

      const result = await jobService.getJobBySlug('test-job', 'valid-secret');

      expect(result.accessLevel).toBe('secret');
      expect(result.descriptionFull).toBe('Full description');
    });

    it('should return limited data for public view', async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue({
        id: 'job-123',
        slug: 'test-job',
        title: 'Test Job',
        descriptionPublic: 'Public description',
        numWorkers: 5,
        location: 'Serbia',
        visibility: 'PUBLIC',
        status: 'POSTED',
        deletedAt: null,
        company: { name: 'Test Company', city: 'Belgrade' },
      } as any);

      const result = await jobService.getJobBySlug('test-job');

      expect(result.accessLevel).toBe('public');
      expect(result).not.toHaveProperty('descriptionFull');
    });

    it('should throw 404 for non-public job without token', async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue({
        id: 'job-123',
        visibility: 'PRIVATE',
        status: 'DRAFT',
        deletedAt: null,
        company: {},
      } as any);

      await expect(jobService.getJobBySlug('private-job'))
        .rejects.toThrow('Job not found');
    });
  });

  describe('listJobs', () => {
    it('should return empty array if no company', async () => {
      vi.mocked(prisma.company.findUnique).mockResolvedValue(null);

      const result = await jobService.listJobs('user-123');

      expect(result).toEqual([]);
    });

    it('should return jobs for user company', async () => {
      vi.mocked(prisma.company.findUnique).mockResolvedValue({
        id: 'company-123',
        userId: 'user-123',
      } as any);
      vi.mocked(prisma.job.findMany).mockResolvedValue([
        { id: 'job-1', title: 'Job 1', status: 'DRAFT' },
        { id: 'job-2', title: 'Job 2', status: 'POSTED' },
      ] as any);

      const result = await jobService.listJobs('user-123');

      expect(result.length).toBe(2);
      expect(prisma.job.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          companyId: 'company-123',
          deletedAt: null,
        }),
      }));
    });

    it('should apply status filter', async () => {
      vi.mocked(prisma.company.findUnique).mockResolvedValue({
        id: 'company-123',
      } as any);
      vi.mocked(prisma.job.findMany).mockResolvedValue([]);

      await jobService.listJobs('user-123', { status: 'POSTED' });

      expect(prisma.job.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          status: 'POSTED',
        }),
      }));
    });

    it('should apply search filter', async () => {
      vi.mocked(prisma.company.findUnique).mockResolvedValue({
        id: 'company-123',
      } as any);
      vi.mocked(prisma.job.findMany).mockResolvedValue([]);

      await jobService.listJobs('user-123', { search: 'developer' });

      expect(prisma.job.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ title: { contains: 'developer' } }),
            expect.objectContaining({ location: { contains: 'developer' } }),
          ]),
        }),
      }));
    });
  });

  describe('generateSecretLink', () => {
    it('should throw error if user does not own job', async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue({
        id: 'job-123',
        deletedAt: null,
        company: { userId: 'other-user' },
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        role: 'EMPLOYER',
      } as any);

      await expect(jobService.generateSecretLink('job-123', 'user-123'))
        .rejects.toThrow('Access denied');
    });

    it('should generate secret link with expiry', async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue({
        id: 'job-123',
        deletedAt: null,
        company: { userId: 'user-123' },
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        role: 'EMPLOYER',
      } as any);
      vi.mocked(prisma.job.update).mockResolvedValue({} as any);

      const result = await jobService.generateSecretLink('job-123', 'user-123', 7);

      expect(result.secretToken).toBeDefined();
      expect(result.secretToken.length).toBe(64);
      expect(result.secretExpiresAt).toBeDefined();
      expect(prisma.job.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          visibility: 'SECRET',
        }),
      }));
    });

    it('should generate secret link without expiry', async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue({
        id: 'job-123',
        deletedAt: null,
        company: { userId: 'user-123' },
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        role: 'EMPLOYER',
      } as any);
      vi.mocked(prisma.job.update).mockResolvedValue({} as any);

      const result = await jobService.generateSecretLink('job-123', 'user-123');

      expect(result.secretExpiresAt).toBeNull();
    });
  });

  describe('resetSecretLink', () => {
    it('should reset secret link to private', async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue({
        id: 'job-123',
        deletedAt: null,
        company: { userId: 'user-123' },
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        role: 'EMPLOYER',
      } as any);
      vi.mocked(prisma.job.update).mockResolvedValue({} as any);

      const result = await jobService.resetSecretLink('job-123', 'user-123');

      expect(result.success).toBe(true);
      expect(prisma.job.update).toHaveBeenCalledWith(expect.objectContaining({
        data: {
          secretToken: null,
          secretExpiresAt: null,
          visibility: 'PRIVATE',
        },
      }));
    });
  });

  describe('publishJob', () => {
    it('should throw error if description is missing', async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue({
        id: 'job-123',
        descriptionFull: null,
        numWorkers: 5,
        location: 'Serbia',
        deletedAt: null,
        company: { userId: 'user-123' },
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        role: 'EMPLOYER',
      } as any);

      await expect(jobService.publishJob('job-123', 'user-123'))
        .rejects.toThrow('Full description is required');
    });

    it('should throw error if numWorkers is missing', async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue({
        id: 'job-123',
        descriptionFull: 'Full description',
        numWorkers: 0,
        location: 'Serbia',
        deletedAt: null,
        company: { userId: 'user-123' },
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        role: 'EMPLOYER',
      } as any);

      await expect(jobService.publishJob('job-123', 'user-123'))
        .rejects.toThrow('Number of workers is required');
    });

    it('should publish job successfully', async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue({
        id: 'job-123',
        descriptionFull: 'Full description',
        numWorkers: 5,
        location: 'Serbia',
        postedAt: null,
        deletedAt: null,
        company: { userId: 'user-123' },
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        role: 'EMPLOYER',
      } as any);
      vi.mocked(prisma.job.update).mockResolvedValue({
        id: 'job-123',
        status: 'POSTED',
        postedAt: new Date(),
      } as any);

      const result = await jobService.publishJob('job-123', 'user-123');

      expect(result.status).toBe('POSTED');
      expect(prisma.job.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          status: 'POSTED',
        }),
      }));
    });
  });

  describe('deleteJob', () => {
    it('should soft delete job', async () => {
      vi.mocked(prisma.job.findUnique).mockResolvedValue({
        id: 'job-123',
        deletedAt: null,
        company: { userId: 'user-123' },
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'user-123',
        role: 'EMPLOYER',
      } as any);
      vi.mocked(prisma.job.update).mockResolvedValue({} as any);

      const result = await jobService.deleteJob('job-123', 'user-123');

      expect(result.success).toBe(true);
      expect(prisma.job.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          deletedAt: expect.any(Date),
        }),
      }));
    });
  });
});
