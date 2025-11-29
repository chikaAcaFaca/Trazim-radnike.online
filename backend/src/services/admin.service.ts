import { prisma } from '../config/database.js';

export interface DashboardStats {
  totalUsers: number;
  totalJobs: number;
  totalLeads: number;
  hotLeads: number;
  recentActivity: {
    newUsersToday: number;
    newJobsToday: number;
    newLeadsToday: number;
  };
}

export interface LeadData {
  id: string;
  sessionId: string;
  collectedData: Record<string, any>;
  conversationHistory: Array<{ role: string; content: string }>;
  lastActivity: Date;
  createdAt: Date;
  isHotLead: boolean;
}

class AdminService {
  /**
   * Get dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalJobs,
      totalLeads,
      newUsersToday,
      newJobsToday,
      newLeadsToday,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.job.count({ where: { deletedAt: null } }),
      prisma.chatbotSession.count(),
      prisma.user.count({
        where: { createdAt: { gte: today }, deletedAt: null },
      }),
      prisma.job.count({
        where: { createdAt: { gte: today }, deletedAt: null },
      }),
      prisma.chatbotSession.count({
        where: { createdAt: { gte: today } },
      }),
    ]);

    // Count hot leads (sessions with foreignWorkers = da/yes)
    const allSessions = await prisma.chatbotSession.findMany({
      select: { collectedData: true },
    });

    let hotLeads = 0;
    for (const session of allSessions) {
      if (session.collectedData) {
        try {
          const data = JSON.parse(session.collectedData);
          if (/da|yes|zainteresovan|hteli|hoce/i.test(data.foreignWorkers || '')) {
            hotLeads++;
          }
        } catch {
          // Invalid JSON, skip
        }
      }
    }

    return {
      totalUsers,
      totalJobs,
      totalLeads,
      hotLeads,
      recentActivity: {
        newUsersToday,
        newJobsToday,
        newLeadsToday,
      },
    };
  }

  /**
   * Get all leads from chatbot sessions
   */
  async getLeads(options: {
    page?: number;
    limit?: number;
    hotOnly?: boolean;
  } = {}): Promise<{ leads: LeadData[]; total: number; page: number; totalPages: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const sessions = await prisma.chatbotSession.findMany({
      orderBy: { lastActivity: 'desc' },
      skip,
      take: limit,
    });

    const total = await prisma.chatbotSession.count();

    const leads: LeadData[] = sessions.map((session) => {
      let collectedData: Record<string, any> = {};
      let conversationHistory: Array<{ role: string; content: string }> = [];

      try {
        if (session.collectedData) {
          collectedData = JSON.parse(session.collectedData);
        }
        if (session.conversationHistory) {
          conversationHistory = JSON.parse(session.conversationHistory);
        }
      } catch {
        // Invalid JSON
      }

      const isHotLead = /da|yes|zainteresovan|hteli|hoce/i.test(collectedData.foreignWorkers || '');

      return {
        id: session.id,
        sessionId: session.sessionId,
        collectedData,
        conversationHistory,
        lastActivity: session.lastActivity,
        createdAt: session.createdAt,
        isHotLead,
      };
    });

    // Filter hot leads if requested
    const filteredLeads = options.hotOnly ? leads.filter((l) => l.isHotLead) : leads;

    return {
      leads: filteredLeads,
      total: options.hotOnly ? filteredLeads.length : total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single lead details
   */
  async getLeadById(id: string): Promise<LeadData | null> {
    const session = await prisma.chatbotSession.findUnique({
      where: { id },
    });

    if (!session) return null;

    let collectedData: Record<string, any> = {};
    let conversationHistory: Array<{ role: string; content: string }> = [];

    try {
      if (session.collectedData) {
        collectedData = JSON.parse(session.collectedData);
      }
      if (session.conversationHistory) {
        conversationHistory = JSON.parse(session.conversationHistory);
      }
    } catch {
      // Invalid JSON
    }

    const isHotLead = /da|yes|zainteresovan|hteli|hoce/i.test(collectedData.foreignWorkers || '');

    return {
      id: session.id,
      sessionId: session.sessionId,
      collectedData,
      conversationHistory,
      lastActivity: session.lastActivity,
      createdAt: session.createdAt,
      isHotLead,
    };
  }

  /**
   * Get all jobs for admin
   */
  async getAllJobs(options: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (options.status) {
      where.status = options.status;
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          company: {
            select: {
              name: true,
              city: true,
              country: true,
              user: {
                select: {
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    return {
      jobs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get all users for admin
   */
  async getAllUsers(options: {
    page?: number;
    limit?: number;
    role?: string;
  } = {}) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };
    if (options.role) {
      where.role = options.role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          phone: true,
          phoneVerified: true,
          emailVerified: true,
          role: true,
          gdprConsent: true,
          lastLoginAt: true,
          createdAt: true,
          company: {
            select: {
              name: true,
              city: true,
              country: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(options: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
  } = {}) {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options.userId) where.userId = options.userId;
    if (options.action) where.action = options.action;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Search jobs for public job board
   */
  async searchPublicJobs(options: {
    query?: string;
    location?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      deletedAt: null,
      status: 'POSTED',
      visibility: 'PUBLIC',
    };

    // Search by title or description
    if (options.query) {
      where.OR = [
        { title: { contains: options.query } },
        { descriptionPublic: { contains: options.query } },
      ];
    }

    // Filter by location
    if (options.location) {
      where.OR = where.OR || [];
      where.OR.push(
        { location: { contains: options.location } },
        { locationCity: { contains: options.location } }
      );
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        select: {
          id: true,
          title: true,
          slug: true,
          descriptionPublic: true,
          salary: true,
          location: true,
          locationCity: true,
          numWorkers: true,
          housing: true,
          createdAt: true,
          company: {
            select: {
              name: true,
              city: true,
              logoUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    return {
      jobs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const adminService = new AdminService();
