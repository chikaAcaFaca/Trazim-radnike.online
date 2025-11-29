import { Resend } from 'resend';
import { env, isDev } from '../config/env.js';
import { logger } from '../utils/logger.js';

// Initialize Resend client (only if API key is provided)
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

// Base URL for links in emails
const BASE_URL = isDev ? 'http://localhost:3000' : 'https://trazim-radnike.online';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  /**
   * Send an email using Resend
   */
  async send(options: EmailOptions): Promise<boolean> {
    const { to, subject, html, text } = options;

    // In development without API key, just log
    if (!resend) {
      logger.info(
        { to, subject, preview: html.substring(0, 200) },
        'Email would be sent (no RESEND_API_KEY configured)'
      );
      return true;
    }

    try {
      const result = await resend.emails.send({
        from: env.EMAIL_FROM,
        to,
        subject,
        html,
        text: text || this.htmlToText(html),
      });

      logger.info({ to, subject, id: result.data?.id }, 'Email sent successfully');
      return true;
    } catch (error) {
      logger.error({ error, to, subject }, 'Failed to send email');
      return false;
    }
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    const verifyUrl = `${BASE_URL}/verifikacija-email?token=${token}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifikacija email adrese</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Tražim-Radnike.online</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Diskretna regrutacija radnika</p>
  </div>

  <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
    <h2 style="color: #1e40af; margin-top: 0;">Potvrdite vašu email adresu</h2>

    <p>Dobrodošli na Tražim-Radnike.online!</p>

    <p>Da biste završili registraciju i počeli da koristite našu platformu, molimo vas da potvrdite vašu email adresu klikom na dugme ispod:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${verifyUrl}" style="background: #1e40af; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
        Potvrdi Email Adresu
      </a>
    </div>

    <p style="color: #64748b; font-size: 14px;">Ako dugme ne radi, kopirajte ovaj link u vaš browser:</p>
    <p style="background: #e2e8f0; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">
      ${verifyUrl}
    </p>

    <p style="color: #64748b; font-size: 14px; margin-top: 20px;">
      Ovaj link važi 24 sata. Ako niste vi kreirali nalog, možete ignorisati ovaj email.
    </p>
  </div>

  <div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} Tražim-Radnike.online. Sva prava zadržana.</p>
    <p>Ovo je automatski generisan email. Molimo ne odgovarajte na njega.</p>
  </div>
</body>
</html>
    `;

    return this.send({
      to: email,
      subject: 'Potvrdite vašu email adresu - Tražim-Radnike.online',
      html,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    const resetUrl = `${BASE_URL}/reset-lozinke?token=${token}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resetovanje lozinke</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Tražim-Radnike.online</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Diskretna regrutacija radnika</p>
  </div>

  <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
    <h2 style="color: #1e40af; margin-top: 0;">Resetovanje lozinke</h2>

    <p>Primili smo zahtev za resetovanje lozinke za vaš nalog.</p>

    <p>Kliknite na dugme ispod da biste kreirali novu lozinku:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="background: #dc2626; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
        Resetuj Lozinku
      </a>
    </div>

    <p style="color: #64748b; font-size: 14px;">Ako dugme ne radi, kopirajte ovaj link u vaš browser:</p>
    <p style="background: #e2e8f0; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">
      ${resetUrl}
    </p>

    <div style="background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 8px; margin-top: 20px;">
      <p style="color: #92400e; margin: 0; font-size: 14px;">
        <strong>⚠️ Važno:</strong> Ovaj link važi samo 1 sat. Ako niste vi zatražili resetovanje lozinke, možete ignorisati ovaj email - vaša lozinka neće biti promenjena.
      </p>
    </div>
  </div>

  <div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} Tražim-Radnike.online. Sva prava zadržana.</p>
    <p>Ovo je automatski generisan email. Molimo ne odgovarajte na njega.</p>
  </div>
</body>
</html>
    `;

    return this.send({
      to: email,
      subject: 'Resetovanje lozinke - Tražim-Radnike.online',
      html,
    });
  }

  /**
   * Send welcome email after verification
   */
  async sendWelcomeEmail(email: string, companyName?: string): Promise<boolean> {
    const dashboardUrl = `${BASE_URL}/kontrolna-tabla`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dobrodošli</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🎉 Dobrodošli!</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Tražim-Radnike.online</p>
  </div>

  <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
    <h2 style="color: #1e40af; margin-top: 0;">Vaš nalog je aktiviran${companyName ? `, ${companyName}` : ''}!</h2>

    <p>Hvala vam što ste se registrovali na Tražim-Radnike.online - diskretnu platformu za regrutaciju radnika.</p>

    <h3 style="color: #1e40af;">Šta možete dalje?</h3>

    <ul style="padding-left: 20px;">
      <li><strong>Kreirajte profil kompanije</strong> - Dodajte podatke o vašoj firmi</li>
      <li><strong>Postavite prvi oglas</strong> - Naš AI asistent će vas voditi kroz proces</li>
      <li><strong>Kontaktirajte nas</strong> - Tu smo da vam pomognemo sa dokumentacijom</li>
    </ul>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${dashboardUrl}" style="background: #1e40af; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
        Pristupite Kontrolnoj Tabli
      </a>
    </div>

    <div style="background: #dbeafe; border: 1px solid #3b82f6; padding: 15px; border-radius: 8px; margin-top: 20px;">
      <p style="color: #1e40af; margin: 0; font-size: 14px;">
        <strong>💡 Savez:</strong> Koristite našeg AI asistenta za brzo kreiranje oglasa. On će vam pomoći da prikupite sve potrebne informacije.
      </p>
    </div>
  </div>

  <div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} Tražim-Radnike.online. Sva prava zadržana.</p>
  </div>
</body>
</html>
    `;

    return this.send({
      to: email,
      subject: 'Dobrodošli na Tražim-Radnike.online! 🎉',
      html,
    });
  }

  /**
   * Send new message notification
   */
  async sendNewMessageNotification(
    email: string,
    senderName: string,
    messagePreview: string,
    conversationUrl: string
  ): Promise<boolean> {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nova poruka</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">📬 Nova Poruka</h1>
  </div>

  <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
    <p>Imate novu poruku od <strong>${senderName}</strong>:</p>

    <div style="background: white; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; font-style: italic;">
      "${messagePreview.length > 200 ? messagePreview.substring(0, 200) + '...' : messagePreview}"
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${conversationUrl}" style="background: #1e40af; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
        Pogledaj Poruku
      </a>
    </div>
  </div>

  <div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px;">
    <p>&copy; ${new Date().getFullYear()} Tražim-Radnike.online</p>
  </div>
</body>
</html>
    `;

    return this.send({
      to: email,
      subject: `Nova poruka od ${senderName} - Tražim-Radnike.online`,
      html,
    });
  }

  /**
   * Send lead notification to office when chatbot collects all data
   * This is a key sales notification for NKNet-Consulting
   */
  async sendLeadNotification(leadData: {
    positions: string;
    salary: string;
    location: string;
    workHours: string;
    housing: string;
    experience: string;
    languages: string;
    foreignWorkers: string;
    contactEmail: string;
    contactPhone?: string;
    companyName?: string;
    sessionId?: string;
  }): Promise<boolean> {
    const officeEmail = 'office@nknet-consulting.com';

    // Determine lead quality based on foreign worker interest
    const isHotLead = /da|yes|zainteresovan|hteli|hoce/i.test(leadData.foreignWorkers || '');
    const leadLabel = isHotLead ? '🔥 VRUĆI LEAD' : '📋 NOVI LEAD';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${leadLabel} - Tražim-Radnike.online</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: ${isHotLead ? 'linear-gradient(135deg, #dc2626 0%, #f97316 100%)' : 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)'}; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">${leadLabel}</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Novi zahtev sa Tražim-Radnike.online</p>
  </div>

  <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
    <h2 style="color: #1e40af; margin-top: 0;">📊 Detalji zahteva</h2>

    <table style="width: 100%; border-collapse: collapse;">
      <tr style="background: #e2e8f0;">
        <td style="padding: 12px; font-weight: bold; width: 40%;">Pozicije:</td>
        <td style="padding: 12px;">${leadData.positions}</td>
      </tr>
      <tr>
        <td style="padding: 12px; font-weight: bold;">Plata:</td>
        <td style="padding: 12px;">${leadData.salary}</td>
      </tr>
      <tr style="background: #e2e8f0;">
        <td style="padding: 12px; font-weight: bold;">Lokacija:</td>
        <td style="padding: 12px;">${leadData.location}</td>
      </tr>
      <tr>
        <td style="padding: 12px; font-weight: bold;">Radno vreme:</td>
        <td style="padding: 12px;">${leadData.workHours}</td>
      </tr>
      <tr style="background: #e2e8f0;">
        <td style="padding: 12px; font-weight: bold;">Smeštaj:</td>
        <td style="padding: 12px;">${leadData.housing}</td>
      </tr>
      <tr>
        <td style="padding: 12px; font-weight: bold;">Iskustvo:</td>
        <td style="padding: 12px;">${leadData.experience}</td>
      </tr>
      <tr style="background: #e2e8f0;">
        <td style="padding: 12px; font-weight: bold;">Jezici:</td>
        <td style="padding: 12px;">${leadData.languages}</td>
      </tr>
      <tr style="${isHotLead ? 'background: #fef3c7; border: 2px solid #f59e0b;' : 'background: #e2e8f0;'}">
        <td style="padding: 12px; font-weight: bold;">🌍 Strani radnici:</td>
        <td style="padding: 12px; font-weight: ${isHotLead ? 'bold' : 'normal'};">${leadData.foreignWorkers}</td>
      </tr>
    </table>

    <h2 style="color: #1e40af; margin-top: 30px;">📞 Kontakt podaci</h2>

    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px;">
      <p style="margin: 5px 0;"><strong>📧 Email:</strong> <a href="mailto:${leadData.contactEmail}">${leadData.contactEmail}</a></p>
      ${leadData.contactPhone ? `<p style="margin: 5px 0;"><strong>📱 Telefon:</strong> ${leadData.contactPhone}</p>` : ''}
      ${leadData.companyName ? `<p style="margin: 5px 0;"><strong>🏢 Firma:</strong> ${leadData.companyName}</p>` : ''}
    </div>

    ${isHotLead ? `
    <div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 15px; border-radius: 8px; margin-top: 20px;">
      <p style="color: #92400e; margin: 0; font-size: 14px;">
        <strong>🔥 PRIORITET:</strong> Klijent je zainteresovan za strane radnike! Kontaktirajte ga što pre.
      </p>
    </div>
    ` : ''}

    <div style="text-align: center; margin-top: 30px;">
      <a href="mailto:${leadData.contactEmail}?subject=Ponuda%20-%20NKNet%20Consulting&body=Poštovani,%0A%0AHvala%20vam%20što%20ste%20nas%20kontaktirali%20putem%20Tražim-Radnike.online.%0A%0AU%20prilogu%20vam%20šaljemo%20našu%20ponudu...%0A%0ASrdačan%20pozdrav,%0ANKNet%20Consulting%20tim"
         style="background: #1e40af; color: white; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
        📧 Odgovori klijentu
      </a>
    </div>
  </div>

  <div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px;">
    <p>Automatski generisano sa Tražim-Radnike.online</p>
    <p>Datum: ${new Date().toLocaleString('sr-RS', { timeZone: 'Europe/Belgrade' })}</p>
    ${leadData.sessionId ? `<p style="font-size: 10px;">Session ID: ${leadData.sessionId}</p>` : ''}
  </div>
</body>
</html>
    `;

    return this.send({
      to: officeEmail,
      subject: `${leadLabel} - ${leadData.positions} - ${leadData.location}`,
      html,
    });
  }

  /**
   * Simple HTML to text converter
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

export const emailService = new EmailService();
