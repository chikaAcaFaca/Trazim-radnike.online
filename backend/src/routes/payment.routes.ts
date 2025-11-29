import { Router } from 'express';
import { prisma } from '../config/database.js';
import { ipsService } from '../services/ips.service.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { logger } from '../utils/logger.js';

const router = Router();

// ============================================
// Public routes
// ============================================

/**
 * GET /api/payments/plans
 * Get all active subscription plans
 */
router.get('/plans', async (_req, res) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });

    return res.json({
      success: true,
      data: {
        plans: plans.map(plan => ({
          ...plan,
          features: plan.features ? JSON.parse(plan.features) : [],
        })),
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching plans');
    return res.status(500).json({ success: false, message: 'Greška pri učitavanju paketa' });
  }
});

// ============================================
// Authenticated routes
// ============================================

/**
 * POST /api/payments/subscription
 * Create payment for subscription
 */
router.post('/subscription', authenticate, async (req, res) => {
  try {
    const { planCode } = req.body;

    if (!planCode) {
      return res.status(400).json({ success: false, message: 'Plan code is required' });
    }

    const result = await ipsService.createSubscriptionPayment(req.user!.id, planCode);

    return res.json({
      success: true,
      data: {
        paymentId: result.paymentId,
        qrCode: result.qrCodeDataUrl,
        referenceNumber: result.referenceNumber,
        expiresAt: result.expiresAt,
      },
    });
  } catch (error: any) {
    logger.error({ error }, 'Error creating subscription payment');
    return res.status(500).json({ success: false, message: error.message || 'Greška pri kreiranju plaćanja' });
  }
});

/**
 * POST /api/payments/topup
 * Create payment for credits top-up
 */
router.post('/topup', authenticate, async (req, res) => {
  try {
    const { amount, credits } = req.body;

    if (!amount || !credits) {
      return res.status(400).json({ success: false, message: 'Amount and credits are required' });
    }

    const result = await ipsService.createTopupPayment(req.user!.id, amount, credits);

    return res.json({
      success: true,
      data: {
        paymentId: result.paymentId,
        qrCode: result.qrCodeDataUrl,
        referenceNumber: result.referenceNumber,
        expiresAt: result.expiresAt,
      },
    });
  } catch (error: any) {
    logger.error({ error }, 'Error creating topup payment');
    return res.status(500).json({ success: false, message: error.message || 'Greška pri kreiranju plaćanja' });
  }
});

/**
 * POST /api/payments/contact-reveal
 * Create payment to reveal contact
 */
router.post('/contact-reveal', authenticate, async (req, res) => {
  try {
    const { matchId } = req.body;

    if (!matchId) {
      return res.status(400).json({ success: false, message: 'Match ID is required' });
    }

    const result = await ipsService.createContactRevealPayment(req.user!.id, matchId);

    return res.json({
      success: true,
      data: {
        paymentId: result.paymentId,
        qrCode: result.qrCodeDataUrl,
        referenceNumber: result.referenceNumber,
        expiresAt: result.expiresAt,
        amount: 30, // 30 RSD
      },
    });
  } catch (error: any) {
    logger.error({ error }, 'Error creating contact reveal payment');
    return res.status(500).json({ success: false, message: error.message || 'Greška pri kreiranju plaćanja' });
  }
});

/**
 * POST /api/payments/priority
 * Create payment for priority listing
 */
router.post('/priority', authenticate, async (req, res) => {
  try {
    const { serviceRequestId } = req.body;

    if (!serviceRequestId) {
      return res.status(400).json({ success: false, message: 'Service request ID is required' });
    }

    const result = await ipsService.createPriorityPayment(req.user!.id, serviceRequestId);

    return res.json({
      success: true,
      data: {
        paymentId: result.paymentId,
        qrCode: result.qrCodeDataUrl,
        referenceNumber: result.referenceNumber,
        expiresAt: result.expiresAt,
        amount: 150, // 150 RSD
      },
    });
  } catch (error: any) {
    logger.error({ error }, 'Error creating priority payment');
    return res.status(500).json({ success: false, message: error.message || 'Greška pri kreiranju plaćanja' });
  }
});

/**
 * POST /api/payments/urgent
 * Create payment for urgent listing
 */
router.post('/urgent', authenticate, async (req, res) => {
  try {
    const { serviceRequestId } = req.body;

    if (!serviceRequestId) {
      return res.status(400).json({ success: false, message: 'Service request ID is required' });
    }

    const result = await ipsService.createUrgentPayment(req.user!.id, serviceRequestId);

    return res.json({
      success: true,
      data: {
        paymentId: result.paymentId,
        qrCode: result.qrCodeDataUrl,
        referenceNumber: result.referenceNumber,
        expiresAt: result.expiresAt,
        amount: 300, // 300 RSD
      },
    });
  } catch (error: any) {
    logger.error({ error }, 'Error creating urgent payment');
    return res.status(500).json({ success: false, message: error.message || 'Greška pri kreiranju plaćanja' });
  }
});

/**
 * GET /api/payments/status/:paymentId
 * Check payment status
 */
router.get('/status/:paymentId', authenticate, async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await ipsService.getPaymentStatus(paymentId);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Plaćanje nije pronađeno' });
    }

    // Only allow user to see their own payments
    if (payment.userId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Nemate pristup' });
    }

    return res.json({
      success: true,
      data: { payment },
    });
  } catch (error) {
    logger.error({ error }, 'Error checking payment status');
    return res.status(500).json({ success: false, message: 'Greška pri proveri statusa' });
  }
});

/**
 * GET /api/payments/history
 * Get user's payment history
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return res.json({
      success: true,
      data: { payments },
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching payment history');
    return res.status(500).json({ success: false, message: 'Greška pri učitavanju istorije' });
  }
});

/**
 * GET /api/payments/subscription/current
 * Get user's current subscription
 */
router.get('/subscription/current', authenticate, async (req, res) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.user!.id,
        status: 'ACTIVE',
        endDate: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: { subscription },
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching subscription');
    return res.status(500).json({ success: false, message: 'Greška pri učitavanju pretplate' });
  }
});

// ============================================
// Admin routes
// ============================================

/**
 * POST /api/payments/verify
 * Admin: Verify payment by reference number
 */
router.post('/verify', authenticate, requireAdmin, async (req, res) => {
  try {
    const { referenceNumber } = req.body;

    if (!referenceNumber) {
      return res.status(400).json({ success: false, message: 'Reference number is required' });
    }

    const result = await ipsService.verifyPayment(referenceNumber, req.user!.id);

    if (!result.success) {
      return res.status(404).json({ success: false, message: 'Plaćanje nije pronađeno' });
    }

    return res.json({
      success: true,
      data: { payment: result.payment },
      message: 'Plaćanje uspešno verifikovano',
    });
  } catch (error) {
    logger.error({ error }, 'Error verifying payment');
    return res.status(500).json({ success: false, message: 'Greška pri verifikaciji' });
  }
});

/**
 * GET /api/payments/pending
 * Admin: Get all pending payments
 */
router.get('/pending', authenticate, requireAdmin, async (_req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: { email: true, phone: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({
      success: true,
      data: { payments },
    });
  } catch (error) {
    logger.error({ error }, 'Error fetching pending payments');
    return res.status(500).json({ success: false, message: 'Greška pri učitavanju' });
  }
});

export default router;
