import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import {
  bookingConfirmation,
  bookingStatusUpdate,
  disputeNotificationUser,
  disputeRaisedAdmin,
  disputeResolved,
  disputeResolvedProfessional,
  invoiceEmail,
  passwordResetOTP,
  registrationOTP
} from "../templates/emails/index.js";
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
}


export const emailService = new EmailService();