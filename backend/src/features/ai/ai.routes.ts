import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "../../middleware/auth.middleware.js";
import { AIController } from "./ai.controller.js";

const router = Router();

// Rate limiting for AI queries to prevent abuse
const aiQueryLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 requests per minute
    message: "Too many AI queries, please try again later",
});

const aiSearchLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30, // 30 searches per minute
    message: "Too many search requests, please try again later",
});

// Main AI assistant query
router.post("/query", aiQueryLimiter, AIController.query);

// Smart natural language search
router.post("/search", aiSearchLimiter, AIController.smartSearch);

// Get chat history - requires authentication
router.get("/history", authenticate, AIController.getChatHistory);

// Get feature status
router.get("/features/:featureName", AIController.getFeatureStatus);

export const aiRoutes = router;
