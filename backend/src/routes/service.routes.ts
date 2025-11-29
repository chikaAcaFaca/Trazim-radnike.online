import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticate, optionalAuth } from '../middleware/auth.middleware.js';
import { logger } from '../utils/logger.js';

const router = Router();

// ============================================
// Public routes - Pretraga zahteva za majstore
// ============================================

/**
 * GET /api/services
 * Search service requests (for workers to find jobs)
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      profession,
      city,
      urgency,
      budgetMin,
      budgetMax,
      page = '1',
      limit = '20',
      sort = 'recent', // recent, urgent, budget
    } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = Math.min(parseInt(limit as string) || 20, 50);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      status: 'OPEN',
      deletedAt: null,
    };

    if (profession) {
      where.profession = { contains: profession as string };
    }

    if (city) {
      where.city = { contains: city as string };
    }

    if (urgency) {
      where.urgency = urgency as string;
    }

    if (budgetMin) {
      where.budgetMax = { gte: parseInt(budgetMin as string) };
    }

    if (budgetMax) {
      where.budgetMin = { lte: parseInt(budgetMax as string) };
    }

    // Build orderBy
    let orderBy: any = {};
    switch (sort) {
      case 'urgent':
        orderBy = [{ isUrgent: 'desc' }, { isPriority: 'desc' }, { createdAt: 'desc' }];
        break;
      case 'budget':
        orderBy = { budgetMax: 'desc' };
        break;
      case 'recent':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }

    // Fetch service requests
    const [requests, total] = await Promise.all([
      prisma.serviceRequest.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          household: {
            select: {
              displayName: true,
              city: true,
              country: true,
            },
          },
          _count: {
            select: { matches: true },
          },
        },
      }),
      prisma.serviceRequest.count({ where }),
    ]);

    return res.json({
      success: true,
      data: {
        requests: requests.map(r => ({
          id: r.id,
          title: r.title,
          description: r.description,
          profession: r.profession,
          city: r.city,
          urgency: r.urgency,
          preferredDate: r.preferredDate,
          flexibleDates: r.flexibleDates,
          budgetMin: r.budgetMin,
          budgetMax: r.budgetMax,
          budgetType: r.budgetType,
          isPriority: r.isPriority,
          isUrgent: r.isUrgent,
          responseCount: r._count.matches,
          household: r.household,
          createdAt: r.createdAt,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error searching service requests');
    return res.status(500).json({ success: false, message: 'Greška pri pretrazi' });
  }
});

/**
 * GET /api/services/:id
 * Get service request details
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const request = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        household: {
          select: {
            id: true,
            displayName: true,
            city: true,
            country: true,
            reviewsGiven: true,
          },
        },
        matches: {
          select: {
            workerId: true,
            status: true,
          },
        },
      },
    });

    if (!request || request.deletedAt) {
      return res.status(404).json({ success: false, message: 'Zahtev nije pronađen' });
    }

    // Increment view count
    await prisma.serviceRequest.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    // Check if current worker has applied
    let hasApplied = false;
    if (req.user) {
      const worker = await prisma.worker.findUnique({
        where: { userId: req.user.id },
      });
      if (worker) {
        hasApplied = request.matches.some(m => m.workerId === worker.id);
      }
    }

    return res.json({
      success: true,
      data: {
        request: {
          id: request.id,
          title: request.title,
          description: request.description,
          profession: request.profession,
          city: request.city,
          // Address hidden until match accepted
          urgency: request.urgency,
          preferredDate: request.preferredDate,
          flexibleDates: request.flexibleDates,
          budgetMin: request.budgetMin,
          budgetMax: request.budgetMax,
          budgetType: request.budgetType,
          status: request.status,
          isPriority: request.isPriority,
          isUrgent: request.isUrgent,
          viewCount: request.viewCount,
          responseCount: request.matches.length,
          household: request.household,
          createdAt: request.createdAt,
        },
        hasApplied,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching service request');
    return res.status(500).json({ success: false, message: 'Greška pri učitavanju' });
  }
});

// ============================================
// Authenticated routes - Household creates requests
// ============================================

/**
 * POST /api/services
 * Create new service request
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      title,
      description,
      profession,
      city,
      address,
      urgency,
      preferredDate,
      flexibleDates,
      budgetMin,
      budgetMax,
      budgetType,
    } = req.body;

    // Get or create household profile
    let household = await prisma.household.findUnique({
      where: { userId: req.user!.id },
    });

    if (!household) {
      // Auto-create household profile
      household = await prisma.household.create({
        data: {
          userId: req.user!.id,
          displayName: req.user!.email?.split('@')[0] || 'Korisnik',
          phone: req.user!.phone,
          phoneVerified: req.user!.phoneVerified,
          email: req.user!.email,
          city: city,
        },
      });

      // Update user profile type
      await prisma.user.update({
        where: { id: req.user!.id },
        data: { profileType: 'HOUSEHOLD' },
      });
    }

    // Create service request
    const request = await prisma.serviceRequest.create({
      data: {
        householdId: household.id,
        title,
        description,
        profession,
        city,
        address,
        urgency: urgency || 'NORMAL',
        preferredDate: preferredDate ? new Date(preferredDate) : null,
        flexibleDates: flexibleDates ?? true,
        budgetMin,
        budgetMax,
        budgetType: budgetType || 'TOTAL',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Update household stats
    await prisma.household.update({
      where: { id: household.id },
      data: { jobsPosted: { increment: 1 } },
    });

    logger.info({ requestId: request.id, userId: req.user!.id }, 'Service request created');

    return res.json({
      success: true,
      data: { request },
      message: 'Zahtev uspešno kreiran',
    });
  } catch (error) {
    logger.error({ error }, 'Error creating service request');
    return res.status(500).json({ success: false, message: 'Greška pri kreiranju zahteva' });
  }
});

/**
 * GET /api/services/my/requests
 * Get user's service requests (as household)
 */
router.get('/my/requests', authenticate, async (req, res) => {
  try {
    const household = await prisma.household.findUnique({
      where: { userId: req.user!.id },
    });

    if (!household) {
      return res.json({
        success: true,
        data: { requests: [] },
      });
    }

    const requests = await prisma.serviceRequest.findMany({
      where: {
        householdId: household.id,
        deletedAt: null,
      },
      include: {
        matches: {
          include: {
            // We'd need to add worker relation to ServiceMatch
          },
        },
        _count: {
          select: { matches: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: { requests },
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching user requests');
    return res.status(500).json({ success: false, message: 'Greška' });
  }
});

/**
 * POST /api/services/:id/apply
 * Worker applies to service request
 */
router.post('/:id/apply', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    // Check if user is a worker
    const worker = await prisma.worker.findUnique({
      where: { userId: req.user!.id },
    });

    if (!worker) {
      return res.status(400).json({
        success: false,
        message: 'Morate imati majstorski profil da biste se prijavili',
      });
    }

    // Check if request exists
    const request = await prisma.serviceRequest.findUnique({
      where: { id },
    });

    if (!request || request.status !== 'OPEN') {
      return res.status(404).json({ success: false, message: 'Zahtev nije pronađen ili je zatvoren' });
    }

    // Check if already applied
    const existingMatch = await prisma.serviceMatch.findUnique({
      where: {
        serviceRequestId_workerId: {
          serviceRequestId: id,
          workerId: worker.id,
        },
      },
    });

    if (existingMatch) {
      return res.status(400).json({ success: false, message: 'Već ste se prijavili na ovaj zahtev' });
    }

    // Create match
    const match = await prisma.serviceMatch.create({
      data: {
        serviceRequestId: id,
        workerId: worker.id,
        status: 'PENDING',
        workerApplied: true,
        initialMessage: message,
      },
    });

    // Update request response count
    await prisma.serviceRequest.update({
      where: { id },
      data: { responseCount: { increment: 1 } },
    });

    logger.info({ matchId: match.id, requestId: id, workerId: worker.id }, 'Worker applied to request');

    return res.json({
      success: true,
      data: { match },
      message: 'Prijava uspešna',
    });
  } catch (error) {
    logger.error({ error }, 'Error applying to request');
    return res.status(500).json({ success: false, message: 'Greška pri prijavi' });
  }
});

/**
 * POST /api/services/:id/accept/:matchId
 * Household accepts worker's application
 */
router.post('/:id/accept/:matchId', authenticate, async (req, res) => {
  try {
    const { id, matchId } = req.params;

    // Check ownership
    const household = await prisma.household.findUnique({
      where: { userId: req.user!.id },
    });

    if (!household) {
      return res.status(403).json({ success: false, message: 'Nemate pristup' });
    }

    const request = await prisma.serviceRequest.findFirst({
      where: {
        id,
        householdId: household.id,
      },
    });

    if (!request) {
      return res.status(403).json({ success: false, message: 'Nemate pristup ovom zahtevu' });
    }

    // Update match
    const match = await prisma.serviceMatch.update({
      where: { id: matchId },
      data: {
        status: 'ACCEPTED',
        householdInvited: true,
        respondedAt: new Date(),
      },
    });

    // Update request status
    await prisma.serviceRequest.update({
      where: { id },
      data: { status: 'IN_PROGRESS' },
    });

    return res.json({
      success: true,
      data: { match },
      message: 'Majstor prihvaćen. Potrebno je plaćanje za otkrivanje kontakta.',
    });
  } catch (error) {
    logger.error({ error }, 'Error accepting match');
    return res.status(500).json({ success: false, message: 'Greška' });
  }
});

/**
 * POST /api/services/:id/complete
 * Mark service as completed and leave review
 */
router.post('/:id/complete', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { matchId, rating, review } = req.body;

    // Check ownership
    const household = await prisma.household.findUnique({
      where: { userId: req.user!.id },
    });

    if (!household) {
      return res.status(403).json({ success: false, message: 'Nemate pristup' });
    }

    const request = await prisma.serviceRequest.findFirst({
      where: {
        id,
        householdId: household.id,
      },
    });

    if (!request) {
      return res.status(403).json({ success: false, message: 'Nemate pristup' });
    }

    // Update match with review
    const match = await prisma.serviceMatch.update({
      where: { id: matchId },
      data: {
        status: 'COMPLETED',
        workerRating: rating,
        householdReview: review,
        completedAt: new Date(),
      },
    });

    // Update request
    await prisma.serviceRequest.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Update worker rating
    // Get worker ID from match and recalculate rating
    const workerMatches = await prisma.serviceMatch.findMany({
      where: {
        workerId: match.workerId,
        workerRating: { not: null },
      },
      select: { workerRating: true },
    });

    const avgRating = workerMatches.reduce((acc, m) => acc + (m.workerRating || 0), 0) / workerMatches.length;

    await prisma.worker.update({
      where: { id: match.workerId },
      data: {
        rating: avgRating,
        reviewCount: workerMatches.length,
      },
    });

    // Update household stats
    await prisma.household.update({
      where: { id: household.id },
      data: { reviewsGiven: { increment: 1 } },
    });

    return res.json({
      success: true,
      message: 'Posao označen kao završen. Hvala na recenziji!',
    });
  } catch (error) {
    logger.error({ error }, 'Error completing service');
    return res.status(500).json({ success: false, message: 'Greška' });
  }
});

export default router;
