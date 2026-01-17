import prisma from "../../config/client.js";
import { ApiError } from "../../utils/apiError.js";
import { ExcelFormatter, JSONFormatter, PDFFormatter } from "./formatters/index.js";

export type ReportFormat = "pdf" | "excel" | "json";
export type ReportType =
    | "revenue" | "users" | "bookings" | "professionals" | "payments" | "withdrawals" | "disputes"  // Admin
    | "pending-professionals" | "my-activity"  // Moderator
    | "my-earnings" | "my-bookings" | "my-payments";  // Professional/User

export interface ReportOptions {
    startDate?: Date;
    endDate?: Date;
    userId?: string;  // For user-specific reports
    format: ReportFormat;
}

export interface GeneratedReport {
    buffer: Buffer;
    filename: string;
    contentType: string;
}

// Role-based access control for reports
const REPORT_ACCESS: Record<ReportType, string[]> = {
    // Admin only
    revenue: ["ADMIN"],
    payments: ["ADMIN"],
    withdrawals: ["ADMIN"],

    // Admin + Moderator
    users: ["ADMIN", "MODERATOR"],
    bookings: ["ADMIN", "MODERATOR"],
    professionals: ["ADMIN", "MODERATOR"],
    disputes: ["ADMIN", "MODERATOR"],
    "pending-professionals": ["ADMIN", "MODERATOR"],
    "my-activity": ["ADMIN", "MODERATOR"],

    // Role-specific
    "my-earnings": ["PROFESSIONAL"],
    "my-bookings": ["PROFESSIONAL", "USER"],
    "my-payments": ["PROFESSIONAL", "USER"],
};

export class ReportService {

    // Check if user can access report
    static canAccess(reportType: ReportType, userRole: string): boolean {
        return REPORT_ACCESS[reportType]?.includes(userRole) ?? false;
    }

    // Main generate function
    static async generate(
        reportType: ReportType,
        options: ReportOptions,
        userRole: string,
        userName?: string
    ): Promise<GeneratedReport> {
        if (!this.canAccess(reportType, userRole)) {
            throw ApiError.forbidden("You don't have access to this report");
        }

        const dateRange = options.startDate && options.endDate
            ? { start: options.startDate, end: options.endDate }
            : undefined;

        // Get report data based on type
        const reportData = await this.getReportData(reportType, options);

        // Generate in requested format
        switch (options.format) {
            case "pdf":
                return this.generatePDF(reportType, reportData, dateRange, userName);
            case "excel":
                return this.generateExcel(reportType, reportData, dateRange, userName);
            case "json":
                return this.generateJSON(reportType, reportData, dateRange, userName);
            default:
                throw ApiError.badRequest("Invalid format. Use: pdf, excel, or json");
        }
    }

    // Fetch data based on report type
    private static async getReportData(type: ReportType, options: ReportOptions): Promise<any> {
        const { startDate, endDate, userId } = options;
        const dateFilter = this.buildDateFilter(startDate, endDate);

        switch (type) {
            case "revenue":
                return this.getRevenueData(dateFilter);
            case "users":
                return this.getUsersData(dateFilter);
            case "bookings":
                return this.getBookingsData(dateFilter);
            case "professionals":
                return this.getProfessionalsData(dateFilter);
            case "payments":
                return this.getPaymentsData(dateFilter);
            case "withdrawals":
                return this.getWithdrawalsData(dateFilter);
            case "disputes":
                return this.getDisputesData(dateFilter);
            case "pending-professionals":
                return this.getPendingProfessionalsData();
            case "my-activity":
                return this.getModeratorActivityData(userId!);
            case "my-earnings":
                return this.getMyEarningsData(userId!, dateFilter);
            case "my-bookings":
                return this.getMyBookingsData(userId!, dateFilter);
            case "my-payments":
                return this.getMyPaymentsData(userId!, dateFilter);
            default:
                throw ApiError.badRequest("Unknown report type");
        }
    }

    private static buildDateFilter(start?: Date, end?: Date) {
        if (!start && !end) return {};
        const filter: any = {};
        if (start) filter.gte = start;
        if (end) filter.lte = end;
        return { createdAt: filter };
    }

    // === DATA FETCHERS ===

    private static async getRevenueData(dateFilter: any) {
        const [payments, byStatus, byMethod, totalPaid, totalRefunded] = await Promise.all([
            prisma.payment.findMany({
                where: { ...dateFilter, status: { in: ["PAID", "REFUNDED"] } },
                orderBy: { createdAt: "desc" },
                take: 100,
                include: { booking: { include: { user: { select: { name: true, email: true } } } } },
            }),
            prisma.payment.groupBy({ by: ["status"], where: dateFilter, _count: true, _sum: { amount: true } }),
            prisma.payment.groupBy({ by: ["method"], where: dateFilter, _count: true, _sum: { amount: true } }),
            prisma.payment.aggregate({ where: { ...dateFilter, status: "PAID" }, _sum: { amount: true } }),
            prisma.payment.aggregate({ where: { ...dateFilter, status: "REFUNDED" }, _sum: { amount: true } }),
        ]);

        const grossRevenue = totalPaid._sum.amount?.toNumber() || 0;
        const refundedAmount = totalRefunded._sum.amount?.toNumber() || 0;
        const netRevenue = grossRevenue - refundedAmount;

        return {
            summary: {
                totalRevenue: netRevenue, // Display Net Revenue as main stat
                grossRevenue: grossRevenue,
                totalRefunded: refundedAmount,
                byStatus,
                byMethod,
            },
            data: payments.map(p => ({
                id: p.id,
                amount: p.status === 'REFUNDED' ? -p.amount.toNumber() : p.amount.toNumber(),
                method: p.method,
                status: p.status,
                date: p.createdAt.toISOString().split("T")[0],
                customer: p.booking?.user?.name || "N/A",
            })),
        };
    }

    private static async getUsersData(dateFilter: any) {
        const [users, byRole, total] = await Promise.all([
            prisma.user.findMany({
                where: dateFilter,
                orderBy: { createdAt: "desc" },
                take: 200,
                select: { id: true, name: true, email: true, role: true, isVerified: true, createdAt: true },
            }),
            prisma.user.groupBy({ by: ["role"], where: dateFilter, _count: true }),
            prisma.user.count({ where: dateFilter }),
        ]);

        return {
            summary: { totalUsers: total, byRole },
            data: users.map(u => ({
                id: u.id,
                name: u.name || "N/A",
                email: u.email,
                role: u.role,
                verified: u.isVerified ? "Yes" : "No",
                joined: u.createdAt.toISOString().split("T")[0],
            })),
        };
    }

    private static async getBookingsData(dateFilter: any) {
        const [bookings, byStatus, total] = await Promise.all([
            prisma.booking.findMany({
                where: dateFilter,
                orderBy: { createdAt: "desc" },
                take: 200,
                include: {
                    user: { select: { name: true } },
                    professional: { select: { name: true } },
                },
            }),
            prisma.booking.groupBy({ by: ["status"], where: dateFilter, _count: true }),
            prisma.booking.count({ where: dateFilter }),
        ]);

        return {
            summary: { totalBookings: total, byStatus },
            data: bookings.map(b => ({
                id: b.id,
                client: b.user?.name || "N/A",
                professional: b.professional?.name || "N/A",
                date: b.startTime.toISOString().split("T")[0],
                duration: `${Math.round((b.endTime.getTime() - b.startTime.getTime()) / 60000)} min`,
                price: b.price?.toNumber() || 0,
                status: b.status,
            })),
        };
    }

    private static async getProfessionalsData(dateFilter: any) {
        const [profiles, byStatus, total] = await Promise.all([
            prisma.professionalProfile.findMany({
                where: dateFilter,
                orderBy: { createdAt: "desc" },
                take: 200,
                include: { user: { select: { name: true, email: true } } },
            }),
            prisma.professionalProfile.groupBy({ by: ["status"], where: dateFilter, _count: true }),
            prisma.professionalProfile.count({ where: dateFilter }),
        ]);

        return {
            summary: { totalProfessionals: total, byStatus },
            data: profiles.map(p => ({
                id: p.userId,
                name: p.user?.name || "N/A",
                email: p.user?.email || "N/A",
                title: p.title || "N/A",
                category: p.category || "N/A",
                status: p.status,
                rate: p.sessionPrice?.toNumber() || 0,
                experience: p.experience || 0,
            })),
        };
    }

    private static async getPaymentsData(dateFilter: any) {
        const [payments, byStatus, byMethod, total] = await Promise.all([
            prisma.payment.findMany({
                where: dateFilter,
                orderBy: { createdAt: "desc" },
                take: 200,
                include: { booking: { include: { user: { select: { name: true } }, professional: { select: { name: true } } } } },
            }),
            prisma.payment.groupBy({ by: ["status"], where: dateFilter, _count: true }),
            prisma.payment.groupBy({ by: ["method"], where: dateFilter, _count: true }),
            prisma.payment.count({ where: dateFilter }),
        ]);

        return {
            summary: { totalPayments: total, byStatus, byMethod },
            data: payments.map(p => ({
                id: p.id,
                amount: p.amount.toNumber(),
                method: p.method,
                status: p.status,
                date: p.createdAt.toISOString().split("T")[0],
                client: p.booking?.user?.name || "N/A",
                professional: p.booking?.professional?.name || "N/A",
            })),
        };
    }

    private static async getWithdrawalsData(dateFilter: any) {
        const dateKey = dateFilter.createdAt ? { requestedAt: dateFilter.createdAt } : {};
        const [withdrawals, byStatus, total, totalAmount] = await Promise.all([
            prisma.withdrawRequest.findMany({
                where: dateKey,
                orderBy: { requestedAt: "desc" },
                take: 200,
                include: { professional: { select: { name: true } } },
            }),
            prisma.withdrawRequest.groupBy({ by: ["status"], where: dateKey, _count: true }),
            prisma.withdrawRequest.count({ where: dateKey }),
            prisma.withdrawRequest.aggregate({ where: dateKey, _sum: { amount: true } }),
        ]);

        return {
            summary: { totalRequests: total, totalAmount: totalAmount._sum.amount?.toNumber() || 0, byStatus },
            data: withdrawals.map(w => ({
                id: w.id,
                professional: w.professional?.name || "N/A",
                amount: w.amount.toNumber(),
                method: w.method,
                status: w.status,
                requested: w.requestedAt.toISOString().split("T")[0],
            })),
        };
    }

    private static async getDisputesData(dateFilter: any) {
        const [disputes, byStatus, total] = await Promise.all([
            prisma.dispute.findMany({
                take: 200,
                include: {
                    user: { select: { name: true } },
                },
            }),
            prisma.dispute.groupBy({ by: ["status"], _count: true }),
            prisma.dispute.count(),
        ]);

        return {
            summary: { totalDisputes: total, byStatus },
            data: disputes.map(d => ({
                id: d.id,
                complainant: d.user?.name || "N/A",
                type: d.type,
                status: d.status,
                bookingId: d.bookingId || "N/A",
                description: d.description.substring(0, 50) + "...",
            })),
        };
    }

    private static async getPendingProfessionalsData() {
        const [pending, verified] = await Promise.all([
            prisma.professionalProfile.findMany({
                where: { status: "PENDING" },
                include: { user: { select: { name: true, email: true } } },
            }),
            prisma.professionalProfile.findMany({
                where: { status: "VERIFIED" },
                include: { user: { select: { name: true, email: true } } },
            }),
        ]);

        return {
            summary: { pending: pending.length, verified: verified.length, total: pending.length + verified.length },
            data: [...pending, ...verified].map(p => ({
                id: p.userId,
                name: p.user?.name || "N/A",
                email: p.user?.email || "N/A",
                title: p.title || "N/A",
                status: p.status,
                applied: p.createdAt.toISOString().split("T")[0],
            })),
        };
    }

    private static async getModeratorActivityData(userId: string) {
        const logs = await prisma.auditLog.findMany({
            where: { performedBy: userId },
            orderBy: { createdAt: "desc" },
            take: 200,
        });

        return {
            summary: { totalActions: logs.length },
            data: logs.map(l => ({
                action: l.action,
                target: l.targetId || "N/A",
                date: l.createdAt.toISOString().split("T")[0],
                time: l.createdAt.toISOString().split("T")[1].split(".")[0],
            })),
        };
    }

    private static async getMyEarningsData(userId: string, dateFilter: any) {
        const [earnings, withdrawals] = await Promise.all([
            prisma.earnings.findUnique({ where: { professionalId: userId } }),
            prisma.withdrawRequest.findMany({
                where: { professionalId: userId },
                orderBy: { requestedAt: "desc" },
                take: 50,
            }),
        ]);

        return {
            summary: {
                totalEarnings: earnings?.totalEarnings?.toNumber() || 0,
                pendingEarnings: earnings?.pendingEarnings?.toNumber() || 0,
                withdrawn: earnings?.withdrawn?.toNumber() || 0,
            },
            data: withdrawals.map(w => ({
                id: w.id,
                amount: w.amount.toNumber(),
                method: w.method,
                status: w.status,
                requested: w.requestedAt.toISOString().split("T")[0],
            })),
        };
    }

    private static async getMyBookingsData(userId: string, dateFilter: any) {
        const bookings = await prisma.booking.findMany({
            where: { OR: [{ userId }, { professionalId: userId }], ...dateFilter },
            orderBy: { startTime: "desc" },
            take: 100,
            include: {
                user: { select: { name: true } },
                professional: { select: { name: true } },
            },
        });

        return {
            summary: { totalBookings: bookings.length },
            data: bookings.map(b => ({
                id: b.id,
                client: b.user?.name || "N/A",
                professional: b.professional?.name || "N/A",
                date: b.startTime.toISOString().split("T")[0],
                price: b.price?.toNumber() || 0,
                status: b.status,
            })),
        };
    }

    private static async getMyPaymentsData(userId: string, dateFilter: any) {
        const payments = await prisma.payment.findMany({
            where: { booking: { OR: [{ userId }, { professionalId: userId }] }, ...dateFilter },
            orderBy: { createdAt: "desc" },
            take: 100,
            include: { booking: { select: { id: true } } },
        });

        return {
            summary: { totalPayments: payments.length },
            data: payments.map(p => ({
                id: p.id,
                amount: p.amount.toNumber(),
                method: p.method,
                status: p.status,
                date: p.createdAt.toISOString().split("T")[0],
                bookingId: p.booking?.id || "N/A",
            })),
        };
    }

    // === FORMAT GENERATORS ===

    private static async generatePDF(
        type: ReportType,
        data: any,
        dateRange?: { start: Date; end: Date },
        userName?: string
    ): Promise<GeneratedReport> {
        const title = this.getReportTitle(type);
        const pdf = new PDFFormatter({ title, dateRange, generatedBy: userName });

        pdf.addHeader();

        // Add summary stats
        if (data.summary) {
            pdf.addSection("Summary");
            const stats = Object.entries(data.summary)
                .filter(([k, v]) => typeof v === "number" || typeof v === "string")
                .map(([k, v]) => ({ label: this.formatLabel(k), value: v as string | number }));
            if (stats.length > 0) pdf.addStats(stats);
        }

        // Add data table
        if (data.data?.length > 0) {
            pdf.addSection("Details");
            const columns = Object.keys(data.data[0]).map(key => ({
                header: this.formatLabel(key),
                key,
                align: this.getColumnAlign(key) as "left" | "center" | "right",
            }));
            pdf.addTable(columns, data.data);
        }

        pdf.addFooter();

        return {
            buffer: await pdf.toBuffer(),
            filename: `${type}-report-${Date.now()}.pdf`,
            contentType: "application/pdf",
        };
    }

    private static async generateExcel(
        type: ReportType,
        data: any,
        dateRange?: { start: Date; end: Date },
        userName?: string
    ): Promise<GeneratedReport> {
        const title = this.getReportTitle(type);
        const excel = new ExcelFormatter({ title, dateRange, generatedBy: userName, sheetName: title });

        excel.addHeader();

        // Add summary
        if (data.summary) {
            excel.addSection("Summary");
            const stats = Object.entries(data.summary)
                .filter(([k, v]) => typeof v === "number" || typeof v === "string")
                .map(([k, v]) => ({ label: this.formatLabel(k), value: v as string | number }));
            if (stats.length > 0) excel.addStats(stats);
        }

        // Add data table
        if (data.data?.length > 0) {
            excel.addSection("Details");
            const columns = Object.keys(data.data[0]).map(key => ({
                header: this.formatLabel(key),
                key,
                width: this.getColumnWidth(key),
            }));
            excel.addTable(columns, data.data);
        }

        excel.autoFitColumns();

        return {
            buffer: await excel.toBuffer(),
            filename: `${type}-report-${Date.now()}.xlsx`,
            contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        };
    }

    private static async generateJSON(
        type: ReportType,
        data: any,
        dateRange?: { start: Date; end: Date },
        userName?: string
    ): Promise<GeneratedReport> {
        const title = this.getReportTitle(type);
        const json = new JSONFormatter({ title, type, dateRange, generatedBy: userName });

        if (data.summary) json.addSummary(data.summary);
        if (data.data) json.addData(data.data);

        return {
            buffer: json.toBuffer(),
            filename: `${type}-report-${Date.now()}.json`,
            contentType: "application/json",
        };
    }

    // === HELPERS ===

    private static getReportTitle(type: ReportType): string {
        const titles: Record<ReportType, string> = {
            revenue: "Revenue Report",
            users: "Users Report",
            bookings: "Bookings Report",
            professionals: "Professionals Report",
            payments: "Payments Report",
            withdrawals: "Withdrawals Report",
            disputes: "Disputes Report",
            "pending-professionals": "Pending Professionals Report",
            "my-activity": "My Moderation Activity",
            "my-earnings": "My Earnings Report",
            "my-bookings": "My Bookings Report",
            "my-payments": "My Payments Report",
        };
        return titles[type] || "Report";
    }

    private static formatLabel(key: string): string {
        return key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase()).trim();
    }

    private static getColumnAlign(key: string): string {
        if (["amount", "price", "rate", "experience"].includes(key)) return "right";
        if (["id", "status"].includes(key)) return "center";
        return "left";
    }

    private static getColumnWidth(key: string): number {
        if (key === "id") return 20;
        if (key === "email") return 25;
        if (key === "description") return 40;
        return 15;
    }
}
