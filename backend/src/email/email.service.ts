import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private fromEmail: string;

  constructor(private config: ConfigService) {
    this.fromEmail = this.config.get('SMTP_USER', 'vignanvgnt2025@gmail.com');

    const smtpUser = this.config.get('SMTP_USER');
    const smtpPass = this.config.get('SMTP_PASS');

    if (smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      console.log('📧 Direct email service initialized (Gmail SMTP)');
    } else {
      console.log('📧 Direct email service disabled (no SMTP_USER/SMTP_PASS)');
    }
  }

  async sendWelcomeEmail(data: {
    name: string;
    email: string;
    password: string;
    role: string;
    rollNo?: string;
    empId?: string;
    department?: string;
  }): Promise<boolean> {
    if (!this.transporter) {
      console.log('⚠️  Email skipped (no SMTP configured)');
      return false;
    }

    const roleLabel = data.role === 'student' ? 'Student' : 'Faculty';

    const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to V-Connect!</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0;">Vignan Institute of Technology & Science</p>
        </div>
        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #334155;">Hello <strong>${data.name}</strong>,</p>
          <p style="color: #475569;">Your ${roleLabel} account has been created successfully on the V-Connect portal. Here are your login credentials:</p>
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #64748b; width: 120px;">Email</td><td style="padding: 8px 0; font-weight: 600; color: #1e293b;">${data.email}</td></tr>
              <tr><td style="padding: 8px 0; color: #64748b;">Password</td><td style="padding: 8px 0; font-weight: 600; color: #1e293b;">${data.password}</td></tr>
              ${data.rollNo ? `<tr><td style="padding: 8px 0; color: #64748b;">Roll No</td><td style="padding: 8px 0; font-weight: 600; color: #1e293b;">${data.rollNo}</td></tr>` : ''}
              ${data.empId ? `<tr><td style="padding: 8px 0; color: #64748b;">Employee ID</td><td style="padding: 8px 0; font-weight: 600; color: #1e293b;">${data.empId}</td></tr>` : ''}
              ${data.department ? `<tr><td style="padding: 8px 0; color: #64748b;">Department</td><td style="padding: 8px 0; font-weight: 600; color: #1e293b;">${data.department}</td></tr>` : ''}
            </table>
          </div>
          <p style="color: #475569;">Please login and change your password immediately for security.</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="https://vignan-connect.vercel.app/login" style="display: inline-block; background: linear-gradient(135deg, #2563eb, #7c3aed); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Login to V-Connect</a>
          </div>
        </div>
        <div style="background: #f1f5f9; padding: 16px; text-align: center; color: #94a3b8; font-size: 12px;">
          © 2026 VGNT Deshmukhi. All rights reserved. | Powered by V-Connect
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: `"V-Connect VGNT" <${this.fromEmail}>`,
        to: data.email,
        subject: `Welcome to V-Connect - Your ${roleLabel} Account`,
        html,
      });
      console.log(`✅ Welcome email sent to ${data.email}`);
      return true;
    } catch (error) {
      console.error(`❌ Email failed for ${data.email}:`, error);
      return false;
    }
  }
}
