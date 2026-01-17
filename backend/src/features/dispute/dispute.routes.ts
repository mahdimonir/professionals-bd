import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { DisputeController } from "./dispute.controller.js";

const router = Router();

// Raise dispute (client or professional)
router.post("/", authenticate, DisputeController.raiseDispute);

// Get my disputes (as complainant)
router.get("/my", authenticate, DisputeController.getMyDisputes);

// Get all disputes (admin/moderator only)
router.get("/", authenticate, authorize("ADMIN", "MODERATOR"), DisputeController.getAllDisputes);

// Get dispute details (admin/moderator only)
router.get("/:id", authenticate, authorize("ADMIN", "MODERATOR"), DisputeController.getDisputeDetails);

// Resolve dispute (admin/moderator only)
router.patch("/:id/resolve", authenticate, authorize("ADMIN", "MODERATOR"), DisputeController.resolveDispute);

export const disputeRoutes = router;