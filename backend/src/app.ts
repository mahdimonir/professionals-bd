import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "path";
import swaggerUi from "swagger-ui-express";
import pkg from "../package.json";
import { adminRoutes } from "./features/admin/admin.routes.js";
import { aiRoutes } from "./features/ai/ai.routes";
import { authRoutes } from "./features/auth/auth.routes.js";
import { bookingRoutes } from "./features/booking/booking.routes.js";
import { disputeRoutes } from "./features/dispute/dispute.routes.js";
import { mediaRoutes } from "./features/media/media.routes.js";
import { meetingRoutes } from "./features/meeting/meeting.routes.js";
import { paymentRoutes } from "./features/payment/payment.routes.js";
import { earningsRoutes } from "./features/professional/earnings.routes.js";
import { professionalRoutes } from "./features/professional/professional.routes.js";
import { reportRoutes } from "./features/reports/report.routes.js";
import { reviewRoutes } from "./features/review/review.routes.js";
import { userRoutes } from "./features/user/user.routes.js";
import { errorHandler } from "./middleware/errorHandler.middleware.js";
import { notFoundHandler } from "./middleware/notFound.middleware.js";
import { apiLimiter } from "./middleware/rateLimit.middleware.js";
import swaggerDocument from "./swagger.json";

const app = express();

// Trust proxy (important for production behind reverse proxies like Nginx, Vercel, Render, etc.)
app.set("trust proxy", 1);

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  })
);

app.use(express.static(path.join(process.cwd(), 'public')));

// CORS – Restrictive in production
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "http://localhost:5173",
  "https://www.professionalsbd.com",
  "https://professionalsbd.com",
].filter(Boolean) as string[];

const corsOptions = {
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["Content-Length", "X-Request-Id"],
  maxAge: 600,
  credentials: true,
};

app.use(
  cors((req, callback) => {
    const origin = req.header("Origin");

    // Always allow payment callbacks (SSLCommerz POSTs from browser with varying origins)
    if (req.path && req.path.includes("/payments/sslcommerz")) {
      return callback(null, { ...corsOptions, origin: true });
    }

    // Allow requests with no origin (like mobile apps, curl, or standard browser navigations)
    if (!origin) {
      return callback(null, { ...corsOptions, origin: true });
    }

    // Check Allowed Origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, { ...corsOptions, origin: true });
    }

    // Check Vercel Preview
    const vercelPreviewPattern = /^https:\/\/.*\.vercel\.app$/;
    if (vercelPreviewPattern.test(origin)) {
      return callback(null, { ...corsOptions, origin: true });
    }

    // Check SSLCommerz Domain
    if (origin.endsWith(".sslcommerz.com")) {
      return callback(null, { ...corsOptions, origin: true });
    }

    // Check "null" origin (often from redirects or sandboxed iframes)
    if (origin === "null") {
      return callback(null, { ...corsOptions, origin: true });
    }

    console.warn(`[CORS] Blocked Origin: ${origin}`);
    return callback(new Error("Not allowed by CORS"));
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use(
  "/api-docs/static",
  express.static(path.join(process.cwd(), "node_modules/swagger-ui-dist"))
);
app.use(
  "/api/v1/invoices",
  express.static(path.join(process.cwd(), "temp"))
);
app.use("/api/v1", apiLimiter);

app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Welcome to West Bound Travels API",
    version: pkg.version,
    description: pkg.description,
    documentation: `${req.protocol}://${req.get("host")}/api-docs`,
    health_check: `${req.protocol}://${req.get("host")}/health`,
    timestamp: new Date().toISOString(),
  });
});


// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/professionals", professionalRoutes);
app.use("/api/v1/earnings", earningsRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/meetings", meetingRoutes);
app.use("/api/v1/media", mediaRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/disputes", disputeRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/reports", reportRoutes);
app.use("/api/v1/ai", aiRoutes);

// Health Check – Public
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
  });
});

// Swagger Documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  })
);

// 404 Handler – Clean and consistent
app.use(notFoundHandler);

// Global Error Handler – Must be last
app.use(errorHandler);

export default app;
