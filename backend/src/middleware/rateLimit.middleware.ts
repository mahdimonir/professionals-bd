// src/middleware/rateLimit.middleware.ts
import rateLimit from "express-rate-limit";
import { ApiError } from "../utils/apiError.js";

const createLimiter = (options: any) =>
  rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      throw ApiError.tooManyRequests(options.message || "Too many requests");
    },
    ...options,
  });

export const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: "Too many requests from this IP",
});

export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: "Too many auth attempts",
  skipSuccessfulRequests: true,
});

export const paymentLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 15,
  message: "Too many payment attempts",
});

export const contactLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: "Too many contact submissions",
});