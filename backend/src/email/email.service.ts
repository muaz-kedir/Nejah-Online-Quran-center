import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private fromAddress: string;

  constructor(private configService: ConfigService) {
    const host = this.configService.get('SMTP_HOST');
    const port = this.configService.get('SMTP_PORT');
    const user = this.configService.get('SMTP_USER');
    const pass = this.configService.get('SMTP_PASS');
    this.fromAddress =
      this.configService.get('SMTP_FROM') ||
      '"Nejah Online Quran Center" <noreply@nejah-center.com>';

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(port, 10) || 587,
        secure: parseInt(port, 10) === 465,
        auth: { user, pass },
      });
      this.logger.log('SMTP transporter configured');
    } else {
      this.logger.warn('SMTP not configured – emails will be logged to console only');
    }
  }

  private async send(to: string, subject: string, html: string) {
    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.fromAddress,
          to,
          subject,
          html,
        });
        this.logger.log(`Email sent to ${to}: ${subject}`);
      } catch (err) {
        this.logger.error(`Failed to send email to ${to}: ${err.message}`);
      }
    } else {
      this.logger.log(`[EMAIL LOG] To: ${to} | Subject: ${subject}\n${html}`);
    }
  }

  // ── Template helpers ──────────────────────────────────────────────

  private wrap(body: string): string {
    return `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        <div style="background: linear-gradient(135deg, #065f46, #047857); padding: 32px 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">Nejah Online Quran &amp; Islamic Center</h1>
          <p style="color: #a7f3d0; margin: 8px 0 0; font-size: 13px; letter-spacing: 1px; text-transform: uppercase;">Teacher Application Portal</p>
        </div>
        <div style="padding: 32px 24px;">
          ${body}
        </div>
        <div style="background: #f8faf9; padding: 20px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Nejah Online Quran &amp; Islamic Center. All rights reserved.</p>
        </div>
      </div>
    `;
  }

  // ── Application lifecycle emails ──────────────────────────────────

  async sendApplicationReceived(to: string, applicantName: string, applicationNumber: string) {
    const html = this.wrap(`
      <h2 style="color: #065f46; margin: 0 0 16px;">Application Received</h2>
      <p style="color: #374151; line-height: 1.6;">Assalamu Alaikum <strong>${applicantName}</strong>,</p>
      <p style="color: #374151; line-height: 1.6;">Thank you for applying to teach at Nejah Online Quran &amp; Islamic Center. Your application has been received and is now under review.</p>
      <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="color: #065f46; margin: 0; font-size: 14px;"><strong>Application Number:</strong> ${applicationNumber}</p>
        <p style="color: #047857; margin: 8px 0 0; font-size: 13px;">Please save this number for tracking your application status.</p>
      </div>
      <p style="color: #374151; line-height: 1.6;">Our team will review your application and contact you after the review process. This usually takes 3–5 business days.</p>
      <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">JazakAllahu Khairan,<br>Nejah Admissions Team</p>
    `);
    await this.send(to, 'Application Received – Nejah Center', html);
  }

  async sendApplicationApproved(
    to: string,
    applicantName: string,
    loginEmail: string,
    temporaryPassword: string,
  ) {
    const html = this.wrap(`
      <h2 style="color: #065f46; margin: 0 0 16px;">🎉 Application Approved!</h2>
      <p style="color: #374151; line-height: 1.6;">Assalamu Alaikum <strong>${applicantName}</strong>,</p>
      <p style="color: #374151; line-height: 1.6;">Alhamdulillah! We are pleased to inform you that your application to teach at Nejah Online Quran &amp; Islamic Center has been <strong style="color: #059669;">approved</strong>.</p>
      <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="color: #065f46; margin: 0 0 8px; font-size: 14px;"><strong>Your Login Credentials:</strong></p>
        <p style="color: #047857; margin: 4px 0; font-size: 14px;">📧 Email: <strong>${loginEmail}</strong></p>
        <p style="color: #047857; margin: 4px 0; font-size: 14px;">🔑 Temporary Password: <strong>${temporaryPassword}</strong></p>
      </div>
      <p style="color: #dc2626; font-size: 13px;"><strong>Important:</strong> Please change your password after your first login.</p>
      <p style="color: #374151; line-height: 1.6;">Welcome to the Nejah family! We look forward to working with you.</p>
      <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">JazakAllahu Khairan,<br>Nejah Admissions Team</p>
    `);
    await this.send(to, '🎉 Application Approved – Welcome to Nejah!', html);
  }

  async sendApplicationRejected(to: string, applicantName: string, reason: string) {
    const html = this.wrap(`
      <h2 style="color: #065f46; margin: 0 0 16px;">Application Update</h2>
      <p style="color: #374151; line-height: 1.6;">Assalamu Alaikum <strong>${applicantName}</strong>,</p>
      <p style="color: #374151; line-height: 1.6;">Thank you for your interest in teaching at Nejah Online Quran &amp; Islamic Center. After careful review, we regret to inform you that your application has not been approved at this time.</p>
      ${
        reason
          ? `
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="color: #991b1b; margin: 0; font-size: 14px;"><strong>Reason:</strong></p>
        <p style="color: #7f1d1d; margin: 8px 0 0; font-size: 14px;">${reason}</p>
      </div>
      `
          : ''
      }
      <p style="color: #374151; line-height: 1.6;">You are welcome to reapply in the future. May Allah bless your efforts in seeking knowledge and teaching.</p>
      <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">JazakAllahu Khairan,<br>Nejah Admissions Team</p>
    `);
    await this.send(to, 'Application Update – Nejah Center', html);
  }

  async sendMoreInfoRequired(to: string, applicantName: string, message: string) {
    const html = this.wrap(`
      <h2 style="color: #065f46; margin: 0 0 16px;">Additional Information Required</h2>
      <p style="color: #374151; line-height: 1.6;">Assalamu Alaikum <strong>${applicantName}</strong>,</p>
      <p style="color: #374151; line-height: 1.6;">Our review team needs additional information regarding your application to teach at Nejah Online Quran &amp; Islamic Center.</p>
      <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="color: #1e40af; margin: 0; font-size: 14px;"><strong>Message from our team:</strong></p>
        <p style="color: #1e3a5f; margin: 8px 0 0; font-size: 14px;">${message}</p>
      </div>
      <p style="color: #374151; line-height: 1.6;">Please respond to this email or contact us with the requested information at your earliest convenience.</p>
      <p style="color: #6b7280; font-size: 13px; margin-top: 24px;">JazakAllahu Khairan,<br>Nejah Admissions Team</p>
    `);
    await this.send(to, 'Additional Information Required – Nejah Center', html);
  }
}
