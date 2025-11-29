import { prisma } from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

// Helper to generate URL-friendly slug
function generateSlug(title: string): string {
  const timestamp = Date.now().toString(36);
  const slug = title
    .toLowerCase()
    .replace(/[čć]/g, 'c')
    .replace(/[šś]/g, 's')
    .replace(/[žź]/g, 'z')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  return `${slug}-${timestamp}`;
}

export interface CreatePostInput {
  title: string;
  content: string;
  type?: 'STORY' | 'PROMO' | 'NEWS' | 'UPDATE';
  excerpt?: string;
  ogTitle?: string;
  ogDescription?: string;
}

export interface UpdatePostInput {
  title?: string;
  content?: string;
  type?: 'STORY' | 'PROMO' | 'NEWS' | 'UPDATE';
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  excerpt?: string;
  coverImage?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
}

class PostService {
  /**
   * Create a new post for company
   */
  async createPost(userId: string, input: CreatePostInput) {
    // Get company for user
    const company = await prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      throw new ApiError(400, 'You must create a company profile first');
    }

    const slug = generateSlug(input.title);

    const post = await prisma.companyPost.create({
      data: {
        companyId: company.id,
        title: input.title,
        content: input.content,
        slug,
        type: input.type || 'STORY',
        excerpt: input.excerpt || input.content.slice(0, 160),
        ogTitle: input.ogTitle || input.title,
        ogDescription: input.ogDescription || input.excerpt || input.content.slice(0, 160),
      },
      include: {
        images: true,
        company: {
          select: {
            name: true,
            slug: true,
            logoUrl: true,
          },
        },
      },
    });

    logger.info({ postId: post.id, companyId: company.id }, 'Post created');
    return post;
  }

  /**
   * Update a post
   */
  async updatePost(userId: string, postId: string, input: UpdatePostInput) {
    // Get company for user
    const company = await prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      throw new ApiError(400, 'Company not found');
    }

    // Check post belongs to company
    const existingPost = await prisma.companyPost.findFirst({
      where: {
        id: postId,
        companyId: company.id,
        deletedAt: null,
      },
    });

    if (!existingPost) {
      throw new ApiError(404, 'Post not found');
    }

    const updateData: any = { ...input };

    // Set publishedAt when publishing
    if (input.status === 'PUBLISHED' && existingPost.status !== 'PUBLISHED') {
      updateData.publishedAt = new Date();
    }

    const post = await prisma.companyPost.update({
      where: { id: postId },
      data: updateData,
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
        company: {
          select: {
            name: true,
            slug: true,
            logoUrl: true,
          },
        },
      },
    });

    logger.info({ postId: post.id }, 'Post updated');
    return post;
  }

  /**
   * Delete a post (soft delete)
   */
  async deletePost(userId: string, postId: string) {
    const company = await prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      throw new ApiError(400, 'Company not found');
    }

    const existingPost = await prisma.companyPost.findFirst({
      where: {
        id: postId,
        companyId: company.id,
        deletedAt: null,
      },
    });

    if (!existingPost) {
      throw new ApiError(404, 'Post not found');
    }

    await prisma.companyPost.update({
      where: { id: postId },
      data: { deletedAt: new Date() },
    });

    logger.info({ postId }, 'Post deleted');
    return { success: true };
  }

  /**
   * Get posts for company (owner view)
   */
  async getPostsByUserId(userId: string, page = 1, limit = 10) {
    const company = await prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      return { posts: [], total: 0, page, totalPages: 0 };
    }

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.companyPost.findMany({
        where: {
          companyId: company.id,
          deletedAt: null,
        },
        include: {
          images: {
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.companyPost.count({
        where: {
          companyId: company.id,
          deletedAt: null,
        },
      }),
    ]);

    return {
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single post by ID (owner view)
   */
  async getPostById(userId: string, postId: string) {
    const company = await prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      throw new ApiError(400, 'Company not found');
    }

    const post = await prisma.companyPost.findFirst({
      where: {
        id: postId,
        companyId: company.id,
        deletedAt: null,
      },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
        company: {
          select: {
            name: true,
            slug: true,
            logoUrl: true,
            city: true,
            country: true,
          },
        },
      },
    });

    if (!post) {
      throw new ApiError(404, 'Post not found');
    }

    return post;
  }

  /**
   * Get public post by slug (public view)
   */
  async getPublicPostBySlug(slug: string) {
    const post = await prisma.companyPost.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
        deletedAt: null,
      },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
        company: {
          select: {
            name: true,
            slug: true,
            logoUrl: true,
            city: true,
            country: true,
            isPublicProfile: true,
          },
        },
      },
    });

    if (!post) {
      throw new ApiError(404, 'Post not found');
    }

    // Increment view count
    await prisma.companyPost.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
    });

    return post;
  }

  /**
   * Get public posts by company slug
   */
  async getPublicPostsByCompanySlug(companySlug: string, page = 1, limit = 10) {
    const company = await prisma.company.findFirst({
      where: {
        slug: companySlug,
        isPublicProfile: true,
      },
    });

    if (!company) {
      throw new ApiError(404, 'Company not found');
    }

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.companyPost.findMany({
        where: {
          companyId: company.id,
          status: 'PUBLISHED',
          deletedAt: null,
        },
        include: {
          images: {
            orderBy: { order: 'asc' },
            take: 1, // Only first image for listing
          },
        },
        orderBy: { publishedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.companyPost.count({
        where: {
          companyId: company.id,
          status: 'PUBLISHED',
          deletedAt: null,
        },
      }),
    ]);

    return {
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      company: {
        name: company.name,
        slug: company.slug,
        logoUrl: company.logoUrl,
      },
    };
  }

  /**
   * Add image to post
   */
  async addImageToPost(userId: string, postId: string, imageData: {
    url: string;
    fileName: string;
    fileSize: number;
    caption?: string;
  }) {
    const company = await prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      throw new ApiError(400, 'Company not found');
    }

    const post = await prisma.companyPost.findFirst({
      where: {
        id: postId,
        companyId: company.id,
        deletedAt: null,
      },
      include: {
        images: true,
      },
    });

    if (!post) {
      throw new ApiError(404, 'Post not found');
    }

    // Get next order number
    const maxOrder = post.images.length > 0
      ? Math.max(...post.images.map(img => img.order))
      : -1;

    const image = await prisma.companyPostImage.create({
      data: {
        postId,
        url: imageData.url,
        fileName: imageData.fileName,
        fileSize: imageData.fileSize,
        caption: imageData.caption,
        order: maxOrder + 1,
      },
    });

    // Set as cover image if first image
    if (post.images.length === 0) {
      await prisma.companyPost.update({
        where: { id: postId },
        data: { coverImage: imageData.url },
      });
    }

    logger.info({ imageId: image.id, postId }, 'Image added to post');
    return image;
  }

  /**
   * Remove image from post
   */
  async removeImageFromPost(userId: string, postId: string, imageId: string) {
    const company = await prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      throw new ApiError(400, 'Company not found');
    }

    const post = await prisma.companyPost.findFirst({
      where: {
        id: postId,
        companyId: company.id,
        deletedAt: null,
      },
    });

    if (!post) {
      throw new ApiError(404, 'Post not found');
    }

    const image = await prisma.companyPostImage.findFirst({
      where: {
        id: imageId,
        postId,
      },
    });

    if (!image) {
      throw new ApiError(404, 'Image not found');
    }

    await prisma.companyPostImage.delete({
      where: { id: imageId },
    });

    // If deleted image was cover, set next image as cover
    if (post.coverImage === image.url) {
      const nextImage = await prisma.companyPostImage.findFirst({
        where: { postId },
        orderBy: { order: 'asc' },
      });

      await prisma.companyPost.update({
        where: { id: postId },
        data: { coverImage: nextImage?.url || null },
      });
    }

    logger.info({ imageId, postId }, 'Image removed from post');
    return { success: true };
  }

  /**
   * Increment share count
   */
  async incrementShareCount(postId: string) {
    await prisma.companyPost.update({
      where: { id: postId },
      data: { shareCount: { increment: 1 } },
    });
  }
}

export const postService = new PostService();
