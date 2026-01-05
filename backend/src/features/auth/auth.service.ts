import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../config/database.js";
import { env } from "../../config/env.js";
import { emailService } from "../../services/email.service.js";

const OTP_EXPIRY_MINUTES = 15; // Give user enough time
const MAX_ATTEMPTS = 5;

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export class AuthService {
  // Step 1: Register → Save temp data in OTP table only
  static async register(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new Error("Email already registered and verified. Please login.");
    }

    // If there's a pending registration (in OTP table) → just resend new OTP
    const hashedPassword = await bcrypt.hash(data.password, 12);
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.oTP.upsert({
      where: { email: data.email },
      update: {
        code: otp,
        expiresAt,
        attempts: 0, // Reset attempts
        tempName: data.name,
        tempPassword: hashedPassword,
        tempPhone: data.phone,
      },
      create: {
        email: data.email,
        code: otp,
        expiresAt,
        tempName: data.name,
        tempPassword: hashedPassword,
        tempPhone: data.phone,
        type: "REGISTRATION",
      },
    });

    await emailService.sendRegistrationOTP(data.email, data.name, otp);

    return {
      message:
        "Verification code sent to your email. Please check your inbox (and spam folder).",
    };
  }

  // Step 2: Verify OTP → NOW create real user
  static async verifyRegistration(email: string, otp: string) {
    const otpRecord = await prisma.oTP.findUnique({
      where: { email },
    });

    if (!otpRecord || otpRecord.type !== "REGISTRATION") {
      throw new Error("Invalid verification request");
    }

    if (otpRecord.code !== otp) {
      await this.incrementAttempts(email);
      throw new Error("Invalid verification code");
    }

    if (otpRecord.expiresAt < new Date()) {
      await prisma.oTP.delete({ where: { email } });
      throw new Error("Verification code expired");
    }

    if (otpRecord.attempts >= MAX_ATTEMPTS) {
      await prisma.oTP.delete({ where: { email } });
      throw new Error(
        "Too many failed attempts. Please try registering again."
      );
    }

    // Required temp data must exist
    if (!otpRecord.tempName || !otpRecord.tempPassword) {
      throw new Error("Registration data missing. Please register again.");
    }

    // Create REAL verified user
    const user = await prisma.user.create({
      data: {
        name: otpRecord.tempName,
        email: otpRecord.email,
        password: otpRecord.tempPassword,
        phone: otpRecord.tempPhone,
        isVerified: true,
        role: "USER",
      },
    });

    // Clean up temp data
    await prisma.oTP.delete({ where: { email } });

    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      message: "Account created and verified successfully!",
    };
  }

  // Resend Registration OTP
  static async resendRegistrationOTP(email: string) {
    // Check if there's a pending registration
    const otpRecord = await prisma.oTP.findUnique({
      where: { email },
    });

    if (!otpRecord || otpRecord.type !== "REGISTRATION") {
      // Security: Don't reveal if email has no pending registration
      return {
        message: "If a registration is pending, a new code has been sent.",
      };
    }

    // Optional: Rate limit resends (e.g., max 3 per hour)
    // You can add a resendCount field later if needed

    const newOTP = generateOTP();
    const newExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await prisma.oTP.update({
      where: { email },
      data: {
        code: newOTP,
        expiresAt: newExpiresAt,
        attempts: 0, // Reset attempts on resend
      },
    });

    // Resend email
    await emailService.sendRegistrationOTP(
      email,
      otpRecord.tempName || "User",
      newOTP
    );

    return { message: "New verification code sent to your email" };
  }

  // Login (only verified users)
  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error("Invalid email or password");
    }

    // No need to check isVerified — we only create verified users now!
    const token = jwt.sign({ userId: user.id }, env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    };
  }

  // Password reset (unchanged — uses OTP table temporarily)
  static async sendPasswordResetOTP(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("If email exists, reset code sent");

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.oTP.upsert({
      where: { email },
      update: { code: otp, expiresAt, attempts: 0, type: "PASSWORD_RESET" },
      create: { email, code: otp, expiresAt, type: "PASSWORD_RESET" },
    });

    await emailService.sendPasswordResetOTP(email, user.name, otp);
    return { message: "Password reset code sent" };
  }

  static async resetPassword(email: string, otp: string, newPassword: string) {
    const otpRecord = await prisma.oTP.findUnique({ where: { email } });

    if (
      !otpRecord ||
      otpRecord.type !== "PASSWORD_RESET" ||
      otpRecord.code !== otp ||
      otpRecord.expiresAt < new Date()
    ) {
      throw new Error("Invalid or expired code");
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { email },
      data: { password: hashed },
    });

    await prisma.oTP.delete({ where: { email } });
    return { message: "Password reset successful" };
  }

  private static async incrementAttempts(email: string) {
    await prisma.oTP.update({
      where: { email },
      data: { attempts: { increment: 1 } },
    });
  }
}
