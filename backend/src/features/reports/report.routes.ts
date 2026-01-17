import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { ReportController } from "./report.controller.js";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get available reports for current user
router.get("/available", ReportController.getAvailableReports);

// Preview report data (JSON)
router.get("/:type/preview", ReportController.previewReport);

// Download report in specified format
router.get("/:type/download", ReportController.downloadReport);

// === ADMIN SPECIFIC ROUTES (shortcuts) ===
router.get("/admin/revenue/download", authorize("ADMIN"), (req, res, next) => {
    req.params.type = "revenue";
    ReportController.downloadReport(req, res, next);
});

router.get("/admin/users/download", authorize("ADMIN", "MODERATOR"), (req, res, next) => {
    req.params.type = "users";
    ReportController.downloadReport(req, res, next);
});

router.get("/admin/bookings/download", authorize("ADMIN", "MODERATOR"), (req, res, next) => {
    req.params.type = "bookings";
    ReportController.downloadReport(req, res, next);
});

router.get("/admin/professionals/download", authorize("ADMIN", "MODERATOR"), (req, res, next) => {
    req.params.type = "professionals";
    ReportController.downloadReport(req, res, next);
});

router.get("/admin/payments/download", authorize("ADMIN"), (req, res, next) => {
    req.params.type = "payments";
    ReportController.downloadReport(req, res, next);
});

router.get("/admin/withdrawals/download", authorize("ADMIN"), (req, res, next) => {
    req.params.type = "withdrawals";
    ReportController.downloadReport(req, res, next);
});

router.get("/admin/disputes/download", authorize("ADMIN", "MODERATOR"), (req, res, next) => {
    req.params.type = "disputes";
    ReportController.downloadReport(req, res, next);
});

// === MODERATOR ROUTES ===
router.get("/moderator/pending-professionals/download", authorize("ADMIN", "MODERATOR"), (req, res, next) => {
    req.params.type = "pending-professionals";
    ReportController.downloadReport(req, res, next);
});

router.get("/moderator/my-activity/download", authorize("ADMIN", "MODERATOR"), (req, res, next) => {
    req.params.type = "my-activity";
    ReportController.downloadReport(req, res, next);
});

// === PROFESSIONAL ROUTES ===
router.get("/professional/earnings/download", authorize("PROFESSIONAL"), (req, res, next) => {
    req.params.type = "my-earnings";
    ReportController.downloadReport(req, res, next);
});

router.get("/professional/bookings/download", authorize("PROFESSIONAL"), (req, res, next) => {
    req.params.type = "my-bookings";
    ReportController.downloadReport(req, res, next);
});

// === USER ROUTES (any authenticated user) ===
router.get("/me/bookings/download", (req, res, next) => {
    (req.params as { type?: string }).type = "my-bookings";
    ReportController.downloadReport(req, res, next);
});

router.get("/me/payments/download", (req, res, next) => {
    (req.params as { type?: string }).type = "my-payments";
    ReportController.downloadReport(req, res, next);
});

export const reportRoutes = router;

