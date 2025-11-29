import { prisma } from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';

// Generate URL-friendly slug from company name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[đ]/g, 'd')
    .replace(/[ć|č]/g, 'c')
    .replace(/[š]/g, 's')
    .replace(/[ž]/g, 'z')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

export interface UpdateProfileInput {
  phone?: string;
}

export interface CreateCompanyInput {
  name: string;
  country: string;
  city?: string;
  industry?: string;
  description?: string;
  website?: string;
}

export interface UpdateCompanyInput {
  name?: string;
  country?: string;
  city?: string;
  industry?: string;
  description?: string;
  website?: string;
  logoUrl?: string | null;
  // Business registration
  pib?: string | null;
  maticniBroj?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  address?: string | null;
  // Location
  latitude?: number | null;
  longitude?: number | null;
  // Social media
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  twitterUrl?: string | null;
  linkedinUrl?: string | null;
  eVizitkUrl?: string | null;
  bzrPortalUrl?: string | null;
  // Visibility
  isPublicProfile?: boolean;
  // Profile customization
  profileTemplate?: string;
  profileColorSet?: string;
  profilePrimaryColor?: string | null;
  profileSecondaryColor?: string | null;
  profileAccentColor?: string | null;
}

class ProfileService {
  /**
   * Get user profile with company
   */
  async getProfile(userId: string) {
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
            slug: true,
            name: true,
            country: true,
            city: true,
            industry: true,
            description: true,
            website: true,
            logoUrl: true,
            pib: true,
            maticniBroj: true,
            contactName: true,
            contactPhone: true,
            contactEmail: true,
            address: true,
            latitude: true,
            longitude: true,
            facebookUrl: true,
            instagramUrl: true,
            twitterUrl: true,
            linkedinUrl: true,
            eVizitkUrl: true,
            bzrPortalUrl: true,
            isPublicProfile: true,
            profileTemplate: true,
            profileColorSet: true,
            profilePrimaryColor: true,
            profileSecondaryColor: true,
            profileAccentColor: true,
            createdAt: true,
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
   * Update user profile (phone number)
   */
  async updateProfile(userId: string, input: UpdateProfileInput) {
    const { phone } = input;

    // Check if phone is already in use
    if (phone) {
      const existingPhone = await prisma.user.findFirst({
        where: {
          phone,
          id: { not: userId },
        },
      });

      if (existingPhone) {
        throw new ApiError(400, 'Phone number is already in use');
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        phone: phone || null,
        // Reset phone verification if phone changed
        phoneVerified: phone ? false : undefined,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        phoneVerified: true,
        emailVerified: true,
        role: true,
      },
    });

    return user;
  }

  /**
   * Create company for user
   */
  async createCompany(userId: string, input: CreateCompanyInput) {
    // Check if user already has a company
    const existingCompany = await prisma.company.findUnique({
      where: { userId },
    });

    if (existingCompany) {
      throw new ApiError(400, 'User already has a company');
    }

    // Generate unique slug from company name
    let baseSlug = generateSlug(input.name);
    let slug = baseSlug;
    let counter = 1;

    // Check for existing slugs and make unique if needed
    while (true) {
      const existing = await prisma.company.findUnique({ where: { slug } });
      if (!existing) break;
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const company = await prisma.company.create({
      data: {
        userId,
        slug,
        name: input.name,
        country: input.country,
        city: input.city || null,
        industry: input.industry || null,
        description: input.description || null,
        website: input.website || null,
      },
    });

    return company;
  }

  /**
   * Update company
   */
  async updateCompany(userId: string, input: UpdateCompanyInput) {
    // Get company for this user
    const company = await prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      throw new ApiError(404, 'Company not found');
    }

    const updated = await prisma.company.update({
      where: { id: company.id },
      data: {
        name: input.name,
        country: input.country,
        city: input.city,
        industry: input.industry,
        description: input.description,
        website: input.website,
        logoUrl: input.logoUrl,
        pib: input.pib,
        maticniBroj: input.maticniBroj,
        contactName: input.contactName,
        contactPhone: input.contactPhone,
        contactEmail: input.contactEmail,
        address: input.address,
        latitude: input.latitude,
        longitude: input.longitude,
        facebookUrl: input.facebookUrl,
        instagramUrl: input.instagramUrl,
        twitterUrl: input.twitterUrl,
        linkedinUrl: input.linkedinUrl,
        eVizitkUrl: input.eVizitkUrl,
        bzrPortalUrl: input.bzrPortalUrl,
        isPublicProfile: input.isPublicProfile,
        profileTemplate: input.profileTemplate,
        profileColorSet: input.profileColorSet,
        profilePrimaryColor: input.profilePrimaryColor,
        profileSecondaryColor: input.profileSecondaryColor,
        profileAccentColor: input.profileAccentColor,
      },
    });

    return updated;
  }

  /**
   * Get company by user ID
   */
  async getCompanyByUserId(userId: string) {
    const company = await prisma.company.findUnique({
      where: { userId },
    });

    return company;
  }

  /**
   * Get public company profile by slug (or id if slug not set)
   * Returns ONLY business profile info - NO job listings
   * This is for discretion - visitors see company exists but not that they're hiring
   */
  async getPublicCompanyProfile(slugOrId: string) {
    // Try to find by slug first, then by id
    let company = await prisma.company.findUnique({
      where: { slug: slugOrId },
      select: {
        id: true,
        slug: true,
        name: true,
        country: true,
        city: true,
        industry: true,
        description: true,
        website: true,
        logoUrl: true,
        // Contact info
        contactName: true,
        contactPhone: true,
        contactEmail: true,
        address: true,
        // Location for map
        latitude: true,
        longitude: true,
        // Social media links
        facebookUrl: true,
        instagramUrl: true,
        twitterUrl: true,
        linkedinUrl: true,
        eVizitkUrl: true,
        bzrPortalUrl: true,
        // Visibility flag
        isPublicProfile: true,
        // Profile customization
        profileTemplate: true,
        profileColorSet: true,
        profilePrimaryColor: true,
        profileSecondaryColor: true,
        profileAccentColor: true,
      },
    });

    // If not found by slug, try by id
    if (!company) {
      company = await prisma.company.findUnique({
        where: { id: slugOrId },
        select: {
          id: true,
          slug: true,
          name: true,
          country: true,
          city: true,
          industry: true,
          description: true,
          website: true,
          logoUrl: true,
          contactName: true,
          contactPhone: true,
          contactEmail: true,
          address: true,
          latitude: true,
          longitude: true,
          facebookUrl: true,
          instagramUrl: true,
          twitterUrl: true,
          linkedinUrl: true,
          eVizitkUrl: true,
          bzrPortalUrl: true,
          isPublicProfile: true,
          profileTemplate: true,
          profileColorSet: true,
          profilePrimaryColor: true,
          profileSecondaryColor: true,
          profileAccentColor: true,
        },
      });
    }

    if (!company) {
      throw new ApiError(404, 'Kompanija nije pronađena');
    }

    // Only return if public profile is enabled
    if (!company.isPublicProfile) {
      throw new ApiError(404, 'Profil kompanije nije javno dostupan');
    }

    return company;
  }

  /**
   * Get user statistics (jobs count, messages count)
   */
  async getUserStats(userId: string) {
    const company = await prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      return {
        totalJobs: 0,
        activeJobs: 0,
        unreadMessages: 0,
      };
    }

    const [totalJobs, activeJobs, unreadMessages] = await Promise.all([
      prisma.job.count({
        where: {
          companyId: company.id,
          deletedAt: null,
        },
      }),
      prisma.job.count({
        where: {
          companyId: company.id,
          status: 'POSTED',
          deletedAt: null,
        },
      }),
      prisma.message.count({
        where: {
          conversation: {
            userId,
          },
          readAt: null,
          fromUserId: { not: userId },
        },
      }),
    ]);

    return {
      totalJobs,
      activeJobs,
      unreadMessages,
    };
  }

  /**
   * Get recent jobs for user
   */
  async getRecentJobs(userId: string, limit: number = 5) {
    const company = await prisma.company.findUnique({
      where: { userId },
    });

    if (!company) {
      return [];
    }

    const jobs = await prisma.job.findMany({
      where: {
        companyId: company.id,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        urgency: true,
        numWorkers: true,
        location: true,
        createdAt: true,
        postedAt: true,
      },
    });

    return jobs;
  }
}

export const profileService = new ProfileService();
