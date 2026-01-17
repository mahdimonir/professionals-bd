import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { EarningsController } from "./earnings.controller.js";

const router = Router();

// Professional self-service earnings routes
router.get("/", authenticate, authorize("PROFESSIONAL"), EarningsController.getEarnings);

// Withdraw request (professional only)
router.post("/withdraw", authenticate, authorize("PROFESSIONAL"), EarningsController.requestWithdraw);

// Withdraw history (professional only)
router.get("/withdraw/history", authenticate, authorize("PROFESSIONAL"), EarningsController.getWithdrawHistory);

export const earningsRoutes = router;