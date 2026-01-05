import { Router } from "express";
import { authLimiter } from "../../middleware/rateLimit.middleware.js";
import { AuthController } from "./auth.controller.js";

const router = Router();

router.post("/register", authLimiter, AuthController.register);
router.post("/register/verify", authLimiter, AuthController.verifyRegistration);
router.post(
  "/register/resend",
  authLimiter,
  AuthController.resendRegistrationOTP
);

router.post("/login", authLimiter, AuthController.login);

router.post(
  "/forgot-password",
  authLimiter,
  AuthController.sendPasswordResetOTP
);
router.post("/reset-password", authLimiter, AuthController.resetPassword);

export default router;
