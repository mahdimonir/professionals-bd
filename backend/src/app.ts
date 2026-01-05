import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "path";
import swaggerUi from "swagger-ui-express";
import authRoutes from "./features/auth/auth.routes.js";
// import contactRoutes from "./features/contact/contact.routes.js";
// import notificationRoutes from "./features/notifications/notifications.routes.js";
// import paymentRoutes from "./features/payments/payments.routes.js";
// import reviewRoutes from "./features/reviews/reviews.routes.js";
// import userRoutes from "./features/users/users.routes.js";
import { apiLimiter } from "./middleware/rateLimit.middleware.js";
import swaggerDocument from "./swagger.json";
import logger from "./utils/logger.js";

const app = express();

// Serve Swagger UI static files
app.use(
  "/swagger-ui",
  express.static(path.join(process.cwd(), "node_modules/swagger-ui-dist"))
);

// Security Middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body parsing with size limit
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Apply general rate limiting to all routes
app.use("/api/v1", apiLimiter);

// Routes
app.use("/api/v1/auth", authRoutes);
// app.use("/api/v1/users", userRoutes);
// app.use("/api/v1/notifications", notificationRoutes);
// app.use("/api/v1/reviews", reviewRoutes);
// app.use("/api/v1/contact", contactRoutes);
// app.use("/api/v1/payments", paymentRoutes);

// Health Check
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// 404 Handler
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Global Error Handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    logger.error(err);

    // Handle Prisma errors
    if (err.code === "P2022" || err.code === "P2002" || err.code === "P2014") {
      const prismaError = err.meta?.driverAdapterError?.cause || err.meta;
      const columnName =
        prismaError?.originalMessage?.match(/column "?(\w+)"?/i)?.[1] ||
        prismaError?.target?.[0] ||
        "database";

      let message = "Database error occurred";

      if (err.code === "P2022") {
        message = `Database column '${columnName}' does not exist. Please run database migrations.`;
      } else if (err.code === "P2002") {
        message = `A record with this ${columnName} already exists.`;
      } else if (err.code === "P2014") {
        message = "Invalid relation or constraint violation.";
      }

      return res.status(400).json({
        success: false,
        message,
      });
    }

    // Handle Prisma validation errors
    if (err.name === "PrismaClientValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid data provided. Please check your input.",
      });
    }

    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === "development";

    // Clean up error message - remove stack traces and file paths
    let errorMessage = err.message || "Internal Server Error";
    if (!isDevelopment) {
      // Remove file paths and stack traces from message
      errorMessage = errorMessage
        .split("\n")[0]
        .replace(/at\s+.*/g, "")
        .replace(/E:.*?backend[\\/]/gi, "")
        .trim();
    }

    res.status(err.status || 500).json({
      success: false,
      message: errorMessage,
      ...(isDevelopment && { stack: err.stack }),
    });
  }
);

export default app;
