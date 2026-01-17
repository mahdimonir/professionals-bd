import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../utils/apiResponse.js";
import { AdminService } from "./admin.service.js";

export class AdminController {
    // Users
    static async getAllUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const { page = 1, limit = 20, role, search } = req.query;
            const result = await AdminService.getAllUsers({
                page: Number(page),
                limit: Number(limit),
                role: role as any,
                search: search as string,
            });
            res.json(ApiResponse.success(result));
        } catch (error) {
            next(error);
        }
    }

    static async getUserDetails(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const user = await AdminService.getUserDetails(id);
            res.json(ApiResponse.success(user));
        } catch (error) {
            next(error);
        }
    }

    static async banUser(req: Request, res: Response, next: NextFunction) {
        try {
            const adminId = req.user!.id;
            const { id } = req.params;
            const { reason } = req.body;
            const result = await AdminService.banUser(id, reason, adminId);
            res.json(ApiResponse.success(result));
        } catch (error) {
            next(error);
        }
    }

    static async unbanUser(req: Request, res: Response, next: NextFunction) {
        try {
            const adminId = req.user!.id;
            const { id } = req.params;
            const result = await AdminService.unbanUser(id, adminId);
            res.json(ApiResponse.success(result));
        } catch (error) {
            next(error);
        }
    }

    static async updateUserRole(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const { role } = req.body;
            const result = await AdminService.updateUserRole(id, role);

            res.json(ApiResponse.success(result, result.message));
        } catch (error) {
            next(error);
        }
    }

    static async updateModeratorPermissions(req: Request, res: Response, next: NextFunction) {
        try {
            const adminId = req.user!.id;
            const { id } = req.params;
            const { permissions, mode } = req.body;
            const result = await AdminService.updateModeratorPermissions(id, permissions, mode, adminId);
            res.json(ApiResponse.success(result, "Moderator permissions updated"));
        } catch (error) {
            next(error);
        }
    }

    // Professionals
    static async getAllProfessionals(req: Request, res: Response, next: NextFunction) {
        try {
            const { page = 1, limit = 20, status, search } = req.query;
            const result = await AdminService.getAllProfessionals({
                page: Number(page),
                limit: Number(limit),
                status: status as any,
                search: search as string,
            });
            res.json(ApiResponse.success(result));
        } catch (error) {
            next(error);
        }
    }

    static async getProfessionalDetails(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const pro = await AdminService.getProfessionalDetails(id);
            res.json(ApiResponse.success(pro));
        } catch (error) {
            next(error);
        }
    }

    static async getPendingProfessionals(req: Request, res: Response, next: NextFunction) {
        try {
            const page = Number(req.query.page || 1);
            const limit = Number(req.query.limit || 20);
            const result = await AdminService.getPendingProfessionals({ page, limit });
            res.json(ApiResponse.success(result));
        } catch (error) {
            next(error);
        }
    }

    static async getVerifiedProfessionals(req: Request, res: Response, next: NextFunction) {
        try {
            const page = Number(req.query.page || 1);
            const limit = Number(req.query.limit || 20);
            const result = await AdminService.getVerifiedProfessionals({ page, limit });
            res.json(ApiResponse.success(result));
        } catch (error) {
            next(error);
        }
    }

    static async verifyProfessional(req: Request, res: Response, next: NextFunction) {
        try {
            const adminId = req.user!.id;
            const { userId } = req.params;
            const { isVerified, category } = req.body;
            const result = await AdminService.verifyProfessional(userId, isVerified, adminId, category);
            res.json(ApiResponse.success(result));
        } catch (error) {
            next(error);
        }
    }

    static async approveProfessional(req: Request, res: Response, next: NextFunction) {
        try {
            const adminId = req.user!.id;
            const { userId } = req.params;
            const result = await AdminService.approveProfessional(userId, adminId);
            res.json(ApiResponse.success(result));
        } catch (error) {
            next(error);
        }
    }

    static async rejectProfessional(req: Request, res: Response, next: NextFunction) {
        try {
            const adminId = req.user!.id;
            const { userId } = req.params;
            const { reason } = req.body;
            const result = await AdminService.rejectProfessional(userId, reason, adminId);
            res.json(ApiResponse.success(result));
        } catch (error) {
            next(error);
        }
    }

    static async setCommissionRate(req: Request, res: Response, next: NextFunction) {
        try {
            const adminId = req.user!.id;
            const { userId } = req.params;
            const { platformCommission } = req.body;
            const result = await AdminService.setCommissionRate(userId, platformCommission, adminId);
            res.json(ApiResponse.success(result, "Commission rate updated"));
        } catch (error) {
            next(error);
        }
    }

    // Bookings
    static async getAllBookings(req: Request, res: Response, next: NextFunction) {
        try {
            const { page = 1, limit = 20, status, professionalId, userId } = req.query;
            const result = await AdminService.getAllBookings({
                page: Number(page),
                limit: Number(limit),
                status: status as any,
                professionalId: professionalId as string,
                userId: userId as string,
            });
            res.json(ApiResponse.success(result));
        } catch (error) {
            next(error);
        }
    }

    // Payments
    static async getAllPayments(req: Request, res: Response, next: NextFunction) {
        try {
            const { page = 1, limit = 20, status, method } = req.query;
            const result = await AdminService.getAllPayments({
                page: Number(page),
                limit: Number(limit),
                status: status as any,
                method: method as any,
            });
            res.json(ApiResponse.success(result));
        } catch (error) {
            next(error);
        }
    }

    // Withdraws
    static async getAllWithdrawRequests(req: Request, res: Response, next: NextFunction) {
        try {
            const { page = 1, limit = 20, status } = req.query;
            const result = await AdminService.getAllWithdrawRequests({
                page: Number(page),
                limit: Number(limit),
                status: status as string,
            });
            res.json(ApiResponse.success(result));
        } catch (error) {
            next(error);
        }
    }

    static async approveWithdraw(req: Request, res: Response, next: NextFunction) {
        try {
            const adminId = req.user!.id;
            const { id } = req.params;
            const result = await AdminService.approveWithdraw(id, adminId);
            res.json(ApiResponse.success(result, "Withdraw request approved"));
        } catch (error) {
            next(error);
        }
    }

    static async rejectWithdraw(req: Request, res: Response, next: NextFunction) {
        try {
            const adminId = req.user!.id;
            const { id } = req.params;
            const { reason } = req.body;
            const result = await AdminService.rejectWithdraw(id, reason, adminId);
            res.json(ApiResponse.success(result, "Withdraw request rejected"));
        } catch (error) {
            next(error);
        }
    }

    // Audit Logs
    static async getAuditLogs(req: Request, res: Response, next: NextFunction) {
        try {
            const { page = 1, limit = 20, action } = req.query;
            const logs = await AdminService.getAuditLogs({
                page: Number(page),
                limit: Number(limit),
                action: action as any,
            });
            res.json(ApiResponse.success(logs));
        } catch (error) {
            next(error);
        }
    }

    // Add Professional

    static async addDraftProfessional(req: Request, res: Response, next: NextFunction) {
        try {
            const adminId = req.user!.id;
            const result = await AdminService.addDraftProfessional(adminId, req.body);
            res.status(201).json(ApiResponse.success(result, "Draft professional created"));
        } catch (error) {
            next(error);
        }
    }

    static async verifyDraftProfessional(req: Request, res: Response, next: NextFunction) {
        try {
            const { email, otp } = req.body;
            const adminId = req.user?.id;
            const result = await AdminService.verifyDraftProfessional(email, otp, adminId);
            res.json(ApiResponse.success(result, "Professional activated"));
        } catch (error) {
            next(error);
        }
    }

    static async getDraftProfessionals(req: Request, res: Response, next: NextFunction) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const result = await AdminService.getDraftProfessionals({ page, limit });
            res.json(ApiResponse.success(result));
        } catch (error) {
            next(error);
        }
    }

    static async resendDraftOTP(req: Request, res: Response, next: NextFunction) {
        try {
            const { userId } = req.params;
            const adminId = req.user!.id;
            const result = await AdminService.resendDraftOTP(userId, adminId);
            res.json(ApiResponse.success(result, "OTP resent"));
        } catch (error) {
            next(error);
        }
    }
}
