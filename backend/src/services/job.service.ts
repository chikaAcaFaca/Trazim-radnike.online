import crypto from 'crypto';
import slugifyModule from 'slugify';
const slugify = slugifyModule.default || slugifyModule;
import { prisma } from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';

// Types
export interface CreateJobInput {
  title: string;
  descriptionFull: string;
  descriptionPublic?: string;
  salary?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  numWorkers: number;
  location: string;
  locationCity?: string;
  locationCountry?: string;
  workHours?: string;
  housing?: boolean;
  housingDesc?: string;
  experience?: string;
  languages?: string[];
  requirements?: string;
  benefits?: string;
  urgency?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
}

export interface UpdateJobInput extends Partial<CreateJobInput> {
  status?: 'DRAFT' | 'POSTED' | 'CLOSED' | 'FILLED';
  visibility?: 'PRIVATE' | 'SECRET' | 'PUBLIC';
}

export interface JobFilters {
  status?: string;
  visibility?: string;
  search?: string;
}

class JobService {
  /**
   * Generate unique slug for job
   */
  private async generateSlug(title: string, _companyId: string): Promise<string> {
    const baseSlug = slugify(title, { lower: true, strict: true });
    const year = new Date().getFullYear();
    let slug = `${baseSlug}-${year}`;
    let counter = 1;

    // Ensure uniqueness
    while (true) {
      const existing = await prisma.job.findUnique({ where: { slug } });
      if (!existing) break;
      slug = `${baseSlug}-${year}-${counter}`;
      counter++;
    }

    return slug;
  }

  /**
   * Generate cryptographically secure secret token
   */
  generateSecretToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a new job
   */
  async createJob(userId: string, input: CreateJobInput) {
    // Get company for this user
    const company = await prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      throw new ApiError(400, 'You must create a company profile first');
    }

    // Check if user is phone verified
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { phoneVerified: true },
    });

    if (!user?.phoneVerified) {
      throw new ApiError(403, 'Phone verification required to create jobs');
    }

    const slug = await this.generateSlug(input.title, company.id);

    const job = await prisma.job.create({
      data: {
        companyId: company.id,
        title: input.title,
        slug,
        descriptionFull: input.descriptionFull,
        descriptionPublic: input.descriptionPublic || null,
        salary: input.salary || null,
        salaryMin: input.salaryMin || null,
        salaryMax: input.salaryMax || null,
        salaryCurrency: input.salaryCurrency || 'EUR',
        numWorkers: input.numWorkers,
        location: input.location,
        locationCity: input.locationCity || null,
        locationCountry: input.locationCountry || null,
        workHours: input.workHours || null,
        housing: input.housing || false,
        housingDesc: input.housingDesc || null,
        experience: input.experience || null,
        languages: JSON.stringify(input.languages || []),
        requirements: input.requirements || null,
        benefits: input.benefits || null,
        urgency: input.urgency || 'NORMAL',
        status: 'DRAFT',
        visibility: 'PRIVATE',
      },
    });

    return job;
  }

  /**
   * Get job by ID with access control
   */
  async getJob(jobId: string, userId?: string, secretToken?: string) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            country: true,
            city: true,
            userId: true,
          },
        },
        uploads: {
          where: { deletedAt: null },
          select: {
            id: true,
            fileName: true,
            fileType: true,
            url: true,
            uploadType: true,
            description: true,
          },
        },
      },
    });

    if (!job || job.deletedAt) {
      throw new ApiError(404, 'Job not found');
    }

    // Check access
    const isOwner = userId && job.company.userId === userId;
    const isAdmin = userId ? await this.isAdmin(userId) : false;
    const hasSecretAccess = secretToken && job.secretToken === secretToken &&
      (!job.secretExpiresAt || job.secretExpiresAt > new Date());

    // Full access for owner or admin
    if (isOwner || isAdmin) {
      return {
        ...job,
        languages: JSON.parse(job.languages),
        accessLevel: 'full',
      };
    }

    // Secret link access
    if (hasSecretAccess) {
      return {
        ...job,
        languages: JSON.parse(job.languages),
        accessLevel: 'secret',
        // Hide some sensitive info even with secret access
        secretToken: undefined,
        secretExpiresAt: undefined,
      };
    }

    // Public limited access
    if (job.visibility === 'PUBLIC' && job.status === 'POSTED') {
      return {
        id: job.id,
        slug: job.slug,
        title: job.title,
        descriptionPublic: job.descriptionPublic,
        numWorkers: job.numWorkers,
        location: job.location,
        locationCity: job.locationCity,
        locationCountry: job.locationCountry,
        company: {
          name: job.company.name,
          city: job.company.city,
        },
        accessLevel: 'public',
      };
    }

    throw new ApiError(403, 'Access denied');
  }

  /**
   * Get job by slug (public view)
   */
  async getJobBySlug(slug: string, secretToken?: string) {
    const job = await prisma.job.findUnique({
      where: { slug },
      include: {
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

    if (!job || job.deletedAt) {
      throw new ApiError(404, 'Job not found');
    }

    // Secret link access
    const hasSecretAccess = secretToken && job.secretToken === secretToken &&
      (!job.secretExpiresAt || job.secretExpiresAt > new Date());

    if (hasSecretAccess) {
      return {
        ...job,
        languages: JSON.parse(job.languages),
        accessLevel: 'secret',
        secretToken: undefined,
        secretExpiresAt: undefined,
      };
    }

    // Public view only for public jobs
    if (job.visibility !== 'PUBLIC' || job.status !== 'POSTED') {
      throw new ApiError(404, 'Job not found');
    }

    return {
      id: job.id,
      slug: job.slug,
      title: job.title,
      descriptionPublic: job.descriptionPublic,
      numWorkers: job.numWorkers,
      location: job.location,
      locationCity: job.locationCity,
      locationCountry: job.locationCountry,
      company: {
        name: job.company.name,
        city: job.company.city,
      },
      accessLevel: 'public',
    };
  }

  /**
   * List jobs for user
   */
  async listJobs(userId: string, filters: JobFilters = {}) {
    const company = await prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      return [];
    }

    const where: any = {
      companyId: company.id,
      deletedAt: null,
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.visibility) {
      where.visibility = filters.visibility;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { location: { contains: filters.search } },
      ];
    }

    const jobs = await prisma.job.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        visibility: true,
        urgency: true,
        numWorkers: true,
        location: true,
        salary: true,
        createdAt: true,
        postedAt: true,
      },
    });

    return jobs;
  }

  /**
   * Update job
   */
  async updateJob(jobId: string, userId: string, input: UpdateJobInput) {
    const job = await this.verifyOwnership(jobId, userId);

    const updateData: any = {};

    // Update allowed fields
    if (input.title !== undefined) updateData.title = input.title;
    if (input.descriptionFull !== undefined) updateData.descriptionFull = input.descriptionFull;
    if (input.descriptionPublic !== undefined) updateData.descriptionPublic = input.descriptionPublic;
    if (input.salary !== undefined) updateData.salary = input.salary;
    if (input.salaryMin !== undefined) updateData.salaryMin = input.salaryMin;
    if (input.salaryMax !== undefined) updateData.salaryMax = input.salaryMax;
    if (input.salaryCurrency !== undefined) updateData.salaryCurrency = input.salaryCurrency;
    if (input.numWorkers !== undefined) updateData.numWorkers = input.numWorkers;
    if (input.location !== undefined) updateData.location = input.location;
    if (input.locationCity !== undefined) updateData.locationCity = input.locationCity;
    if (input.locationCountry !== undefined) updateData.locationCountry = input.locationCountry;
    if (input.workHours !== undefined) updateData.workHours = input.workHours;
    if (input.housing !== undefined) updateData.housing = input.housing;
    if (input.housingDesc !== undefined) updateData.housingDesc = input.housingDesc;
    if (input.experience !== undefined) updateData.experience = input.experience;
    if (input.languages !== undefined) updateData.languages = JSON.stringify(input.languages);
    if (input.requirements !== undefined) updateData.requirements = input.requirements;
    if (input.benefits !== undefined) updateData.benefits = input.benefits;
    if (input.urgency !== undefined) updateData.urgency = input.urgency;
    if (input.visibility !== undefined) updateData.visibility = input.visibility;

    // Status changes
    if (input.status !== undefined) {
      updateData.status = input.status;
      if (input.status === 'POSTED' && !job.postedAt) {
        updateData.postedAt = new Date();
      }
      if (input.status === 'CLOSED' || input.status === 'FILLED') {
        updateData.closedAt = new Date();
      }
    }

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: updateData,
    });

    return updated;
  }

  /**
   * Delete job (soft delete)
   */
  async deleteJob(jobId: string, userId: string) {
    await this.verifyOwnership(jobId, userId);

    await prisma.job.update({
      where: { id: jobId },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }

  /**
   * Generate secret link for job
   */
  async generateSecretLink(jobId: string, userId: string, expiresInDays?: number) {
    await this.verifyOwnership(jobId, userId);

    const secretToken = this.generateSecretToken();
    const secretExpiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    await prisma.job.update({
      where: { id: jobId },
      data: {
        secretToken,
        secretExpiresAt,
        visibility: 'SECRET',
      },
    });

    return {
      secretToken,
      secretExpiresAt,
    };
  }

  /**
   * Reset (invalidate) secret link
   */
  async resetSecretLink(jobId: string, userId: string) {
    await this.verifyOwnership(jobId, userId);

    await prisma.job.update({
      where: { id: jobId },
      data: {
        secretToken: null,
        secretExpiresAt: null,
        visibility: 'PRIVATE',
      },
    });

    return { success: true };
  }

  /**
   * Publish job (change status to POSTED)
   */
  async publishJob(jobId: string, userId: string) {
    const job = await this.verifyOwnership(jobId, userId);

    // Validate required fields before publishing
    if (!job.descriptionFull) {
      throw new ApiError(400, 'Full description is required to publish');
    }
    if (!job.numWorkers || job.numWorkers < 1) {
      throw new ApiError(400, 'Number of workers is required');
    }
    if (!job.location) {
      throw new ApiError(400, 'Location is required');
    }

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: 'POSTED',
        postedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Verify user owns the job (or is admin)
   */
  private async verifyOwnership(jobId: string, userId: string) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        company: {
          select: { userId: true },
        },
      },
    });

    if (!job || job.deletedAt) {
      throw new ApiError(404, 'Job not found');
    }

    // Check if admin
    const isAdmin = await this.isAdmin(userId);

    if (job.company.userId !== userId && !isAdmin) {
      throw new ApiError(403, 'Access denied');
    }

    return job;
  }

  /**
   * Check if user is admin
   */
  private async isAdmin(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    return user?.role === 'ADMIN';
  }
}

export const jobService = new JobService();
