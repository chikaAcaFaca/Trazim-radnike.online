import { env, isDev } from '../config/env.js';
import { logger } from '../utils/logger.js';

interface TwilioMessageResponse {
  sid: string;
  status: string;
  to: string;
  body: string;
}

class SmsService {
  private accountSid: string | undefined;
  private authToken: string | undefined;
  private phoneNumber: string | undefined;
  private isConfigured: boolean;

  constructor() {
    this.accountSid = env.TWILIO_ACCOUNT_SID;
    this.authToken = env.TWILIO_AUTH_TOKEN;
    this.phoneNumber = env.TWILIO_PHONE_NUMBER;
    this.isConfigured = !!(this.accountSid && this.authToken && this.phoneNumber);

    if (!this.isConfigured) {
      logger.warn('Twilio SMS nije konfigurisan - SMS neće biti slat');
    }
  }

  /**
   * Send SMS via Twilio
   */
  async sendSms(to: string, body: string): Promise<boolean> {
    // In development without Twilio, log the message
    if (!this.isConfigured) {
      if (isDev) {
        logger.info({ to, body }, 'DEV MODE - SMS bi bio poslat:');
        return true;
      }
      logger.error('Twilio nije konfigurisan - SMS nije poslat');
      return false;
    }

    try {
      // Format phone number (ensure it starts with +)
      const formattedTo = to.startsWith('+') ? to : `+${to}`;

      // Twilio API call using fetch
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64'),
        },
        body: new URLSearchParams({
          To: formattedTo,
          From: this.phoneNumber!,
          Body: body,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        logger.error({ error, to }, 'Twilio SMS greška');
        return false;
      }

      const result = await response.json() as TwilioMessageResponse;
      logger.info({ sid: result.sid, to: result.to, status: result.status }, 'SMS uspešno poslat');
      return true;
    } catch (error) {
      logger.error({ error, to }, 'Greška pri slanju SMS-a');
      return false;
    }
  }

  /**
   * Send verification code SMS
   */
  async sendVerificationCode(to: string, code: string): Promise<boolean> {
    const message = `Vaš verifikacioni kod za Tražim-Radnike.online je: ${code}\n\nKod važi 10 minuta.`;
    return this.sendSms(to, message);
  }

  /**
   * Send welcome SMS after registration
   */
  async sendWelcomeSms(to: string, name?: string): Promise<boolean> {
    const greeting = name ? `Zdravo ${name}!` : 'Zdravo!';
    const message = `${greeting}\n\nDobrodošli na Tražim-Radnike.online - platformu za diskretno zapošljavanje.\n\nVaš tim`;
    return this.sendSms(to, message);
  }

  /**
   * Send notification about new message
   */
  async sendNewMessageNotification(to: string, senderName: string): Promise<boolean> {
    const message = `Nova poruka od ${senderName} na Tražim-Radnike.online.\n\nPrijavite se da vidite poruku.`;
    return this.sendSms(to, message);
  }

  /**
   * Send notification about new job match
   */
  async sendMatchNotification(to: string, jobTitle: string): Promise<boolean> {
    const message = `Imate novi match za poziciju "${jobTitle}" na Tražim-Radnike.online!\n\nPrijavite se da vidite detalje.`;
    return this.sendSms(to, message);
  }

  /**
   * Send password reset code via SMS
   */
  async sendPasswordResetCode(to: string, code: string): Promise<boolean> {
    const message = `Vaš kod za reset lozinke na Tražim-Radnike.online je: ${code}\n\nKod važi 1 sat.`;
    return this.sendSms(to, message);
  }

  /**
   * Check if SMS service is configured
   */
  isServiceConfigured(): boolean {
    return this.isConfigured;
  }
}

export const smsService = new SmsService();
