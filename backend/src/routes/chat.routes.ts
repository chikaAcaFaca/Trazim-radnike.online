import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { requireAuth, optionalAuth, requireRole } from '../middleware/auth.middleware.js';
import { chatbotService } from '../services/chatbot.service.js';
import { emailService } from '../services/email.service.js';
import { smsService } from '../services/sms.service.js';
import { prisma } from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

// Base URL for links in notifications
const BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://trazim-radnike.online'
  : 'http://localhost:3000';

const router = Router();

// Helper for async route handlers
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Validation schemas
const sendMessageSchema = z.object({
  body: z.object({
    message: z.string().min(1, 'Message is required').max(2000),
    guestSessionId: z.string().optional(),
  }),
});

const escalateSchema = z.object({
  body: z.object({
    reason: z.string().max(500).optional(),
  }),
});

// ==========================================
// AI Chatbot Routes
// ==========================================

/**
 * @route POST /api/chat/bot/message
 * @desc Send message to chatbot and get response
 * @access Public (optional auth)
 */
router.post(
  '/bot/message',
  optionalAuth,
  validate(sendMessageSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { message, guestSessionId } = req.body;

    // Use user ID if authenticated, otherwise use guestSessionId
    const userId =
      req.user?.id ||
      guestSessionId ||
      `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const response = await chatbotService.processMessage(userId, message);

    res.json({
      success: true,
      data: {
        response: response.message,
        suggestedActions: response.suggestedActions || [],
        collectedData: response.collectedData || null,
        action: response.action || null,
      },
    });
  })
);

/**
 * @route GET /api/chat/bot/greeting
 * @desc Get initial chatbot greeting
 * @access Public
 */
router.get('/bot/greeting', (_req: Request, res: Response) => {
  const greeting = chatbotService.getInitialGreeting();

  res.json({
    success: true,
    data: {
      response: greeting.message,
      suggestedActions: greeting.suggestedActions || [],
    },
  });
});

/**
 * @route GET /api/chat/bot/history
 * @desc Get chatbot conversation history
 */
router.get(
  '/bot/history',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 50;
    const history = await chatbotService.getConversationHistory(req.user!.id, limit);

    res.json({
      success: true,
      data: { messages: history },
    });
  })
);

/**
 * @route POST /api/chat/bot/escalate
 * @desc Escalate bot conversation to human operator
 */
router.post(
  '/bot/escalate',
  requireAuth,
  validate(escalateSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { reason } = req.body;
    await chatbotService.escalateToHuman(req.user!.id, reason);

    res.json({
      success: true,
      message: 'Razgovor je prosleđen operateru',
    });
  })
);

// ==========================================
// Employer <-> Admin Messaging Routes
// ==========================================

/**
 * @route GET /api/chat/conversations
 * @desc Get all conversations for user
 */
router.get(
  '/conversations',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Build query based on role
    const where =
      userRole === 'ADMIN'
        ? { type: 'EMPLOYER_ADMIN' }
        : { userId, type: { in: ['AI_ASSISTANT', 'EMPLOYER_ADMIN'] } };

    const conversations = await prisma.conversation.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true },
        },
        job: {
          select: { id: true, title: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            content: true,
            createdAt: true,
            readAt: true,
            fromRole: true,
          },
        },
      },
    });

    // Count unread messages
    const formattedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            readAt: null,
            fromUserId: { not: userId },
          },
        });

        return {
          id: conv.id,
          type: conv.type,
          status: conv.status,
          user: conv.user,
          job: conv.job,
          lastMessage: conv.messages[0] || null,
          unreadCount,
          updatedAt: conv.updatedAt,
        };
      })
    );

    res.json({
      success: true,
      data: { conversations: formattedConversations },
    });
  })
);

/**
 * @route GET /api/chat/conversations/:id
 * @desc Get a specific conversation with messages
 */
router.get(
  '/conversations/:id',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true },
        },
        job: {
          select: { id: true, title: true, slug: true },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new ApiError(404, 'Razgovor nije pronađen');
    }

    // Check access
    if (userRole !== 'ADMIN' && conversation.userId !== userId) {
      throw new ApiError(403, 'Pristup odbijen');
    }

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId: id,
        fromUserId: { not: userId },
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    res.json({
      success: true,
      data: { conversation },
    });
  })
);

/**
 * @route POST /api/chat/conversations/:id/messages
 * @desc Send message to a conversation
 */
router.post(
  '/conversations/:id/messages',
  requireAuth,
  validate(sendMessageSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    // Check conversation exists and user has access
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, email: true, phone: true },
        },
      },
    });

    if (!conversation) {
      throw new ApiError(404, 'Razgovor nije pronađen');
    }

    if (userRole !== 'ADMIN' && conversation.userId !== userId) {
      throw new ApiError(403, 'Pristup odbijen');
    }

    // Create message
    const newMessage = await prisma.message.create({
      data: {
        conversationId: id,
        fromUserId: userId,
        fromRole: userRole === 'ADMIN' ? 'ADMIN' : 'EMPLOYER',
        content: message,
        isFromAI: false,
      },
    });

    // Update conversation
    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    // Send notification to recipient
    try {
      const conversationUrl = `${BASE_URL}/kontrolna-tabla/poruke/${id}`;
      const senderName = userRole === 'ADMIN' ? 'Administrator' : 'Poslodavac';

      if (userRole === 'ADMIN' && conversation.user) {
        // Admin sent message -> notify employer via email
        await emailService.sendNewMessageNotification(
          conversation.user.email,
          senderName,
          message,
          conversationUrl
        );

        // Also send SMS if phone available
        if (conversation.user.phone) {
          await smsService.sendNewMessageNotification(
            conversation.user.phone,
            senderName
          );
        }

        logger.info({ recipientEmail: conversation.user.email }, 'New message notification sent');
      } else if (userRole !== 'ADMIN') {
        // Employer sent message -> notify admin(s)
        const admins = await prisma.user.findMany({
          where: { role: 'ADMIN' },
          select: { email: true },
        });

        for (const admin of admins) {
          await emailService.sendNewMessageNotification(
            admin.email,
            senderName,
            message,
            `${BASE_URL}/admin`
          );
        }

        logger.info({ adminCount: admins.length }, 'New message notification sent to admins');
      }
    } catch (notificationError) {
      // Don't fail the request if notification fails
      logger.error({ error: notificationError }, 'Failed to send message notification');
    }

    res.status(201).json({
      success: true,
      data: { message: newMessage },
    });
  })
);

/**
 * @route POST /api/chat/job/:jobId/support
 * @desc Create or get support conversation for a job
 */
router.post(
  '/job/:jobId/support',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { jobId } = req.params;
    const userId = req.user!.id;

    // Verify user owns the job
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { company: { select: { userId: true } } },
    });

    if (!job || job.deletedAt) {
      throw new ApiError(404, 'Oglas nije pronađen');
    }

    if (job.company.userId !== userId) {
      throw new ApiError(403, 'Pristup odbijen');
    }

    // Find existing or create new conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        jobId,
        userId,
        type: 'EMPLOYER_ADMIN',
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId,
          jobId,
          type: 'EMPLOYER_ADMIN',
          status: 'ACTIVE',
        },
      });

      // Create welcome message
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          fromRole: 'ADMIN',
          content: `Dobrodošli u podršku za oglas "${job.title}".

Kako vam možemo pomoći? Naš tim će vam odgovoriti u najkraćem mogućem roku.`,
          isFromAI: false,
        },
      });
    }

    res.json({
      success: true,
      data: { conversationId: conversation.id },
    });
  })
);

// ==========================================
// Admin Routes
// ==========================================

/**
 * @route GET /api/chat/admin/pending
 * @desc Get pending/escalated conversations (admin only)
 */
router.get(
  '/admin/pending',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (_req: Request, res: Response) => {
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ status: 'ARCHIVED' }, { type: 'EMPLOYER_ADMIN', status: 'ACTIVE' }],
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true },
        },
        job: {
          select: { id: true, title: true },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    res.json({
      success: true,
      data: { conversations },
    });
  })
);

/**
 * @route POST /api/chat/admin/close/:id
 * @desc Close a conversation (admin only)
 */
router.post(
  '/admin/close/:id',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    await prisma.conversation.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });

    res.json({
      success: true,
      message: 'Razgovor je zatvoren',
    });
  })
);

// ==========================================
// Conversation Summaries (Sales Review)
// ==========================================

/**
 * @route GET /api/chat/admin/summaries
 * @desc Get conversation summaries for sales review (admin only)
 */
router.get(
  '/admin/summaries',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const status = req.query.status as string | undefined;
    const minLeadScore = parseInt(req.query.minLeadScore as string) || 0;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const summaries = await chatbotService.getConversationSummaries({
      status,
      minLeadScore,
      limit,
      offset,
    });

    res.json({
      success: true,
      data: { summaries },
    });
  })
);

/**
 * @route PUT /api/chat/admin/summaries/:conversationId
 * @desc Update lead status for a conversation
 */
router.put(
  '/admin/summaries/:conversationId',
  requireAuth,
  requireRole('ADMIN'),
  asyncHandler(async (req: Request, res: Response) => {
    const { conversationId } = req.params;
    const { leadStatus, salesNotes } = req.body;

    await chatbotService.updateLeadStatus(conversationId, leadStatus, salesNotes);

    res.json({
      success: true,
      message: 'Status ažuriran',
    });
  })
);

export default router;
