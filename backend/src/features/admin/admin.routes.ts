import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { AdminController } from "./admin.controller.js";

const router = Router();

// All admin routes require authentication
router.use(authenticate);

// USER MANAGEMENT
router.get("/users", authorize("ADMIN", "MODERATOR"), AdminController.getAllUsers);
router.get("/users/:id", authorize("ADMIN", "MODERATOR"), AdminController.getUserDetails);
router.patch("/users/:id/role", authorize("ADMIN"), AdminController.updateUserRole);
router.patch("/users/:id/permissions", authorize("ADMIN"), AdminController.updateModeratorPermissions);
router.patch("/users/:id/ban", authorize("ADMIN", "MODERATOR"), AdminController.banUser);
router.patch("/users/:id/unban", authorize("ADMIN", "MODERATOR"), AdminController.unbanUser);

// PROFESSIONAL MANAGEMENT - TWO-STAGE VERIFICATION
router.get("/professionals", authorize("ADMIN", "MODERATOR"), AdminController.getAllProfessionals);
router.get("/professionals/pending", authorize("ADMIN", "MODERATOR"), AdminController.getPendingProfessionals);
router.get("/professionals/verified", authorize("ADMIN", "MODERATOR"), AdminController.getVerifiedProfessionals);
router.get("/professionals/:id", authorize("ADMIN", "MODERATOR"), AdminController.getProfessionalDetails);
// STAGE 1: MODERATOR verifies credentials (PENDING → VERIFIED or REJECTED)
router.patch("/professionals/:userId/verify", authorize("ADMIN", "MODERATOR"), AdminController.verifyProfessional);
// MODERATOR can reject unverified professionals
router.patch("/professionals/:userId/reject-unverified", authorize("ADMIN", "MODERATOR"), AdminController.rejectProfessional);
// STAGE 2: ADMIN approves verified professionals (VERIFIED → APPROVED or REJECTED)
router.patch("/professionals/:userId/approve", authorize("ADMIN"), AdminController.approveProfessional);
// ADMIN can reject verified professionals
router.patch("/professionals/:userId/reject", authorize("ADMIN"), AdminController.rejectProfessional);
// ADMIN can set custom commission rates
router.patch("/professionals/:userId/commission", authorize("ADMIN"), AdminController.setCommissionRate);

// DRAFT PROFESSIONAL MANAGEMENT (Admin adds professionals directly)
router.post("/professionals/add-draft", authorize("ADMIN"), AdminController.addDraftProfessional);
router.post("/professionals/verify-draft", authorize("ADMIN"), AdminController.verifyDraftProfessional);
router.get("/professionals/drafts", authorize("ADMIN"), AdminController.getDraftProfessionals);
router.post("/professionals/:userId/resend-otp", authorize("ADMIN"), AdminController.resendDraftOTP);

// BOOKINGS MANAGEMENT
router.get("/bookings", authorize("ADMIN", "MODERATOR"), AdminController.getAllBookings);

// PAYMENTS MANAGEMENT
router.get("/payments", authorize("ADMIN", "MODERATOR"), AdminController.getAllPayments);

// WITHDRAW REQUESTS
router.get("/withdraws", authorize("ADMIN", "MODERATOR"), AdminController.getAllWithdrawRequests);
router.patch("/withdraws/:id/approve", authorize("ADMIN"), AdminController.approveWithdraw);
router.patch("/withdraws/:id/reject", authorize("ADMIN"), AdminController.rejectWithdraw);

// AUDIT LOGS & SYSTEM - ADMIN ONLY
router.get("/audit-logs", authorize("ADMIN"), AdminController.getAuditLogs);

export const adminRoutes = router;