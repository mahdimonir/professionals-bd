import { NextFunction, Request, Response } from "express";
import { AuthService } from "./auth.service.js";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resendOTPSchema,
  resetPasswordSchema,
  verifyRegistrationSchema,
} from "./auth.validation.js";

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await AuthService.register(data);
      res.status(201).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async verifyRegistration(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { email, otp } = verifyRegistrationSchema.parse(req.body);
      const result = await AuthService.verifyRegistration(email, otp);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async resendRegistrationOTP(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { email } = resendOTPSchema.parse(req.body);
      const result = await AuthService.resendRegistrationOTP(email);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const result = await AuthService.login(email, password);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async sendPasswordResetOTP(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      const result = await AuthService.sendPasswordResetOTP(email);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp, newPassword } = resetPasswordSchema.parse(req.body);
      const result = await AuthService.resetPassword(email, otp, newPassword);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }
}
