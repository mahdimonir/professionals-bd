import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../config/client.js";
import { env } from "../../config/env.js";
import { emailService } from "../../services/email.service.js";
import { ApiError } from "../../utils/apiError.js";
import logger from "../../utils/logger.js";

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;
const MAX_RESEND_PER_HOUR = 3;

function generateOTP(length = 6): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateAccessToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_ACCESS_SECRET, { expiresIn: "1h" });
}

function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_REFRESH_SECRET, { expiresIn: "30d" });
}

export class AuthService {
  private static async hashOTP(code: string): Promise<string> {
    return await bcrypt.hash(code, 12);
  }

  private static async verifyOTPHash(storedHash: string, providedCode: string): Promise<boolean> {
    return await bcrypt.compare(providedCode, storedHash);
  }

  private static async createOrUpdateOTP(data: {
    email: string;
    type: "REGISTRATION" | "PASSWORD_RESET";
    code: string;
    tempData?: { name?: string; passwordHash?: string; phone?: string };
  }) {
    const hashedCode = await this.hashOTP(data.code);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    return prisma.oTP.upsert({
      where: { email_type: { email: data.email, type: data.type } },
      update: {
        codeHash: hashedCode,
        expiresAt,
        attempts: 0,
        resendCount: { increment: 1 },
        ...(data.tempData && {
          tempName: data.tempData.name,
          tempPasswordHash: data.tempData.passwordHash,
          tempPhone: data.tempData.phone,
        }),
      },
      create: {
        email: data.email,
        type: data.type,
        codeHash: hashedCode,
        expiresAt,
        resendCount: 1,
        ...(data.tempData && {
          tempName: data.tempData.name,
          tempPasswordHash: data.tempData.passwordHash,
          tempPhone: data.tempData.phone,
        }),
      },
    });
  }

  static async register(data: { name: string; email: string; password: string; phone?: string }) {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new ApiError(400, "Email already registered");
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const otp = generateOTP();

    await this.createOrUpdateOTP({
      email: data.email,
      type: "REGISTRATION",
      code: otp,
      tempData: { name: data.name, passwordHash, phone: data.phone },
    });

    await emailService.sendRegistrationOTP(data.email, data.name, otp);

    logger.info(`Registration OTP sent for email: ${data.email}`);
    return { message: "Verification code sent to your email" };
  }

  static async verifyRegistration(email: string, otp: string) {
    const otpRecord = await prisma.oTP.findUnique({
      where: { email_type: { email, type: "REGISTRATION" } },
    });

    if (!otpRecord) throw new ApiError(400, "Invalid verification request");

    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      await prisma.oTP.delete({ where: { id: otpRecord.id } });
      throw new ApiError(429, "Too many failed attempts. Please register again");
    }

    if (otpRecord.expiresAt < new Date()) {
      await prisma.oTP.delete({ where: { id: otpRecord.id } });
      throw new ApiError(400, "Verification code expired");
    }

    const isValid = await this.verifyOTPHash(otpRecord.codeHash, otp);
    if (!isValid) {
      await prisma.oTP.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      throw new ApiError(400, "Invalid verification code");
    }

    if (!otpRecord.tempName || !otpRecord.tempPasswordHash) {
      throw new ApiError(500, "Registration data corrupted");
    }

    const user = await prisma.user.create({
      data: {
        name: otpRecord.tempName,
        email,
        passwordHash: otpRecord.tempPasswordHash,
        phone: otpRecord.tempPhone,
        isVerified: true,
        role: "USER",
      },
      select: { id: true, name: true, email: true, role: true, avatar: true },
    });

    await prisma.oTP.delete({ where: { id: otpRecord.id } });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    logger.info(`User registered and logged in: ${email}`);
    return { accessToken, refreshToken, user };
  }

  static async resendRegistrationOTP(email: string) {
    const otpRecord = await prisma.oTP.findUnique({
      where: { email_type: { email, type: "REGISTRATION" } },
    });

    if (!otpRecord) {
      return { message: "If a registration is pending, a new code has been sent" };
    }

    // Rate limit resends
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (otpRecord.resendCount > MAX_RESEND_PER_HOUR && otpRecord.createdAt > oneHourAgo) {
      throw new ApiError(429, "Too many resend requests");
    }

    const newOTP = generateOTP();
    await this.createOrUpdateOTP({
      email,
      type: "REGISTRATION",
      code: newOTP,
      tempData: {
        name: otpRecord.tempName!,
        passwordHash: otpRecord.tempPasswordHash!,
        phone: otpRecord.tempPhone ?? undefined,
      },
    });

    await emailService.sendRegistrationOTP(email, otpRecord.tempName || "User", newOTP);
    return { message: "New verification code sent" };
  }

  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, passwordHash: true, isVerified: true, name: true, role: true, avatar: true },
    });

    if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new ApiError(401, "Invalid email or password");
    }

    if (!user.isVerified) {
      throw new ApiError(403, "Please verify your email first");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    const refreshTokenHash = await bcrypt.hash(refreshToken, 12);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: refreshTokenHash,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    logger.info(`User logged in: ${email}`);
    return {
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email, role: user.role, avatar: user.avatar },
    };
  }

  static async sendPasswordResetOTP(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      // Don't reveal existence
      return { message: "If account exists, reset code has been sent" };
    }

    const otp = generateOTP();
    await this.createOrUpdateOTP({ email, type: "PASSWORD_RESET", code: otp });

    await emailService.sendPasswordResetOTP(email, user.name || "User", otp);
    return { message: "If account exists, reset code has been sent" };
  }

  static async resetPassword(email: string, otp: string, newPassword: string) {
    const otpRecord = await prisma.oTP.findUnique({
      where: { email_type: { email, type: "PASSWORD_RESET" } },
    });

    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      throw new ApiError(400, "Invalid or expired reset code");
    }

    const isValid = await this.verifyOTPHash(otpRecord.codeHash, otp);
    if (!isValid) {
      throw new ApiError(400, "Invalid reset code");
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    await prisma.oTP.delete({ where: { id: otpRecord.id } });
    await prisma.refreshToken.deleteMany({ where: { user: { email } } }); // Invalidate all sessions

    logger.info(`Password reset for: ${email}`);
    return { message: "Password updated successfully" };
  }

  static async refreshToken(refreshToken: string) {
    if (!refreshToken) throw new ApiError(401, "Refresh token required");

    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    } catch (error) {
      throw new ApiError(401, "Invalid refresh token signature");
    }

    if (!decoded || !decoded.userId) {
      throw new ApiError(401, "Invalid refresh token payload");
    }

    // Find all valid refresh tokens for this user
    const userTokens = await prisma.refreshToken.findMany({
      where: {
        userId: decoded.userId,
        expiresAt: { gt: new Date() }
      },
      include: { user: { select: { id: true, name: true, email: true, role: true, avatar: true } } },
    });

    let tokenRecord = null;

    // Find the specific token record that matches the provided string
    for (const record of userTokens) {
      const isMatch = await bcrypt.compare(refreshToken, record.tokenHash);
      if (isMatch) {
        tokenRecord = record;
        break;
      }
    }

    if (!tokenRecord) {
      // Token is valid JWT but not in DB (maybe revoked or rotated already)
      // Optional: Reuse detection logic could trigger here (invalidate all tokens for user)
      throw new ApiError(401, "Refresh token reused or revoked");
    }

    const newAccessToken = generateAccessToken(tokenRecord.userId);
    const newRefreshToken = generateRefreshToken(tokenRecord.userId);
    const newRefreshHash = await bcrypt.hash(newRefreshToken, 12);

    // Rotate the token (Replace old with new)
    await prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { tokenHash: newRefreshHash, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      user: tokenRecord.user,
    };
  }

  static async logout(refreshToken: string) {
    if (!refreshToken) return;

    const tokenRecord = await prisma.refreshToken.findFirst({
      where: { expiresAt: { gt: new Date() } },
    });

    if (tokenRecord) {
      const isValid = await bcrypt.compare(refreshToken, tokenRecord.tokenHash);
      if (isValid) {
        await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
      }
    }
  }

  // Change password for logged-in users
  static async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true, email: true },
    });

    if (!user || !user.passwordHash) {
      throw new ApiError(404, "User not found or uses social login");
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      throw new ApiError(401, "Current password is incorrect");
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Invalidate all other sessions (keep current one active)
    await prisma.refreshToken.deleteMany({ where: { userId } });

    logger.info(`Password changed for user: ${user.email}`);
    return { message: "Password changed successfully. Please log in again." };
  }

  // Email change: Step 1 - Request change (verify password, send OTP to NEW email)
  static async requestEmailChange(userId: string, currentPassword: string, newEmail: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true, email: true, name: true },
    });

    if (!user || !user.passwordHash) {
      throw new ApiError(404, "User not found or uses social login");
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new ApiError(401, "Password is incorrect");
    }

    // Check if new email is already in use
    const existingUser = await prisma.user.findUnique({ where: { email: newEmail } });
    if (existingUser) {
      throw new ApiError(400, "Email is already in use");
    }

    // Send OTP to NEW email
    const otp = generateOTP();
    await this.createOrUpdateOTP({
      email: newEmail,
      type: "REGISTRATION", // Reuse registration type for email verification
      code: otp,
      tempData: { name: userId }, // Store userId in tempName to link back
    });

    await emailService.sendRegistrationOTP(newEmail, user.name || "User", otp);

    logger.info(`Email change OTP sent to new email: ${newEmail} for user: ${user.email}`);
    return { message: "Verification code sent to your new email address" };
  }

  // Email change: Step 2 - Verify OTP and update email
  static async verifyEmailChange(userId: string, newEmail: string, otp: string) {
    const otpRecord = await prisma.oTP.findUnique({
      where: { email_type: { email: newEmail, type: "REGISTRATION" } },
    });

    if (!otpRecord) {
      throw new ApiError(400, "Invalid verification request");
    }

    // Verify the userId matches
    if (otpRecord.tempName !== userId) {
      throw new ApiError(400, "Invalid verification request");
    }

    if (otpRecord.expiresAt < new Date()) {
      await prisma.oTP.delete({ where: { id: otpRecord.id } });
      throw new ApiError(400, "Verification code expired");
    }

    const isValid = await this.verifyOTPHash(otpRecord.codeHash, otp);
    if (!isValid) {
      await prisma.oTP.update({
        where: { id: otpRecord.id },
        data: { attempts: { increment: 1 } },
      });
      throw new ApiError(400, "Invalid verification code");
    }

    // Update user's email
    const user = await prisma.user.update({
      where: { id: userId },
      data: { email: newEmail },
      select: { id: true, name: true, email: true, role: true, avatar: true },
    });

    await prisma.oTP.delete({ where: { id: otpRecord.id } });

    // Invalidate all sessions (security measure)
    await prisma.refreshToken.deleteMany({ where: { userId } });

    logger.info(`Email changed to: ${newEmail} for user: ${userId}`);
    return { message: "Email updated successfully. Please log in again.", user };
  }
}