import * as nodemailer from 'nodemailer';
import { Logger } from '@nestjs/common';

const logger = new Logger('MailerService');

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER || 'vignanvgnt2025@gmail.com',
        pass: process.env.SMTP_PASS || 'rblz gemr caza afba', // Their App Password
      },
    });

    const info = await transporter.sendMail({
      from: `"V-Connect Admin" <${process.env.SMTP_USER || 'vignanvgnt2025@gmail.com'}>`,
      to,
      subject,
      html,
    });

    logger.log(`Email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send email to ${to}`, error);
    // Silent fail so we don't break the flow
    return false;
  }
};
