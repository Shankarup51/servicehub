
import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  private readonly transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST ?? 'smtp.gmail.com',
    port: Number(process.env.MAIL_PORT ?? 587),
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  async verifyConnection(): Promise<void> {
    await this.transporter.verify();
    this.logger.log('Email SMTP connection verified successfully');
  }

  async sendVerificationEmail(
    email: string,
    firstName: string,
    token: string,
  ): Promise<void> {
    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl || !process.env.MAIL_USER || !process.env.MAIL_PASS) {
      throw new Error('Email configuration is incomplete');
    }

    const verificationUrl = new URL('/verify-email', frontendUrl);
    verificationUrl.searchParams.set('token', token);

    await this.transporter.sendMail({
      from:
        process.env.MAIL_FROM ??
        `ServiceHub <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Verify your ServiceHub email',
      text: [
        `Hi ${firstName},`,
        '',
        'Please verify your email address using the link below:',
        verificationUrl.toString(),
        '',
        'This link expires in 24 hours.',
        'If you did not create a ServiceHub account, you can ignore this email.',
      ].join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1A1D20">
          <h2>Welcome to ServiceHub, ${this.escapeHtml(firstName)}!</h2>
          <p>Please verify your email address to activate your account.</p>
          <p>
            <a href="${this.escapeHtml(verificationUrl.toString())}"
               style="display:inline-block;background:#9C1E32;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px">
              Verify Email
            </a>
          </p>
          <p>This link expires in 24 hours.</p>
          <p>If you did not create a ServiceHub account, you can ignore this email.</p>
        </div>
      `,
    });

    this.logger.log(`Verification email sent to ${email}`);
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (character) => {
      const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      };

      return entities[character];
    });
  }
}
