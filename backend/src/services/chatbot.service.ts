import { prisma } from '../config/database.js';
import { claudeService, ClaudeMessage } from './claude.service.js';
import { emailService } from './email.service.js';
import { logger } from '../utils/logger.js';

// Types
export interface ChatbotResponse {
  message: string;
  suggestedActions?: string[];
  collectedData?: Record<string, any>;
  action?: 'REGISTER' | 'CREATE_JOB' | 'CONTACT_SUPPORT' | null;
}

// Session type for registration flow
interface ChatbotSessionData {
  step: string;
  collectedData: Record<string, any>;
  conversationHistory: ClaudeMessage[];
}

// Flow states
const STEPS = {
  INIT: 'init',
  COLLECTING: 'collecting', // AI-driven data collection
  CONFIRM: 'confirm',
  COMPLETE: 'complete',
};

// Required fields for a complete lead/job posting
const REQUIRED_FIELDS = [
  'positions',
  'salary',
  'location',
  'workHours',
  'housing',
  'experience',
  'languages',
  'foreignWorkers', // Interest in foreign workers (key sales question)
  'contactEmail',   // Email for follow-up
];

// Helper functions for session storage (using database)
async function getSession(sessionId: string): Promise<ChatbotSessionData | null> {
  try {
    const session = await prisma.chatbotSession.findUnique({
      where: { sessionId },
    });
    if (!session) return null;

    return {
      step: session.step,
      collectedData: session.collectedData ? JSON.parse(session.collectedData) : {},
      conversationHistory: session.conversationHistory ? JSON.parse(session.conversationHistory) : [],
    };
  } catch (error) {
    logger.error({ error }, 'Error getting session');
    return null;
  }
}

async function setSession(sessionId: string, data: ChatbotSessionData): Promise<void> {
  try {
    await prisma.chatbotSession.upsert({
      where: { sessionId },
      create: {
        sessionId,
        step: data.step,
        collectedData: JSON.stringify(data.collectedData),
        conversationHistory: JSON.stringify(data.conversationHistory || []),
        lastActivity: new Date(),
      },
      update: {
        step: data.step,
        collectedData: JSON.stringify(data.collectedData),
        conversationHistory: JSON.stringify(data.conversationHistory || []),
        lastActivity: new Date(),
      },
    });
  } catch (error) {
    logger.error({ error }, 'Error setting session');
  }
}

async function deleteSession(sessionId: string): Promise<void> {
  try {
    await prisma.chatbotSession.delete({
      where: { sessionId },
    }).catch(() => {});
  } catch (error) {
    logger.error({ error }, 'Error deleting session');
  }
}

// Clean old sessions periodically (older than 1 hour)
setInterval(async () => {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    await prisma.chatbotSession.deleteMany({
      where: { lastActivity: { lt: oneHourAgo } },
    });
  } catch (error) {
    logger.error({ error }, 'Error cleaning old sessions');
  }
}, 5 * 60 * 1000);

class ChatbotService {
  /**
   * Process a message and return response
   */
  async processMessage(
    userId: string,
    message: string,
    _existingHistory: ClaudeMessage[] = []
  ): Promise<ChatbotResponse> {
    // Get or create session for ALL users (including guests)
    let session = await getSession(userId);

    // Initialize session if it doesn't exist
    if (!session) {
      session = {
        step: STEPS.INIT,
        collectedData: {},
        conversationHistory: [],
      };
    }

    logger.info({
      userId,
      message,
      sessionStep: session.step,
      historyLength: session.conversationHistory?.length || 0
    }, 'Processing message');

    // Check for cancel/reset commands
    if (/^(odustani|prekini|cancel|stop|reset|ispocetka)$/i.test(message.trim())) {
      await deleteSession(userId);
      return {
        message: `Nema problema! Ako se predomislite, tu sam. 😊

Kako vam mogu pomoći?`,
        suggestedActions: ['📝 Kreiraj oglas', '❓ Imam pitanje', '📞 Kontakt'],
      };
    }

    // If in guided flow (not INIT), handle it
    if (session.step !== STEPS.INIT) {
      const response = await this.handleGuidedFlow(userId, message, session);
      // Store conversation in session
      session.conversationHistory = session.conversationHistory || [];
      session.conversationHistory.push({ role: 'user', content: message });
      session.conversationHistory.push({ role: 'assistant', content: response.message });
      await setSession(userId, session);
      await this.storeMessage(userId, message, response.message);
      return response;
    }

    // Check if user wants to start job creation flow
    if (this.detectStartIntent(message)) {
      const response = await this.startJobCreationFlow(userId, session);
      return response;
    }

    // Try Claude AI for general conversation
    if (claudeService.isAvailable()) {
      // Use session history instead of database history for guests
      const history = session.conversationHistory || [];

      const claudeResponse = await claudeService.chat(message, history);
      if (claudeResponse) {
        const response: ChatbotResponse = {
          message: claudeResponse.content,
          suggestedActions: this.extractSuggestedActions(claudeResponse.content),
        };

        // Store conversation in session
        session.conversationHistory = session.conversationHistory || [];
        session.conversationHistory.push({ role: 'user', content: message });
        session.conversationHistory.push({ role: 'assistant', content: claudeResponse.content });

        // Keep only last 20 messages to prevent session from growing too large
        if (session.conversationHistory.length > 20) {
          session.conversationHistory = session.conversationHistory.slice(-20);
        }

        await setSession(userId, session);
        await this.storeMessage(userId, message, response.message);
        return response;
      }
    }

    // Fallback response
    const response = this.getFallbackResponse(message);

    // Store in session even for fallback
    session.conversationHistory = session.conversationHistory || [];
    session.conversationHistory.push({ role: 'user', content: message });
    session.conversationHistory.push({ role: 'assistant', content: response.message });
    await setSession(userId, session);
    await this.storeMessage(userId, message, response.message);
    return response;
  }

  /**
   * Start job creation guided flow
   */
  private async startJobCreationFlow(userId: string, existingSession?: ChatbotSessionData): Promise<ChatbotResponse> {
    const history = existingSession?.conversationHistory || [];
    const responseMsg = `Super, hajde da vidimo šta ti treba!

Reci mi koje radnike tražiš - npr. "2 pekara i 2 prodavačice" ili "5 vozača".

Možeš da mi kažeš sve odjednom ili idemo korak po korak, kako ti više odgovara.`;

    // Store the conversation in history
    history.push({ role: 'assistant', content: responseMsg });

    await setSession(userId, {
      step: STEPS.COLLECTING,
      collectedData: {},
      conversationHistory: history,
    });

    return {
      message: responseMsg,
      suggestedActions: ['Pekari', 'Vozači', 'Građevinci', 'Konobari'],
    };
  }

  /**
   * Handle AI-driven data collection flow
   */
  private async handleGuidedFlow(
    userId: string,
    message: string,
    session: ChatbotSessionData
  ): Promise<ChatbotResponse> {
    const trimmed = message.trim();
    session.collectedData = session.collectedData || {};

    // Handle CONFIRM step
    if (session.step === STEPS.CONFIRM) {
      if (/da|potvrdi|ok|yes|tacno|kreiraj|sacuvaj|salji|pošalji/i.test(trimmed)) {
        const finalData = { ...session.collectedData };
        session.step = STEPS.COMPLETE;
        await setSession(userId, session);

        // Send lead notification email to office@nknet-consulting.com
        try {
          await emailService.sendLeadNotification({
            positions: finalData.positions || 'Nije navedeno',
            salary: finalData.salary || 'Nije navedeno',
            location: finalData.location || 'Nije navedeno',
            workHours: finalData.workHours || 'Nije navedeno',
            housing: finalData.housing || 'Nije navedeno',
            experience: finalData.experience || 'Nije navedeno',
            languages: finalData.languages || 'Nije navedeno',
            foreignWorkers: finalData.foreignWorkers || 'Nije navedeno',
            contactEmail: finalData.contactEmail || 'Nije navedeno',
            contactPhone: finalData.contactPhone,
            companyName: finalData.companyName,
            sessionId: userId,
          });
          logger.info({ userId, finalData }, 'Lead notification email sent');
        } catch (error) {
          logger.error({ error, userId }, 'Failed to send lead notification email');
        }

        // Determine response based on foreign worker interest
        const isInterestedInForeignWorkers = /da|yes|zainteresovan|hteli|hoce/i.test(finalData.foreignWorkers || '');

        const responseMessage = isInterestedInForeignWorkers
          ? `Odlično, poslao sam tvoj zahtev kolegama! 🎉

Očekuj ponudu na **${finalData.contactEmail}** u roku od 24h - vidiš sve crno na belo, bez obaveza.

E da, registruj se na platformi - dobijaš besplatan biznis profil gde te firme mogu naći. Plus, možeš da pratiš status svog zahteva.

Hvala ti na poverenju!`
          : `Zahtev je poslat, javiće ti se kolege! 🎉

Čekaj mail na **${finalData.contactEmail}** - poslaće ti sve informacije.

A ako se predomisliš za radnike iz inostranstva - javi, imam odlične ljude iz Indije i Nepala, vredni su i dolaze spremni za posao.

Registruj se na platformi za besplatan biznis profil!`;

        return {
          message: responseMessage,
          suggestedActions: ['🚀 Registruj se na platformi', '📞 Kontaktiraj podršku', '🔄 Novi zahtev'],
          collectedData: finalData,
          action: 'REGISTER',
        };
      } else if (/ispocetka|ponovo|reset|ne|promen/i.test(trimmed)) {
        return this.startJobCreationFlow(userId);
      } else {
        // Let AI handle clarification
        session.step = STEPS.COLLECTING;
      }
    }

    // AI-driven COLLECTING step
    if (session.step === STEPS.COLLECTING || session.step === STEPS.CONFIRM) {
      // Use Claude AI with data extraction
      const result = await claudeService.chatWithDataExtraction(
        trimmed,
        session.conversationHistory,
        session.collectedData
      );

      if (result) {
        // Merge extracted data with existing data
        const newData = { ...session.collectedData, ...result.extractedData };
        session.collectedData = newData;

        // Check if all required fields are collected
        const missingFields = REQUIRED_FIELDS.filter(field => !newData[field]);

        logger.info({
          userId,
          collectedFields: Object.keys(newData).filter(k => newData[k]),
          missingFields,
          extractedNow: Object.keys(result.extractedData),
        }, 'Data collection progress');

        // If all fields collected, move to confirm
        if (missingFields.length === 0) {
          session.step = STEPS.CONFIRM;
          await setSession(userId, session);

          const data = session.collectedData;
          return {
            message: `${result.response.content}

Super, evo šta sam zapisao:

**Pozicije:** ${data.positions}
**Plata:** ${data.salary}
**Lokacija:** ${data.location}
**Smene:** ${data.workHours}
**Smeštaj:** ${data.housing}
**Iskustvo:** ${data.experience}
**Jezici:** ${data.languages}
**Strani radnici:** ${data.foreignWorkers}
**Email:** ${data.contactEmail}

Jel sve ok? Ako jeste, šaljem odmah kolegama da ti pripreme ponudu!`,
            suggestedActions: ['✅ Da, šalji!', '🔄 Hoću da promenim nešto'],
            collectedData: session.collectedData,
          };
        }

        await setSession(userId, session);
        return {
          message: result.response.content,
          suggestedActions: this.getSuggestedActions(missingFields),
          collectedData: session.collectedData,
        };
      }
    }

    // Fallback if AI not available
    await deleteSession(userId);
    return {
      message: `Izvinite, došlo je do tehničke greške. Hajde da počnemo ispočetka!`,
      suggestedActions: ['🚀 Kreiraj oglas'],
    };
  }

  /**
   * Get suggested actions based on missing fields
   */
  private getSuggestedActions(missingFields: string[]): string[] {
    const fieldSuggestions: Record<string, string[]> = {
      positions: ['🏭 Proizvodnja', '🍽️ Ugostiteljstvo', '🚗 Vozač'],
      salary: ['500-800 EUR', '800-1200 EUR', 'Po dogovoru'],
      location: ['Beograd, Srbija', 'Novi Sad, Srbija'],
      workHours: ['Puno radno vreme', 'Smenski rad'],
      housing: ['Da, obezbeđujemo', 'Ne'],
      experience: ['Bez iskustva', '1-2 godine'],
      languages: ['Srpski', 'Engleski', 'Nije bitno'],
      foreignWorkers: ['✅ Da, zainteresovan sam', '❌ Ne, hvala', '🤔 Možda, recite mi više'],
      contactEmail: [], // No suggestions - user needs to type their email
    };

    // Return suggestions for the first missing field
    const firstMissing = missingFields[0];
    return fieldSuggestions[firstMissing] || [];
  }

  /**
   * Detect if user wants to start job creation
   */
  private detectStartIntent(message: string): boolean {
    const patterns = [
      /kreiraj.*oglas/i,
      /postavi.*oglas/i,
      /novi.*oglas/i,
      /trazim.*radnik/i,
      /trebaju.*mi.*radnici/i,
      /hocu.*oglas/i,
      /zelim.*oglas/i,
      /pocni/i,
      /^(da|hocu|hajde|krenimo|pocnimo|spreman)$/i,
    ];
    return patterns.some((p) => p.test(message));
  }

  /**
   * Extract suggested actions from Claude response
   */
  private extractSuggestedActions(content: string): string[] {
    // Simple extraction - look for common patterns
    const defaultActions = ['📝 Kreiraj oglas', '❓ Imam pitanje', '📞 Kontakt'];

    if (content.includes('registr')) {
      return ['🚀 Registruj se', '📝 Kreiraj oglas', '❓ Više informacija'];
    }
    if (content.includes('oglas')) {
      return ['📝 Kreiraj oglas', '📋 Šta mi treba?', '💰 Cene'];
    }

    return defaultActions;
  }

  /**
   * Get fallback response when Claude is not available
   */
  private getFallbackResponse(message: string): ChatbotResponse {
    // Check for common intents
    if (/zdravo|cao|hej|bok|pozdrav/i.test(message)) {
      return {
        message: claudeService.getInitialGreeting(),
        suggestedActions: ['Trebaju mi radnici', 'Kako funkcioniše?', 'Koje su cene?'],
      };
    }

    if (/cen|kosta|plac/i.test(message)) {
      return {
        message: `E pa ovako stoje stvari:

**BESPLATNO:**
- Oglas na platformi
- Biznis profil firme
- Osnovna konsultacija

**PLAĆENE USLUGE:**
- Kompletna dokumentacija za strane radnike
- Praćenje procedure od A do Ž
- Sve dozvole i papiri

Najbolje da postaviš oglas pa ti pošaljemo konkretnu ponudu za tvoju situaciju!`,
        suggestedActions: ['Postavi besplatan oglas', 'Kontaktiraj podršku'],
      };
    }

    if (/pomoc|pomozi|kako/i.test(message)) {
      return {
        message: `Mogu da ti pomognem sa:

- Pronalaženjem radnika (domaćih ili iz inostranstva)
- Postavljanjem besplatnog oglasa
- Objašnjenjem procedure za strane radnike
- Dokumentacijom i dozvolama

Šta te konkretno zanima?`,
        suggestedActions: ['Trebaju mi radnici', 'Strani radnici - kako?', 'Dokumentacija'],
      };
    }

    // Default response
    return {
      message: `Hvala na poruci!

Ja sam tu da ti pomognem da nađeš radnike - bilo domaće ili iz inostranstva (Indija, Nepal, Egipat).

Hajde da postavimo oglas? Besplatno je i traje 2 minuta!`,
      suggestedActions: ['Da, hajde!', 'Imam pitanje', 'Kontakt'],
    };
  }

  /**
   * Store message in database
   */
  private async storeMessage(userId: string, userMessage: string, botResponse: string): Promise<void> {
    if (userId.startsWith('guest_')) return;

    try {
      // Find or create conversation
      let conversation = await prisma.conversation.findFirst({
        where: {
          userId,
          type: 'AI_ASSISTANT',
          status: 'ACTIVE',
        },
        orderBy: { updatedAt: 'desc' },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            userId,
            type: 'AI_ASSISTANT',
            status: 'ACTIVE',
          },
        });
      }

      // Store user message
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          fromUserId: userId,
          fromRole: 'EMPLOYER',
          content: userMessage,
          isFromAI: false,
        },
      });

      // Store bot response
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          fromUserId: null,
          fromRole: 'AI_ASSISTANT',
          content: botResponse,
          isFromAI: true,
        },
      });

      // Update conversation
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });
    } catch (error) {
      logger.error({ error }, 'Error storing message');
    }
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(userId: string, limit: number = 50): Promise<ClaudeMessage[]> {
    try {
      const conversation = await prisma.conversation.findFirst({
        where: {
          userId,
          type: 'AI_ASSISTANT',
        },
        orderBy: { updatedAt: 'desc' },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: limit,
          },
        },
      });

      if (!conversation) return [];

      return conversation.messages.map((msg) => ({
        role: msg.isFromAI ? 'assistant' : 'user',
        content: msg.content,
      })) as ClaudeMessage[];
    } catch (error) {
      logger.error({ error }, 'Error getting conversation history');
      return [];
    }
  }

  /**
   * Get initial greeting
   */
  getInitialGreeting(): ChatbotResponse {
    return {
      message: claudeService.getInitialGreeting(),
      suggestedActions: ['📝 Kreiraj oglas', '❓ Kako funkcioniše?', '🚀 Počni odmah!'],
    };
  }

  /**
   * Escalate to human operator
   */
  async escalateToHuman(userId: string, reason?: string): Promise<void> {
    try {
      const conversation = await prisma.conversation.findFirst({
        where: {
          userId,
          type: 'AI_ASSISTANT',
          status: 'ACTIVE',
        },
      });

      if (conversation) {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            status: 'ARCHIVED',
            metadata: JSON.stringify({ escalationReason: reason, escalatedAt: new Date() }),
          },
        });

        await prisma.message.create({
          data: {
            conversationId: conversation.id,
            fromRole: 'AI_ASSISTANT',
            content: `✅ Vaš razgovor je prosleđen našem timu!

Očekujte odgovor u najkraćem mogućem roku (obično unutar 24h radnim danima).

${reason ? `📝 Razlog: ${reason}` : ''}`,
            isFromAI: true,
          },
        });
      }
    } catch (error) {
      logger.error({ error }, 'Error escalating conversation');
    }
  }

  /**
   * Get conversation summaries for admin
   */
  async getConversationSummaries(options: {
    status?: string;
    minLeadScore?: number;
    limit?: number;
    offset?: number;
  } = {}): Promise<any[]> {
    const { status, minLeadScore = 0, limit = 50, offset = 0 } = options;

    const where: any = {
      leadScore: { gte: minLeadScore },
    };

    if (status) {
      where.leadStatus = status;
    }

    const summaries = await prisma.conversationSummary.findMany({
      where,
      orderBy: [{ leadScore: 'desc' }, { lastMessageAt: 'desc' }],
      take: limit,
      skip: offset,
    });

    return summaries.map((s) => ({
      ...s,
      collectedData: s.collectedData ? JSON.parse(s.collectedData) : null,
      interests: s.interests ? JSON.parse(s.interests) : [],
      intents: s.intents ? JSON.parse(s.intents) : [],
      questionsAsked: s.questionsAsked ? JSON.parse(s.questionsAsked) : [],
    }));
  }

  /**
   * Update lead status
   */
  async updateLeadStatus(conversationId: string, status: string, notes?: string): Promise<void> {
    await prisma.conversationSummary.update({
      where: { conversationId },
      data: {
        leadStatus: status,
        salesNotes: notes,
      },
    });
  }
}

export const chatbotService = new ChatbotService();
