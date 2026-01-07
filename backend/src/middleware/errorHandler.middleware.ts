import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/apiError.js";
import logger from "../utils/logger.js";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log full error in server
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  // Prisma-specific errors
  if (err.code?.startsWith?.("P")) {
    const prismaErrors: Record<string, { status: number; message: string }> = {
      P2002: { status: 409, message: "Unique constraint failed" },
      P2003: { status: 400, message: "Foreign key constraint failed" },
      P2025: { status: 404, message: "Record not found" },
    };

    const mapped = prismaErrors[err.code];
    if (mapped) {
      return res.status(mapped.status).json({
        success: false,
        message: mapped.message,
      });
    }
  }

  // Zod validation errors
  if (err.name === "ZodError") {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: err.errors,
    });
  }

  // Our custom ApiError
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.data && { data: err.data }),
    });
  }

  // Development | Production
  const isDev = process.env.NODE_ENV === "development";

  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode === 500 ? "Internal Server Error" : err.message;

  res.status(statusCode).json({
    success: false,
    message,
    ...(isDev && { stack: err.stack }),
  });
};