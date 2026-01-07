import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { bookingConfirmation, bookingStatusUpdate, passwordResetOTP, registrationOTP } from "../templates/emails";
import logger from "../utils/logger.js";

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: Number(env.SMTP_PORT) || 587,
        secure: Number(env.SMTP_PORT) === 465,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
        ...(env.SMTP_SERVICE && { service: env.SMTP_SERVICE }),
      });
    } else {
      logger.warn("SMTP not configured – emails will be skipped");
    }
  }

  private async send(options: { to: string; subject: string; html: string }) {
    if (!this.transporter) {
      logger.warn(`Email skipped (no transporter): ${options.subject}`);
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"Professionals BD" <${env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      logger.info(`Email sent: ${info.messageId} → ${options.to}`);
      return true;
    } catch (error) {
      logger.error({ error, to: options.to }, "Failed to send email");
      return false;
    }
  }

  // Auth emails
  async sendRegistrationOTP(email: string, name: string, otp: string) {
    const html = registrationOTP(name, otp);
    return this.send({
      to: email,
      subject: "Verify Your Email - Professionals BD",
      html,
    });
  }

  async sendPasswordResetOTP(email: string, name: string, otp: string) {
    const html = passwordResetOTP(name, otp);
    return this.send({
      to: email,
      subject: "Reset Your Password - Professionals BD",
      html,
    });
  }

  // Booking emails
  async sendBookingConfirmation(
    userEmail: string,
    userName: string,
    professionalName: string,
    bookingId: string,
    startDate: string,
    endDate: string,
    totalPrice: number,
    status: string
  ): Promise<boolean> {
    const html = bookingConfirmation(
      userName,
      professionalName,
      bookingId,
      startDate,
      endDate,
      totalPrice,
      status
    );

    return this.send({
      to: userEmail,
      subject: "Booking Confirmed - Professionals BD",
      html,
    });
  }

  async sendBookingStatusUpdate(
    userEmail: string,
    userName: string,
    professionalName: string,
    bookingId: string,
    status: string,
    message?: string
  ): Promise<boolean> {
    const html = bookingStatusUpdate(
      userName,
      professionalName,
      bookingId,
      status,
      message
    );

    return this.send({
      to: userEmail,
      subject: `Booking ${status} - Professionals BD`,
      html,
    });
  }
}

export const emailService = new EmailService();