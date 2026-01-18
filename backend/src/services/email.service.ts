import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import {
  accountStatusUpdate,
  bookingConfirmation,
  bookingStatusUpdate,
  disputeNotificationUser,
  disputeRaisedAdmin,
  disputeResolved,
  disputeResolvedProfessional,
  invoiceEmail,
  passwordResetOTP,
  professionalApplicationReceived,
  professionalStatusUpdate,
  registrationOTP,
  withdrawStatusUpdate
} from "../templates/emails/index.js";
import logger from "../utils/logger.js";

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    // Sanitize credentials (remove quotes and spaces from app password)
    const smtpUser = env.SMTP_USER?.replace(/['"]/g, '').trim();
    const smtpPass = env.SMTP_PASS?.replace(/['"\s]/g, '').trim();

    logger.info(`Initializing Email Service with Host: ${env.SMTP_HOST}, Port: ${env.SMTP_PORT}, User: ${smtpUser ? 'SET' : 'NOT SET'}`);

    if (env.SMTP_HOST && smtpUser && smtpPass) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: Number(env.SMTP_PORT) || 587,
        secure: Number(env.SMTP_PORT) === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        ...(env.SMTP_SERVICE && { service: env.SMTP_SERVICE }),
        debug: true, // Show detailed debug info
        logger: true // Log information to console
      });

      // Verify connection configuration
      this.transporter.verify((error, success) => {
        if (error) {
          logger.error({ error }, "❌ SMTP Connection Verification Failed");
        } else {
          logger.info("✅ SMTP Server Connection Verified Successfully");
        }
      });

    } else {
      logger.warn(`SMTP not configured correctly. Host: ${!!env.SMTP_HOST}, User: ${!!smtpUser}, Pass: ${!!smtpPass}`);
    }
  }

  private async send(options: { to: string; subject: string; html: string }) {
    if (!this.transporter) {
      logger.warn(`Email skipped (no transporter): ${options.subject}`);
      return false;
    }

    const smtpUser = env.SMTP_USER?.replace(/['"]/g, '').trim();

    try {
      const mailOptions = {
        from: `"Professionals BD" <${smtpUser}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      };

      logger.info(`Attempting to send email. From: ${mailOptions.from}, To: ${mailOptions.to}, Subject: ${mailOptions.subject}`);

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully: ${info.messageId} → ${options.to}`);
      return true;
    } catch (error) {
      logger.error({ error, to: options.to, from: smtpUser }, "Failed to send email - Detailed Error");
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

  // Generic OTP email (for professional activation, etc.)
  async sendOTP(email: string, name: string, otp: string, subject: string) {
    const html = registrationOTP(name, otp); // Reuse registration template
    return this.send({
      to: email,
      subject: `${subject} - Professionals BD`,
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

  async sendInvoice(email: string, name: string, invoiceUrl: string, amount: number, bookingId: string) {
    const html = invoiceEmail(name, invoiceUrl, amount, bookingId);
    return this.send({
      to: email,
      subject: `Your Invoice - Booking #${bookingId}`,
      html,
    });
  }

  // Dispute emails
  async sendDisputeRaised(
    adminEmail: string,
    bookingId: string,
    disputeId: string,
    userName: string,
    professionalName: string,
    description: string
  ): Promise<boolean> {
    const html = disputeRaisedAdmin(bookingId, disputeId, userName, professionalName, description);

    return this.send({
      to: adminEmail,
      subject: "⚠️ New Dispute Raised - Action Required",
      html,
    });
  }

  async sendDisputeNotification(
    userEmail: string,
    userName: string,
    bookingId: string,
    disputeId: string,
    message: string
  ): Promise<boolean> {
    const html = disputeNotificationUser(userName, bookingId, disputeId, message);

    return this.send({
      to: userEmail,
      subject: "Dispute Notification - Professionals BD",
      html,
    });
  }

  async sendDisputeResolved(
    complainantEmail: string,
    complainantName: string,
    bookingId: string,
    disputeId: string,
    status: "approved" | "rejected",
    refundAmount?: number,
    note?: string
  ): Promise<boolean> {
    const html = disputeResolved(complainantName, bookingId, disputeId, status, refundAmount, note);

    return this.send({
      to: complainantEmail,
      subject: `Dispute ${status === "approved" ? "Approved" : "Closed"} - Professionals BD`,
      html,
    });
  }

  async sendDisputeResolvedProfessional(
    professionalEmail: string,
    professionalName: string,
    bookingId: string,
    disputeId: string,
    status: "approved" | "rejected",
    note?: string
  ): Promise<boolean> {
    const html = disputeResolvedProfessional(professionalName, bookingId, disputeId, status, note);

    return this.send({
      to: professionalEmail,
      subject: `Dispute Update - Professionals BD`,
      html,
    });
  }

  // Admin / Status Updates
  async sendAccountStatusUpdate(email: string, name: string, status: "BANNED" | "ACTIVE", reason?: string) {
    const html = accountStatusUpdate(name, status, reason);
    return this.send({
      to: email,
      subject: `Account Status Update - Professionals BD`,
      html
    });
  }

  async sendProfessionalStatusUpdate(email: string, name: string, status: "VERIFIED" | "APPROVED" | "REJECTED", reason?: string) {
    const html = professionalStatusUpdate(name, status, reason);
    return this.send({
      to: email,
      subject: `Professional Profile Update - Professionals BD`,
      html
    });
  }

  async sendProfessionalApplicationReceived(email: string, name: string) {
    const html = professionalApplicationReceived(name);
    return this.send({
      to: email,
      subject: "Application Received - Professionals BD",
      html
    });
  }

  async sendWithdrawStatusUpdate(email: string, name: string, amount: number, status: "PROCESSED" | "REJECTED", reason?: string) {
    const html = withdrawStatusUpdate(name, amount, status, reason);
    return this.send({
      to: email,
      subject: `Withdrawal Request Update - Professionals BD`,
      html
    });
  }
}


export const emailService = new EmailService();