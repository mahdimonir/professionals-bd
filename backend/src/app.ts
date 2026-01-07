import cors from "cors";
import express from "express";
import helmet from "helmet";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { authRoutes } from "./features/auth/auth.routes.js";
import { bookingRoutes } from "./features/booking/booking.routes.js";
import { mediaRoutes } from "./features/media/media.routes.js";
import { meetingRoutes } from "./features/meeting/meeting.routes.js";
import { professionalRoutes } from "./features/professional/professional.routes.js";
import { userRoutes } from "./features/user/user.routes.js";
import { errorHandler } from "./middleware/errorHandler.middleware.js";
import { notFoundHandler } from "./middleware/notFound.middleware.js";
import { apiLimiter } from "./middleware/rateLimit.middleware.js";
import swaggerDocument from "./swagger.json";
import logger from "./utils/logger.js";

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

// CORS – Restrictive in production
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000", // Dev only
  "http://localhost:3001",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (e.g., Postman, mobile apps)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        logger.warn(`CORS blocked origin: ${origin}`);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Body Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve Swagger static assets (optional – you can use CDN instead)
app.use("/api-docs/static", express.static(path.join(process.cwd(), "node_modules/swagger-ui-dist")));

// General API rate limiting
app.use("/api/v1", apiLimiter);

// Health Check – Public
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV,
  });
});

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/professionals", professionalRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/meetings", meetingRoutes);
app.use("/api/v1/media", mediaRoutes);

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  swaggerOptions: {
    persistAuthorization: true,
  },
}));

// 404 Handler – Clean and consistent
app.use(notFoundHandler);

// Global Error Handler – Must be last
app.use(errorHandler);

export default app;