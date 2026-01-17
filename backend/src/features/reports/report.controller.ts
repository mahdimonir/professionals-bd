import { NextFunction, Request, Response } from "express";
import { ReportFormat, ReportService, ReportType } from "../../services/report/index.js";
import { ApiError } from "../../utils/apiError.js";

export class ReportController {

    // Generic download handler for all report types
    static async downloadReport(req: Request, res: Response, next: NextFunction) {
        try {
            const { type } = req.params;
            const { format = "pdf", startDate, endDate } = req.query;
            const user = req.user!;

            // Validate report type
            const validTypes: ReportType[] = [
                "revenue", "users", "bookings", "professionals", "payments", "withdrawals", "disputes",
                "pending-professionals", "my-activity", "my-earnings", "my-bookings", "my-payments"
            ];

            if (!validTypes.includes(type as ReportType)) {
                throw ApiError.badRequest(`Invalid report type: ${type}`);
            }

            // Validate format
            const validFormats: ReportFormat[] = ["pdf", "excel", "json"];
            if (!validFormats.includes(format as ReportFormat)) {
                throw ApiError.badRequest(`Invalid format: ${format}. Use: pdf, excel, json`);
            }

            const report = await ReportService.generate(
                type as ReportType,
                {
                    format: format as ReportFormat,
                    startDate: startDate ? new Date(startDate as string) : undefined,
                    endDate: endDate ? new Date(endDate as string) : undefined,
                    userId: user.id,
                },
                user.role,
                user.user?.name || user.user?.email
            );

            // Set response headers for download
            res.setHeader("Content-Type", report.contentType);
            res.setHeader("Content-Disposition", `attachment; filename="${report.filename}"`);
            res.setHeader("Content-Length", report.buffer.length);

            res.send(report.buffer);
        } catch (error) {
            next(error);
        }
    }

    // Preview report data (JSON only, for UI preview)
    static async previewReport(req: Request, res: Response, next: NextFunction) {
        try {
            const { type } = req.params;
            const { startDate, endDate } = req.query;
            const user = req.user!;

            const report = await ReportService.generate(
                type as ReportType,
                {
                    format: "json",
                    startDate: startDate ? new Date(startDate as string) : undefined,
                    endDate: endDate ? new Date(endDate as string) : undefined,
                    userId: user.id,
                },
                user.role,
                user.user?.name || user.user?.email
            );

            res.json({
                success: true,
                data: JSON.parse(report.buffer.toString()),
            });
        } catch (error) {
            next(error);
        }
    }

    // Get available reports for current user role
    static async getAvailableReports(req: Request, res: Response, next: NextFunction) {
        try {
            const user = req.user!;

            const allReports: { type: ReportType; name: string; description: string }[] = [
                { type: "revenue", name: "Revenue Report", description: "Platform revenue and earnings" },
                { type: "users", name: "Users Report", description: "All platform users" },
                { type: "bookings", name: "Bookings Report", description: "All bookings data" },
                { type: "professionals", name: "Professionals Report", description: "Professional profiles" },
                { type: "payments", name: "Payments Report", description: "Payment transactions" },
                { type: "withdrawals", name: "Withdrawals Report", description: "Withdrawal requests" },
                { type: "disputes", name: "Disputes Report", description: "Dispute cases" },
                { type: "pending-professionals", name: "Pending Professionals", description: "Awaiting approval" },
                { type: "my-activity", name: "My Activity", description: "Your moderation actions" },
                { type: "my-earnings", name: "My Earnings", description: "Your earnings history" },
                { type: "my-bookings", name: "My Bookings", description: "Your bookings" },
                { type: "my-payments", name: "My Payments", description: "Your payments" },
            ];

            const availableReports = allReports.filter(r =>
                ReportService.canAccess(r.type, user.role)
            );

            res.json({
                success: true,
                data: {
                    reports: availableReports,
                    formats: ["pdf", "excel", "json"],
                },
            });
        } catch (error) {
            next(error);
        }
    }
}
