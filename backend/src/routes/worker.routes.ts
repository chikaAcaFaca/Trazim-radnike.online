import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { logger } from '../utils/logger.js';
import { settingsService } from '../services/settings.service.js';

const router = Router();

// ============================================
// Public routes - Pretraga majstora
// ============================================

/**
 * GET /api/workers/beta-status
 * Get current beta status for the platform
 */
router.get('/beta-status', async (_req, res) => {
  try {
    const betaStatus = await settingsService.getBetaStatus();

    return res.json({
      success: true,
      data: betaStatus,
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching beta status');
    return res.status(500).json({ success: false, message: 'Greška' });
  }
});

/**
 * GET /api/workers
 * Search workers with filters
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      profession,
      city,
      country,
      available,
      minRating,
      maxRate,
      page = '1',
      limit = '20',
      sort = 'rating', // rating, price, recent
    } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 20, 50);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      isPublicProfile: true,
      deletedAt: null,
    };

    if (profession) {
      where.OR = [
        { profession: { contains: profession as string } },
        { professions: { contains: profession as string } },
      ];
    }

    if (city) {
      where.city = { contains: city as string };
    }

    if (country) {
      where.country = country as string;
    }

    if (available === 'true') {
      where.availability = 'AVAILABLE';
    }

    if (minRating) {
      where.rating = { gte: parseFloat(minRating as string) };
    }

    if (maxRate) {
      where.hourlyRate = { lte: parseInt(maxRate as string) };
    }

    // Build orderBy
    let orderBy: any = {};
    switch (sort) {
      case 'price':
        orderBy = { hourlyRate: 'asc' };
        break;
      case 'recent':
        orderBy = { lastActiveAt: 'desc' };
        break;
      case 'rating':
      default:
        orderBy = [{ rating: 'desc' }, { reviewCount: 'desc' }];
        break;
    }

    // Fetch workers
    const [workers, total] = await Promise.all([
      prisma.worker.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          user: {
            select: {
              subscriptions: {
                where: { status: 'ACTIVE', endDate: { gt: new Date() } },
                select: { planType: true },
                take: 1,
              },
            },
          },
        },
      }),
      prisma.worker.count({ where }),
    ]);

    // Format response - hide sensitive data for non-paid users
    const formattedWorkers = workers.map(worker => {
      const subscription = worker.user?.subscriptions?.[0];
      const isPro = subscription?.planType === 'PRO' || subscription?.planType === 'UNLIMITED';

      return {
        id: worker.id,
        slug: worker.slug,
        displayName: worker.displayName,
        profession: worker.profession,
        professions: worker.professions ? JSON.parse(worker.professions) : [],
        bio: worker.bio,
        city: worker.city,
        country: worker.country,
        workRadius: worker.workRadius,
        hourlyRate: worker.hourlyRate,
        dailyRate: worker.dailyRate,
        currency: worker.currency,
        availability: worker.availability,
        yearsExperience: worker.yearsExperience,
        skills: worker.skills ? JSON.parse(worker.skills) : [],
        rating: worker.rating,
        reviewCount: worker.reviewCount,
        avatarUrl: worker.avatarUrl,
        coverImageUrl: worker.coverImageUrl,
        // Contact info - hidden until revealed
        phone: worker.showPhone ? worker.phone?.replace(/\d{4}$/, '****') : null,
        email: worker.showEmail ? worker.email : null,
        // Badges
        isVerified: isPro,
        isPro,
        lastActiveAt: worker.lastActiveAt,
      };
    });

    return res.json({
      success: true,
      data: {
        workers: formattedWorkers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error searching workers');
    return res.status(500).json({ success: false, message: 'Greška pri pretrazi' });
  }
});

/**
 * GET /api/workers/professions
 * Get all professions for filter
 */
router.get('/professions', async (_req, res) => {
  try {
    const professions = await prisma.profession.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    // Group by category
    const grouped = professions.reduce((acc: any, prof) => {
      if (!acc[prof.category]) {
        acc[prof.category] = [];
      }
      acc[prof.category].push(prof);
      return acc;
    }, {});

    return res.json({
      success: true,
      data: {
        professions,
        grouped,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching professions');
    return res.status(500).json({ success: false, message: 'Greška pri učitavanju profesija' });
  }
});

/**
 * GET /api/workers/:slug
 * Get worker profile by slug
 */
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const { slug } = req.params;

    const worker = await prisma.worker.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
        isPublicProfile: true,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            subscriptions: {
              where: { status: 'ACTIVE', endDate: { gt: new Date() } },
              select: { planType: true },
              take: 1,
            },
          },
        },
        reviews: {
          where: { rating: { gte: 1 } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        posts: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 6,
        },
      },
    });

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Majstor nije pronađen' });
    }

    // Increment view count
    await prisma.worker.update({
      where: { id: worker.id },
      data: { profileViews: { increment: 1 } },
    });

    const subscription = worker.user?.subscriptions?.[0];
    const isPro = subscription?.planType === 'PRO' || subscription?.planType === 'UNLIMITED';

    // Check if current user has revealed this contact
    let contactRevealed = false;
    if (req.user) {
      const match = await prisma.workerMatch.findFirst({
        where: {
          workerId: worker.id,
          employerId: req.user.id,
          contactRevealed: true,
        },
      });
      contactRevealed = !!match;
    }

    return res.json({
      success: true,
      data: {
        worker: {
          id: worker.id,
          slug: worker.slug,
          displayName: worker.displayName,
          firstName: worker.firstName,
          lastName: worker.lastName,
          profession: worker.profession,
          professions: worker.professions ? JSON.parse(worker.professions) : [],
          bio: worker.bio,
          city: worker.city,
          country: worker.country,
          workRadius: worker.workRadius,
          hourlyRate: worker.hourlyRate,
          dailyRate: worker.dailyRate,
          currency: worker.currency,
          availability: worker.availability,
          availableFrom: worker.availableFrom,
          yearsExperience: worker.yearsExperience,
          skills: worker.skills ? JSON.parse(worker.skills) : [],
          certificates: worker.certificates ? JSON.parse(worker.certificates) : [],
          languages: worker.languages ? JSON.parse(worker.languages) : [],
          portfolioImages: worker.portfolioImages ? JSON.parse(worker.portfolioImages) : [],
          rating: worker.rating,
          reviewCount: worker.reviewCount,
          profileViews: worker.profileViews,
          avatarUrl: worker.avatarUrl,
          coverImageUrl: worker.coverImageUrl,
          // Contact - revealed or partial
          phone: contactRevealed ? worker.phone : (worker.showPhone ? worker.phone?.replace(/\d{4}$/, '****') : null),
          email: contactRevealed ? worker.email : (worker.showEmail ? worker.email : null),
          contactRevealed,
          // Social links
          facebookUrl: worker.facebookUrl,
          instagramUrl: worker.instagramUrl,
          youtubeUrl: worker.youtubeUrl,
          websiteUrl: worker.websiteUrl,
          // Badges
          isVerified: isPro,
          isPro,
          lastActiveAt: worker.lastActiveAt,
        },
        reviews: worker.reviews,
        posts: worker.posts.map(post => ({
          ...post,
          images: post.images ? JSON.parse(post.images) : [],
        })),
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching worker profile');
    return res.status(500).json({ success: false, message: 'Greška pri učitavanju profila' });
  }
});

// ============================================
// Authenticated routes - Majstor upravlja profilom
// ============================================

/**
 * GET /api/workers/me/profile
 * Get current worker's profile
 */
router.get('/me/profile', authenticate, async (req, res) => {
  try {
    const worker = await prisma.worker.findUnique({
      where: { userId: req.user!.id },
      include: {
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        posts: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Profil majstora nije kreiran' });
    }

    return res.json({
      success: true,
      data: {
        worker: {
          ...worker,
          professions: worker.professions ? JSON.parse(worker.professions) : [],
          skills: worker.skills ? JSON.parse(worker.skills) : [],
          certificates: worker.certificates ? JSON.parse(worker.certificates) : [],
          languages: worker.languages ? JSON.parse(worker.languages) : [],
          portfolioImages: worker.portfolioImages ? JSON.parse(worker.portfolioImages) : [],
        },
        reviews: worker.reviews,
        posts: worker.posts.map(post => ({
          ...post,
          images: post.images ? JSON.parse(post.images) : [],
        })),
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching worker profile');
    return res.status(500).json({ success: false, message: 'Greška pri učitavanju profila' });
  }
});

/**
 * POST /api/workers/me/profile
 * Create or update worker profile
 */
router.post('/me/profile', authenticate, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      displayName,
      profession,
      professions,
      bio,
      city,
      country,
      workRadius,
      hourlyRate,
      dailyRate,
      currency,
      availability,
      yearsExperience,
      skills,
      certificates,
      languages,
      showPhone,
      showEmail,
      isPublicProfile,
      avatarUrl,
      coverImageUrl,
      portfolioImages,
      facebookUrl,
      instagramUrl,
      youtubeUrl,
      websiteUrl,
    } = req.body;

    // Generate slug from display name
    const slug = displayName
      ? displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      : undefined;

    const workerData = {
      firstName,
      lastName,
      displayName,
      slug,
      profession,
      professions: professions ? JSON.stringify(professions) : undefined,
      bio,
      city,
      country: country || 'RS',
      workRadius,
      hourlyRate,
      dailyRate,
      currency: currency || 'RSD',
      availability: availability || 'AVAILABLE',
      yearsExperience,
      skills: skills ? JSON.stringify(skills) : undefined,
      certificates: certificates ? JSON.stringify(certificates) : undefined,
      languages: languages ? JSON.stringify(languages) : undefined,
      showPhone: showPhone ?? false,
      showEmail: showEmail ?? true,
      isPublicProfile: isPublicProfile ?? true,
      avatarUrl,
      coverImageUrl,
      portfolioImages: portfolioImages ? JSON.stringify(portfolioImages) : undefined,
      facebookUrl,
      instagramUrl,
      youtubeUrl,
      websiteUrl,
      phone: req.user!.phone,
      phoneVerified: req.user!.phoneVerified,
      email: req.user!.email,
      lastActiveAt: new Date(),
    };

    const worker = await prisma.worker.upsert({
      where: { userId: req.user!.id },
      create: {
        userId: req.user!.id,
        ...workerData,
      },
      update: workerData,
    });

    // Update user profile type
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { profileType: 'WORKER' },
    });

    logger.info({ workerId: worker.id, userId: req.user!.id }, 'Worker profile updated');

    return res.json({
      success: true,
      data: { worker },
      message: 'Profil uspešno sačuvan',
    });
  } catch (error) {
    logger.error({ error }, 'Error updating worker profile');
    return res.status(500).json({ success: false, message: 'Greška pri čuvanju profila' });
  }
});

/**
 * POST /api/workers/me/availability
 * Update worker availability
 */
router.post('/me/availability', authenticate, async (req, res) => {
  try {
    const { availability, availableFrom } = req.body;

    const worker = await prisma.worker.update({
      where: { userId: req.user!.id },
      data: {
        availability,
        availableFrom: availableFrom ? new Date(availableFrom) : null,
        lastActiveAt: new Date(),
      },
    });

    return res.json({
      success: true,
      data: { worker },
      message: 'Dostupnost ažurirana',
    });
  } catch (error) {
    logger.error({ error }, 'Error updating availability');
    return res.status(500).json({ success: false, message: 'Greška pri ažuriranju' });
  }
});

/**
 * GET /api/workers/me/matches
 * Get worker's matches (people interested in hiring them)
 */
router.get('/me/matches', authenticate, async (req, res) => {
  try {
    const worker = await prisma.worker.findUnique({
      where: { userId: req.user!.id },
    });

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Profil nije pronađen' });
    }

    const matches = await prisma.workerMatch.findMany({
      where: { workerId: worker.id },
      orderBy: { createdAt: 'desc' },
    });

    // Also get service matches
    const serviceMatches = await prisma.serviceMatch.findMany({
      where: { workerId: worker.id },
      include: {
        serviceRequest: {
          include: {
            household: {
              select: { displayName: true, city: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: {
        workerMatches: matches,
        serviceMatches,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching matches');
    return res.status(500).json({ success: false, message: 'Greška pri učitavanju' });
  }
});

/**
 * POST /api/workers/:workerId/contact
 * Request to reveal worker's contact (creates match)
 * During beta period: contact reveals are FREE
 */
router.post('/:workerId/contact', authenticate, async (req, res) => {
  try {
    const { workerId } = req.params;

    // Check if worker exists
    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
    });

    if (!worker) {
      return res.status(404).json({ success: false, message: 'Majstor nije pronađen' });
    }

    // Check if match already exists
    const existingMatch = await prisma.workerMatch.findFirst({
      where: {
        workerId,
        employerId: req.user!.id,
      },
    });

    if (existingMatch) {
      if (existingMatch.contactRevealed) {
        // Contact already revealed
        return res.json({
          success: true,
          data: {
            contactRevealed: true,
            phone: worker.phone,
            email: worker.email,
          },
          message: 'Kontakt je već otkriven',
        });
      }

      // Check beta mode - if active, reveal contact for free
      const isBetaFree = await settingsService.isFreeMatchingEnabled();
      if (isBetaFree) {
        // Update existing match to reveal contact for free
        await prisma.workerMatch.update({
          where: { id: existingMatch.id },
          data: {
            contactRevealed: true,
            isPaid: true, // Mark as "paid" (free during beta)
            status: 'MATCHED',
          },
        });

        logger.info(
          { matchId: existingMatch.id, workerId, employerId: req.user!.id },
          'Contact revealed for free (beta mode)'
        );

        return res.json({
          success: true,
          data: {
            contactRevealed: true,
            phone: worker.phone,
            email: worker.email,
            isBetaFree: true,
          },
          message: 'Kontakt otkriven besplatno (beta period)',
        });
      }

      // Return existing match - needs payment
      return res.json({
        success: true,
        data: {
          matchId: existingMatch.id,
          contactRevealed: false,
          needsPayment: !existingMatch.isPaid,
        },
        message: 'Potrebno je plaćanje za otkrivanje kontakta',
      });
    }

    // Check beta mode for new matches
    const isBetaFree = await settingsService.isFreeMatchingEnabled();

    if (isBetaFree) {
      // Create match with contact revealed for free (beta period)
      const match = await prisma.workerMatch.create({
        data: {
          workerId,
          employerId: req.user!.id,
          status: 'MATCHED',
          employerLiked: true,
          contactRevealed: true,
          isPaid: true, // Mark as "paid" (free during beta)
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
      });

      // Increment match count on worker
      await prisma.worker.update({
        where: { id: workerId },
        data: { matchCount: { increment: 1 } },
      });

      logger.info(
        { matchId: match.id, workerId, employerId: req.user!.id },
        'New match created with free contact reveal (beta mode)'
      );

      return res.json({
        success: true,
        data: {
          matchId: match.id,
          contactRevealed: true,
          phone: worker.phone,
          email: worker.email,
          isBetaFree: true,
        },
        message: 'Kontakt otkriven besplatno (beta period)! 🎉',
      });
    }

    // Non-beta mode: Create new match requiring payment
    const match = await prisma.workerMatch.create({
      data: {
        workerId,
        employerId: req.user!.id,
        status: 'PENDING',
        employerLiked: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Increment match count on worker
    await prisma.worker.update({
      where: { id: workerId },
      data: { matchCount: { increment: 1 } },
    });

    // Get contact reveal price from settings
    const contactPrice = await settingsService.getContactRevealPrice();

    return res.json({
      success: true,
      data: {
        matchId: match.id,
        contactRevealed: false,
        needsPayment: true,
        paymentAmount: contactPrice,
      },
      message: 'Zahtev kreiran. Platite da otkrijete kontakt.',
    });
  } catch (error) {
    logger.error({ error }, 'Error requesting contact');
    return res.status(500).json({ success: false, message: 'Greška' });
  }
});

export default router;
