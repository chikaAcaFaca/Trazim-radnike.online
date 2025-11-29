import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { prisma } from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';

// Types
export interface CreateUploadInput {
  jobId?: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadType: 'JOB_DOCUMENT' | 'COMPANY_LOGO' | 'CHAT_ATTACHMENT' | 'OTHER';
  description?: string;
}

export interface UploadFilters {
  jobId?: string;
  uploadType?: string;
}

// Configuration
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

class UploadService {
  /**
   * Generate unique filename
   */
  private generateUniqueFilename(originalName: string): string {
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    const hash = crypto.randomBytes(8).toString('hex');
    const safeName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 50);
    return `${safeName}-${hash}${ext}`;
  }

  /**
   * Get upload directory path
   */
  private getUploadPath(userId: string, subdir?: string): string {
    const parts = [UPLOAD_DIR, userId];
    if (subdir) parts.push(subdir);
    return path.join(...parts);
  }

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDir(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Validate file
   */
  validateFile(
    file: { mimetype: string; size: number; originalname: string }
  ): { valid: boolean; error?: string } {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return {
        valid: false,
        error: `File type ${file.mimetype} is not allowed. Allowed types: images, PDF, Word, Excel, text`,
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(2)}MB`,
      };
    }

    return { valid: true };
  }

  /**
   * Save uploaded file
   */
  async saveFile(
    file: Express.Multer.File,
    userId: string,
    uploadType: string
  ): Promise<{ filePath: string; fileName: string; url: string }> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new ApiError(400, validation.error!);
    }

    const uniqueFilename = this.generateUniqueFilename(file.originalname);
    const uploadDir = this.getUploadPath(userId, uploadType.toLowerCase());
    await this.ensureUploadDir(uploadDir);

    const filePath = path.join(uploadDir, uniqueFilename);
    await fs.writeFile(filePath, file.buffer);

    // Generate URL (relative path that will be served by Express static)
    const url = `/${UPLOAD_DIR}/${userId}/${uploadType.toLowerCase()}/${uniqueFilename}`;

    return {
      filePath,
      fileName: uniqueFilename,
      url,
    };
  }

  /**
   * Create upload record
   */
  async createUpload(input: CreateUploadInput, _filePath: string, url: string) {
    // If jobId provided, verify user owns the job
    if (input.jobId) {
      const job = await prisma.job.findUnique({
        where: { id: input.jobId },
        include: { company: { select: { userId: true } } },
      });

      if (!job || job.deletedAt) {
        throw new ApiError(404, 'Job not found');
      }

      if (job.company.userId !== input.userId) {
        // Check if admin
        const isAdmin = await this.isAdmin(input.userId);
        if (!isAdmin) {
          throw new ApiError(403, 'Access denied');
        }
      }
    }

    // Note: jobId is required in schema - must provide a job
    if (!input.jobId) {
      throw new ApiError(400, 'Job ID is required for uploads');
    }

    const upload = await prisma.upload.create({
      data: {
        jobId: input.jobId,
        fileName: input.fileName,
        fileType: input.fileType,
        fileSize: input.fileSize,
        url,
        uploadType: input.uploadType,
        description: input.description || null,
        uploadedBy: input.userId,
      },
    });

    return upload;
  }

  /**
   * Get upload by ID
   */
  async getUpload(uploadId: string, userId: string) {
    const upload = await prisma.upload.findUnique({
      where: { id: uploadId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: { select: { userId: true } },
          },
        },
      },
    });

    if (!upload || upload.deletedAt) {
      throw new ApiError(404, 'Upload not found');
    }

    // Check access
    const isOwner = upload.uploadedBy === userId;
    const isJobOwner = upload.job?.company.userId === userId;
    const isAdmin = await this.isAdmin(userId);

    if (!isOwner && !isJobOwner && !isAdmin) {
      throw new ApiError(403, 'Access denied');
    }

    return upload;
  }

  /**
   * List uploads for user or job
   */
  async listUploads(userId: string, filters: UploadFilters = {}) {
    const where: any = {
      deletedAt: null,
    };

    if (filters.jobId) {
      // Verify user owns the job
      const job = await prisma.job.findUnique({
        where: { id: filters.jobId },
        include: { company: { select: { userId: true } } },
      });

      if (!job || job.deletedAt) {
        throw new ApiError(404, 'Job not found');
      }

      const isOwner = job.company.userId === userId;
      const isAdmin = await this.isAdmin(userId);

      if (!isOwner && !isAdmin) {
        throw new ApiError(403, 'Access denied');
      }

      where.jobId = filters.jobId;
    } else {
      // List user's own uploads
      where.userId = userId;
    }

    if (filters.uploadType) {
      where.uploadType = filters.uploadType;
    }

    const uploads = await prisma.upload.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        url: true,
        uploadType: true,
        description: true,
        createdAt: true,
        job: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return uploads;
  }

  /**
   * Update upload description
   */
  async updateUpload(uploadId: string, userId: string, description: string) {
    // Verify access first
    await this.getUpload(uploadId, userId);

    const updated = await prisma.upload.update({
      where: { id: uploadId },
      data: { description },
    });

    return updated;
  }

  /**
   * Delete upload (soft delete)
   */
  async deleteUpload(uploadId: string, userId: string) {
    const upload = await this.getUpload(uploadId, userId);

    // Soft delete the database record
    await prisma.upload.update({
      where: { id: uploadId },
      data: { deletedAt: new Date() },
    });

    // Try to delete the actual file from the URL path
    try {
      // URL format: /uploads/userId/type/filename
      const filePath = upload.url.startsWith('/') ? upload.url.substring(1) : upload.url;
      await fs.unlink(filePath);
    } catch (err) {
      // File may not exist, ignore error
      console.warn(`Could not delete file from ${upload.url}:`, err);
    }

    return { success: true };
  }

  /**
   * Get uploads for a job (for job detail page)
   */
  async getJobUploads(jobId: string, userId?: string, secretToken?: string) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { company: { select: { userId: true } } },
    });

    if (!job || job.deletedAt) {
      throw new ApiError(404, 'Job not found');
    }

    // Check access
    const isOwner = userId && job.company.userId === userId;
    const isAdmin = userId ? await this.isAdmin(userId) : false;
    const hasSecretAccess =
      secretToken &&
      job.secretToken === secretToken &&
      (!job.secretExpiresAt || job.secretExpiresAt > new Date());

    if (!isOwner && !isAdmin && !hasSecretAccess) {
      throw new ApiError(403, 'Access denied');
    }

    const uploads = await prisma.upload.findMany({
      where: {
        jobId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        fileType: true,
        fileSize: true,
        url: true,
        uploadType: true,
        description: true,
        createdAt: true,
      },
    });

    return uploads;
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

export const uploadService = new UploadService();
