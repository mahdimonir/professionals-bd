import { Router } from "express";
import { env } from "../../config/env.js";
import { authenticate } from "../../middleware/auth.middleware.js";
import { authLimiter } from "../../middleware/rateLimit.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import { AuthController } from "./auth.controller.js";
import {
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerSchema,
  resendRegistrationOTPSchema,
  resetPasswordSchema,
  verifyRegistrationSchema,
} from "./auth.validation.js";
import passport from "./social/google.strategy.js";

const router = Router();

// Email/Password + OTP Auth
router.post("/register", authLimiter, validate(registerSchema), AuthController.register);
router.post("/register/verify", authLimiter, validate(verifyRegistrationSchema), AuthController.verifyRegistration);
router.post("/register/resend", authLimiter, validate(resendRegistrationOTPSchema), AuthController.resendRegistrationOTP);

router.post("/login", authLimiter, validate(loginSchema), AuthController.login);
router.post("/refresh", authLimiter, validate(refreshTokenSchema), AuthController.refreshToken);
router.post("/logout", authLimiter, validate(logoutSchema), AuthController.logout);

router.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), AuthController.sendPasswordResetOTP);
router.post("/reset-password", authLimiter, validate(resetPasswordSchema), AuthController.resetPassword);

// Authenticated user account changes
router.post("/change-password", authenticate, authLimiter, AuthController.changePassword);
router.post("/change-email/request", authenticate, authLimiter, AuthController.requestEmailChange);
router.post("/change-email/verify", authenticate, authLimiter, AuthController.verifyEmailChange);

// Google Social Login
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${env.FRONTEND_URL || "http://localhost:3000"}/auth/login?error=google_failed`,
  }),
  (req: any, res) => {
    const { accessToken, refreshToken, user } = req.user;

    const frontendUrl = env.FRONTEND_URL || "http://localhost:3000";

    res.redirect(
      `${frontendUrl}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}&user=${encodeURIComponent(JSON.stringify(user))}`
    );
  }
);

export const authRoutes = router;