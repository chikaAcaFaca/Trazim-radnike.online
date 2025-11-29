import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import QRCode from 'qrcode';

// IPS QR Code Standard for Serbia
// Documentation: https://ips.nbs.rs/

interface IpsPaymentData {
  amount: number; // Amount in RSD
  paymentPurpose: string;
  referenceNumber?: string;
  payerName?: string;
}

interface IpsQrResult {
  qrCodeDataUrl: string; // Base64 data URL for display
  qrCodeText: string; // Raw QR code text
  referenceNumber: string;
  paymentId: string;
  expiresAt: Date;
}

// Company bank details - should be in env vars in production
const COMPANY_DETAILS = {
  name: process.env.IPS_RECIPIENT_NAME || 'NKNET CONSULTING DOO',
  account: process.env.IPS_RECIPIENT_ACCOUNT || 'RS35160005400100578378', // Example IBAN
  bankCode: process.env.IPS_BANK_CODE || '160', // Banca Intesa
};

class IpsService {
  /**
   * Generate unique reference number for payment
   * Format: YYYYMMDD + random 8 digits
   */
  private generateReferenceNumber(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    return `${dateStr}${random}`;
  }

  /**
   * Format amount for IPS QR code
   * Format: RSD<amount>,00
   */
  private formatAmount(amount: number): string {
    return `RSD${amount},00`;
  }

  /**
   * Generate IPS QR code string according to NBS standard
   *
   * IPS QR Code format (pipe-separated):
   * K:PR|V:01|C:1|R:<account>|N:<name>|I:<amount>|P:<purpose>|SF:<code>|S:<model>|RO:<reference>
   */
  private generateIpsQrString(data: {
    recipientAccount: string;
    recipientName: string;
    amount: string;
    paymentPurpose: string;
    paymentCode: string;
    referenceModel: string;
    referenceNumber: string;
  }): string {
    // IPS QR standard fields
    const fields = [
      'K:PR', // Identification code - PR = payment request
      'V:01', // Version
      'C:1',  // Character set - 1 = UTF-8
      `R:${data.recipientAccount}`,
      `N:${data.recipientName}`,
      `I:${data.amount}`,
      `P:${data.paymentPurpose}`,
      `SF:${data.paymentCode}`,
      `S:${data.referenceModel}`,
      `RO:${data.referenceNumber}`,
    ];

    return fields.join('|');
  }

  /**
   * Create IPS QR code for payment
   */
  async createPayment(
    userId: string,
    type: 'SUBSCRIPTION' | 'TOPUP' | 'PRIORITY' | 'URGENT' | 'CONTACT_REVEAL',
    data: IpsPaymentData
  ): Promise<IpsQrResult> {
    const referenceNumber = data.referenceNumber || this.generateReferenceNumber();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: data.amount,
        currency: 'RSD',
        type,
        description: data.paymentPurpose,
        method: 'IPS_QR',
        ipsReference: referenceNumber,
        status: 'PENDING',
        expiresAt,
      },
    });

    // Generate QR code string
    const qrString = this.generateIpsQrString({
      recipientAccount: COMPANY_DETAILS.account,
      recipientName: COMPANY_DETAILS.name,
      amount: this.formatAmount(data.amount),
      paymentPurpose: data.paymentPurpose,
      paymentCode: '289', // Standard code for services
      referenceModel: '97',
      referenceNumber,
    });

    // Create IPS payment record for tracking
    await prisma.ipsPayment.create({
      data: {
        paymentId: payment.id,
        identificationCode: 'K:PR',
        recipientName: COMPANY_DETAILS.name,
        recipientAccount: COMPANY_DETAILS.account,
        amount: this.formatAmount(data.amount),
        amountRsd: data.amount,
        referenceNumber,
        paymentPurpose: data.paymentPurpose,
        expiresAt,
      },
    });

    // Update payment with QR code data
    await prisma.payment.update({
      where: { id: payment.id },
      data: { ipsQrCode: qrString },
    });

    // Generate QR code image
    const qrCodeDataUrl = await QRCode.toDataURL(qrString, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    logger.info({ paymentId: payment.id, referenceNumber, amount: data.amount }, 'IPS QR payment created');

    return {
      qrCodeDataUrl,
      qrCodeText: qrString,
      referenceNumber,
      paymentId: payment.id,
      expiresAt,
    };
  }

  /**
   * Create subscription payment QR
   */
  async createSubscriptionPayment(
    userId: string,
    planCode: string
  ): Promise<IpsQrResult> {
    // Get plan details
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { code: planCode },
    });

    if (!plan) {
      throw new Error(`Plan ${planCode} not found`);
    }

    return this.createPayment(userId, 'SUBSCRIPTION', {
      amount: plan.priceMonthly,
      paymentPurpose: `Pretplata ${plan.name} - Trazim-Radnike.online`,
    });
  }

  /**
   * Create top-up payment QR
   */
  async createTopupPayment(
    userId: string,
    amount: number,
    credits: number
  ): Promise<IpsQrResult> {
    return this.createPayment(userId, 'TOPUP', {
      amount,
      paymentPurpose: `Top-up ${credits} kredita - Trazim-Radnike.online`,
    });
  }

  /**
   * Create contact reveal payment QR
   */
  async createContactRevealPayment(
    userId: string,
    matchId: string
  ): Promise<IpsQrResult> {
    const payment = await this.createPayment(userId, 'CONTACT_REVEAL', {
      amount: 30, // 30 RSD per contact
      paymentPurpose: `Otkrivanje kontakta - Trazim-Radnike.online`,
    });

    // Link payment to match
    await prisma.payment.update({
      where: { id: payment.paymentId },
      data: { matchId },
    });

    return payment;
  }

  /**
   * Create priority listing payment QR
   */
  async createPriorityPayment(
    userId: string,
    serviceRequestId: string
  ): Promise<IpsQrResult> {
    const payment = await this.createPayment(userId, 'PRIORITY', {
      amount: 150, // 150 RSD for priority
      paymentPurpose: `Prioritetni oglas - Trazim-Radnike.online`,
    });

    // Link payment to service request
    await prisma.payment.update({
      where: { id: payment.paymentId },
      data: { serviceRequestId },
    });

    return payment;
  }

  /**
   * Create urgent listing payment QR
   */
  async createUrgentPayment(
    userId: string,
    serviceRequestId: string
  ): Promise<IpsQrResult> {
    const payment = await this.createPayment(userId, 'URGENT', {
      amount: 300, // 300 RSD for urgent
      paymentPurpose: `Hitan oglas - Trazim-Radnike.online`,
    });

    // Link payment to service request
    await prisma.payment.update({
      where: { id: payment.paymentId },
      data: { serviceRequestId },
    });

    return payment;
  }

  /**
   * Verify payment by reference number (manual check by admin)
   * In production, this would be automated via bank API
   */
  async verifyPayment(
    referenceNumber: string,
    adminId: string
  ): Promise<{ success: boolean; payment?: any }> {
    const ipsPayment = await prisma.ipsPayment.findFirst({
      where: { referenceNumber },
    });

    if (!ipsPayment) {
      return { success: false };
    }

    // Update IPS payment status
    await prisma.ipsPayment.update({
      where: { id: ipsPayment.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });

    // Update main payment record
    const payment = await prisma.payment.update({
      where: { id: ipsPayment.paymentId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        verifiedAt: new Date(),
        verifiedBy: adminId,
      },
    });

    // Process payment based on type
    await this.processCompletedPayment(payment);

    logger.info({ paymentId: payment.id, referenceNumber, adminId }, 'Payment verified');

    return { success: true, payment };
  }

  /**
   * Process completed payment - activate subscription, add credits, etc.
   */
  private async processCompletedPayment(payment: any): Promise<void> {
    switch (payment.type) {
      case 'SUBSCRIPTION':
        await this.activateSubscription(payment);
        break;
      case 'TOPUP':
        await this.addCredits(payment);
        break;
      case 'CONTACT_REVEAL':
        await this.revealContact(payment);
        break;
      case 'PRIORITY':
        await this.activatePriority(payment);
        break;
      case 'URGENT':
        await this.activateUrgent(payment);
        break;
    }
  }

  /**
   * Activate subscription after payment
   */
  private async activateSubscription(payment: any): Promise<void> {
    // Get plan details from payment description
    const planMatch = payment.description?.match(/Pretplata (\w+)/);
    if (!planMatch) return;

    const planName = planMatch[1];
    const plan = await prisma.subscriptionPlan.findFirst({
      where: { name: { contains: planName } },
    });

    if (!plan) return;

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

    await prisma.subscription.create({
      data: {
        userId: payment.userId,
        planType: plan.code,
        planName: plan.name,
        price: plan.priceMonthly,
        creditsTotal: plan.creditsPerMonth,
        creditsRemaining: plan.creditsPerMonth,
        endDate,
        lastPaymentId: payment.id,
      },
    });

    logger.info({ userId: payment.userId, planCode: plan.code }, 'Subscription activated');
  }

  /**
   * Add credits after top-up payment
   */
  private async addCredits(payment: any): Promise<void> {
    // Calculate credits based on amount (200 RSD = 10 credits)
    const credits = Math.floor(payment.amount / 20);

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: payment.userId,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (subscription) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          creditsTotal: { increment: credits },
          creditsRemaining: { increment: credits },
        },
      });

      logger.info({ userId: payment.userId, credits }, 'Credits added');
    }
  }

  /**
   * Reveal contact after payment
   */
  private async revealContact(payment: any): Promise<void> {
    if (!payment.matchId) return;

    // Check if it's a WorkerMatch or ServiceMatch
    const workerMatch = await prisma.workerMatch.findUnique({
      where: { id: payment.matchId },
    });

    if (workerMatch) {
      await prisma.workerMatch.update({
        where: { id: payment.matchId },
        data: {
          isPaid: true,
          paidAmount: payment.amount,
          paidAt: new Date(),
          contactRevealed: true,
          contactRevealedAt: new Date(),
        },
      });
    } else {
      // Try ServiceMatch
      await prisma.serviceMatch.update({
        where: { id: payment.matchId },
        data: {
          contactPaid: true,
          contactPaidAmount: payment.amount,
          contactPaidAt: new Date(),
          contactRevealed: true,
          contactRevealedAt: new Date(),
        },
      });
    }

    logger.info({ matchId: payment.matchId }, 'Contact revealed');
  }

  /**
   * Activate priority listing
   */
  private async activatePriority(payment: any): Promise<void> {
    if (!payment.serviceRequestId) return;

    await prisma.serviceRequest.update({
      where: { id: payment.serviceRequestId },
      data: { isPriority: true },
    });

    logger.info({ serviceRequestId: payment.serviceRequestId }, 'Priority activated');
  }

  /**
   * Activate urgent listing
   */
  private async activateUrgent(payment: any): Promise<void> {
    if (!payment.serviceRequestId) return;

    await prisma.serviceRequest.update({
      where: { id: payment.serviceRequestId },
      data: {
        isPriority: true,
        isUrgent: true,
        urgency: 'URGENT',
      },
    });

    logger.info({ serviceRequestId: payment.serviceRequestId }, 'Urgent activated');
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId: string): Promise<any> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    return payment;
  }

  /**
   * Get pending payments for user
   */
  async getPendingPayments(userId: string): Promise<any[]> {
    return prisma.payment.findMany({
      where: {
        userId,
        status: 'PENDING',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Clean up expired payments
   */
  async cleanupExpiredPayments(): Promise<number> {
    const result = await prisma.payment.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'EXPIRED' },
    });

    await prisma.ipsPayment.updateMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: new Date() },
      },
      data: { status: 'EXPIRED' },
    });

    if (result.count > 0) {
      logger.info({ count: result.count }, 'Expired payments cleaned up');
    }

    return result.count;
  }
}

export const ipsService = new IpsService();

// Run cleanup every hour
setInterval(() => {
  ipsService.cleanupExpiredPayments().catch((err) => {
    logger.error({ error: err }, 'Error cleaning up expired payments');
  });
}, 60 * 60 * 1000);
