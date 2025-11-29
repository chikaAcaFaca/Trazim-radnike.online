import { Router, Request, Response } from 'express';
import { adminService } from '../services/admin.service.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';
import { logger } from '../utils/logger.js';

const router = Router();

// All admin routes require authentication and admin role
router.use(requireAuth);
router.use(requireAdmin);

/**
 * GET /api/admin/stats
 * Get dashboard statistics
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error({ error }, 'Error fetching admin stats');
    res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
  }
});

/**
 * GET /api/admin/leads
 * Get all leads from chatbot sessions
 */
router.get('/leads', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const hotOnly = req.query.hot === 'true';

    const result = await adminService.getLeads({ page, limit, hotOnly });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error({ error }, 'Error fetching leads');
    res.status(500).json({ success: false, error: 'Failed to fetch leads' });
  }
});

/**
 * GET /api/admin/leads/:id
 * Get single lead details
 */
router.get('/leads/:id', async (req: Request, res: Response) => {
  try {
    const lead = await adminService.getLeadById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }
    return res.json({ success: true, data: lead });
  } catch (error) {
    logger.error({ error }, 'Error fetching lead');
    return res.status(500).json({ success: false, error: 'Failed to fetch lead' });
  }
});

/**
 * GET /api/admin/jobs
 * Get all jobs for admin view
 */
router.get('/jobs', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;

    const result = await adminService.getAllJobs({ page, limit, status });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error({ error }, 'Error fetching jobs');
    res.status(500).json({ success: false, error: 'Failed to fetch jobs' });
  }
});

/**
 * GET /api/admin/jobs/:id
 * Get single job details (admin view)
 */
router.get('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const { prisma } = await import('../config/database.js');
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: {
        company: {
          include: {
            user: {
              select: {
                email: true,
                phone: true,
              },
            },
          },
        },
        uploads: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!job) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    return res.json({ success: true, data: job });
  } catch (error) {
    logger.error({ error }, 'Error fetching job');
    return res.status(500).json({ success: false, error: 'Failed to fetch job' });
  }
});

/**
 * GET /api/admin/users
 * Get all users for admin view
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const role = req.query.role as string;

    const result = await adminService.getAllUsers({ page, limit, role });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error({ error }, 'Error fetching users');
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

/**
 * GET /api/admin/audit-logs
 * Get audit logs
 */
router.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const userId = req.query.userId as string;
    const action = req.query.action as string;

    const result = await adminService.getAuditLogs({ page, limit, userId, action });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error({ error }, 'Error fetching audit logs');
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs' });
  }
});

export default router;
