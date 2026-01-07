import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../utils/apiResponse.js";
import { AuthService } from "./auth.service.js";

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json(new ApiResponse(201, result, "Verification code sent successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async verifyRegistration(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = req.body;
      const result = await AuthService.verifyRegistration(email, otp);
      res.json(new ApiResponse(200, result, "Account verified and logged in successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async resendRegistrationOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await AuthService.resendRegistrationOTP(email);
      res.json(new ApiResponse(200, result, "New verification code sent"));
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      res.json(new ApiResponse(200, result, "Login successful"));
    } catch (error) {
      next(error);
    }
  }

  static async sendPasswordResetOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await AuthService.sendPasswordResetOTP(email);
      res.json(new ApiResponse(200, result, "Password reset code sent if account exists"));
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp, newPassword } = req.body;
      const result = await AuthService.resetPassword(email, otp, newPassword);
      res.json(new ApiResponse(200, result, "Password reset successful"));
    } catch (error) {
      next(error);
    }
  }

  static async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refreshToken(refreshToken);
      res.json(new ApiResponse(200, result, "Token refreshed"));
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      await AuthService.logout(refreshToken);
      res.json(new ApiResponse(200, null, "Logged out successfully"));
    } catch (error) {
      next(error);
    }
  }
}