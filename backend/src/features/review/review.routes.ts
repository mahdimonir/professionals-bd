import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { ReviewController } from "./review.controller.js";

const router = Router();

// Public routes (no auth)
router.get("/best", ReviewController.getBestReviews);

// All other routes require authentication
router.use(authenticate);

// Submit review (User only)
router.post("/", ReviewController.submitReview);

// Get reviews for a professional (Public but requires auth for consistency)
router.get("/professional/:professionalId", ReviewController.getProfessionalReviews);

// Get my reviews (User)
router.get("/my-reviews", ReviewController.getMyReviews);

// Get single review
router.get("/:id", ReviewController.getReview);

// Update review (User - own review only)
router.patch("/:id", ReviewController.updateReview);

// Delete review (User - own review only)
router.delete("/:id", ReviewController.deleteReview);

export const reviewRoutes = router;
