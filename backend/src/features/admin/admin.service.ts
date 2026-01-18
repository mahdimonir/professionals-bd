import bcrypt from "bcryptjs";
import prisma from "../../config/client.js";
import { emailService } from "../../services/email.service.js";

export class AdminService {
    // Users
    static async getAllUsers(params: { page: number; limit: number; role?: string; search?: string }) {
        const { page, limit, role, search } = params;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (role) where.role = role;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
            ];
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                select: { id: true, name: true, email: true, role: true, isVerified: true, createdAt: true },
            }),
            prisma.user.count({ where }),
        ]);

        return { users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }

    static async getUserDetails(userId: string) {
        return prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                moderatorPermissions: true,
                isVerified: true,
                phone: true,
                location: true,
                createdAt: true,
                lastLoginAt: true,
            },
        });
    }

    static async updateUserRole(userId: string, newRole: string) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true, moderatorPermissions: true },
        });

        if (!user) {
            throw new Error("User not found");
        }

        const ALL_MODERATOR_PERMISSIONS = [
            "users:view",
            "users:ban",
            "professionals:view",
            "professionals:verify",
            "bookings:view",
            "payments:view",
            "disputes:view",
            "disputes:resolve",
            "withdraws:view",
            "reviews:moderate",
        ];

        let permissionsToSet: string[] = user.moderatorPermissions;
        let requiresPermissionSetup = false;

        // If promoting to ADMIN, grant all permissions automatically
        if (newRole === "ADMIN" && user.role !== "ADMIN") {
            permissionsToSet = ALL_MODERATOR_PERMISSIONS;
        }

        // If promoting to MODERATOR, start with no permissions (admin must assign)
        if (newRole === "MODERATOR" && user.role !== "MODERATOR") {
            requiresPermissionSetup = true;
            permissionsToSet = [];
        }

        // If demoting from MODERATOR/ADMIN, clear permissions
        if ((user.role === "MODERATOR" || user.role === "ADMIN") &&
            (newRole === "USER" || newRole === "PROFESSIONAL")) {
            permissionsToSet = [];
        }

        const updated = await prisma.user.update({
            where: { id: userId },
            data: {
                role: newRole as any,
                moderatorPermissions: permissionsToSet,
            },
        });

        return {
            user: updated,
            requiresPermissionSetup,
            message: requiresPermissionSetup
                ? "User role updated to MODERATOR. Please assign specific permissions"
                : `User role updated to ${newRole}${newRole === "ADMIN" ? " with all permissions" : ""}.`,
        };
    }

    static async updateModeratorPermissions(
        userId: string,
        permissions: string | string[],
        mode: "set" | "add" | "remove",
        adminId: string
    ) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true, moderatorPermissions: true },
        });

        if (!user) {
            throw new Error("User not found");
        }

        if (user.role !== "MODERATOR") {
            throw new Error("User must be a moderator to assign permissions");
        }

        const ALL_MODERATOR_PERMISSIONS = [
            "users:view",
            "users:ban",
            "professionals:view",
            "professionals:verify",
            "bookings:view",
            "payments:view",
            "disputes:view",
            "disputes:resolve",
            "withdraws:view",
            "reviews:moderate",
        ];

        let newPermissions: string[] = [];

        if (mode === "set") {
            // Set permissions (replace existing)
            if (permissions === "all") {
                newPermissions = ALL_MODERATOR_PERMISSIONS;
            } else {
                newPermissions = Array.isArray(permissions) ? permissions : [permissions];
            }
        } else if (mode === "add") {
            // Add permissions to existing
            const toAdd = Array.isArray(permissions) ? permissions : [permissions];
            newPermissions = [...new Set([...user.moderatorPermissions, ...toAdd])];
        } else if (mode === "remove") {
            // Remove permissions from existing
            const toRemove = Array.isArray(permissions) ? permissions : [permissions];
            newPermissions = user.moderatorPermissions.filter((p) => !toRemove.includes(p));
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { moderatorPermissions: newPermissions },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: "USER_BAN", // We can extend the enum if needed
                performedBy: adminId,
                targetId: userId,
                details: {
                    action: "MODERATOR_PERMISSIONS_UPDATE",
                    mode,
                    permissions: newPermissions,
                },
            },
        });

        return updatedUser;
    }

    static async banUser(userId: string, reason: string, adminId: string) {
        const user = await prisma.user.update({
            where: { id: userId },
            data: { isVerified: false, role: "USER" }
        });

        await emailService.sendAccountStatusUpdate(user.email, user.name || "User", "BANNED", reason);

        await prisma.auditLog.create({
            data: {
                action: "USER_BAN",
                performedBy: adminId,
                targetId: userId,
                details: { reason },
            },
        });
        return { success: true, message: "User banned" };
    }

    static async unbanUser(userId: string, adminId: string) {
        const user = await prisma.user.update({
            where: { id: userId },
            data: { isVerified: true, role: "USER" }
        });

        await emailService.sendAccountStatusUpdate(user.email, user.name || "User", "ACTIVE", "Your account has been unbanned.");

        await prisma.auditLog.create({
            data: {
                action: "USER_UNBAN",
                performedBy: adminId,
                targetId: userId,
                details: { action: "UNBAN" },
            },
        });
        return { success: true, message: "User unbanned" };
    }

    // Professionals
    static async getAllProfessionals(params: { page: number; limit: number; status?: string; search?: string }) {
        const { page, limit, status, search } = params;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status) where.status = status;
        if (search) {
            where.user = {
                OR: [
                    { name: { contains: search, mode: "insensitive" } },
                    { email: { contains: search, mode: "insensitive" } },
                ],
            };
        }

        const [profiles, total] = await Promise.all([
            prisma.professionalProfile.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: { user: { select: { name: true, email: true } } },
            }),
            prisma.professionalProfile.count({ where }),
        ]);

        return { professionals: profiles, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }

    static async getPendingProfessionals(params: { page: number; limit: number }) {
        const { page, limit } = params;
        const skip = (page - 1) * limit;

        const [profiles, total] = await Promise.all([
            prisma.professionalProfile.findMany({
                where: { status: "PENDING" },
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: { user: { select: { name: true, email: true } } },
            }),
            prisma.professionalProfile.count({ where: { status: "PENDING" } }),
        ]);

        return { professionals: profiles, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }

    static async getVerifiedProfessionals(params: { page: number; limit: number }) {
        const { page, limit } = params;
        const skip = (page - 1) * limit;

        const [profiles, total] = await Promise.all([
            prisma.professionalProfile.findMany({
                where: { status: "VERIFIED" },
                skip,
                take: limit,
                orderBy: { verifiedAt: "desc" },
                include: { user: { select: { name: true, email: true } } },
            }),
            prisma.professionalProfile.count({ where: { status: "VERIFIED" } }),
        ]);

        return { professionals: profiles, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }

    static async getProfessionalDetails(userId: string) {
        return prisma.professionalProfile.findUnique({
            where: { userId },
            include: { user: { select: { name: true, email: true, role: true } } },
        });
    }

    // Stage 1: Moderator verifies professional (PENDING → VERIFIED or REJECTED)
    // Also handles re-verification of APPROVED professionals with pending changes
    static async verifyProfessional(
        userId: string,
        isVerified: boolean,
        moderatorId: string,
        category?: string
    ) {
        const profile = await prisma.professionalProfile.findUnique({
            where: { userId },
        });

        if (!profile) {
            throw new Error("Professional profile not found");
        }

        // Allow verification for PENDING status or APPROVED with pending changes
        const hasPendingChanges = profile.pendingChanges && Object.keys(profile.pendingChanges as object).length > 0;

        if (profile.status !== "PENDING" && !(profile.status === "APPROVED" && hasPendingChanges)) {
            throw new Error("Can only verify professionals with PENDING status or approved ones with pending changes");
        }

        // Prepare update data
        const updateData: any = {
            verifiedBy: moderatorId,
            verifiedAt: new Date(),
        };

        if (isVerified) {
            // If approving pending changes for an already-approved profile
            if (profile.status === "APPROVED" && hasPendingChanges) {
                // Apply pending changes to actual fields
                const pendingChanges = profile.pendingChanges as any;
                Object.assign(updateData, pendingChanges);
                updateData.pendingChanges = null; // Clear pending changes
                // Keep APPROVED status
            } else {
                // New professional verification
                updateData.status = "VERIFIED";
            }
        } else {
            // Rejected
            if (profile.status === "APPROVED" && hasPendingChanges) {
                // Reject pending changes but keep APPROVED status
                updateData.pendingChanges = null;
            } else {
                updateData.status = "REJECTED";
            }
        }

        // Add category if provided and verified
        if (isVerified && category) {
            updateData.category = category;
        }

        const updatedProfile = await prisma.professionalProfile.update({
            where: { userId },
            data: updateData,
            include: { user: true },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: hasPendingChanges ? "PRO_REVERT_CHANGES" : "PRO_VERIFY",
                performedBy: moderatorId,
                targetId: userId,
                details: {
                    isVerified,
                    status: updatedProfile.status,
                    hadPendingChanges: hasPendingChanges,
                    category: category || null
                },
            },
        });

        // Notify professional
        if (updatedProfile.user?.email) {
            await emailService.sendProfessionalStatusUpdate(
                updatedProfile.user.email,
                updatedProfile.user.name || "User",
                isVerified ? "VERIFIED" : "REJECTED",
                isVerified ? undefined : "Verification failed"
            );
        }

        return updatedProfile;
    }

    // Stage 2: Admin approves verified professional (VERIFIED → APPROVED)
    static async approveProfessional(userId: string, adminId: string) {
        const profile = await prisma.professionalProfile.findUnique({
            where: { userId },
        });

        if (!profile) {
            throw new Error("Professional profile not found");
        }

        if (profile.status !== "VERIFIED") {
            throw new Error("Can only approve professionals with VERIFIED status");
        }

        const updatedProfile = await prisma.professionalProfile.update({
            where: { userId },
            data: {
                status: "APPROVED",
                approvedBy: adminId,
                approvedAt: new Date(),
            },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: "PRO_APPROVE",
                performedBy: adminId,
                targetId: userId,
                details: { status: "APPROVED" },
            },
        });

        // Notify professional
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user?.email) {
            await emailService.sendProfessionalStatusUpdate(
                user.email,
                user.name || "User",
                "APPROVED"
            );
        }

        return updatedProfile;
    }

    static async rejectProfessional(userId: string, reason: string, performedBy: string) {
        const updatedProfile = await prisma.professionalProfile.update({
            where: { userId },
            data: {
                status: "REJECTED",
                rejectionReason: reason,
            },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: "PRO_REJECT",
                performedBy,
                targetId: userId,
                details: { reason, status: "REJECTED" },
            },
        });

        // Notify professional
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (user?.email) {
            await emailService.sendProfessionalStatusUpdate(
                user.email,
                user.name || "User",
                "REJECTED",
                reason
            );
        }

        return updatedProfile;
    }

    static async setCommissionRate(userId: string, platformCommission: number, adminId: string) {
        if (platformCommission < 0 || platformCommission > 100) {
            throw new Error("Commission rate must be between 0 and 100");
        }

        const updatedProfile = await prisma.professionalProfile.update({
            where: { userId },
            data: { platformCommission },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: "PRO_APPROVE", // We can extend the enum if needed
                performedBy: adminId,
                targetId: userId,
                details: {
                    action: "SET_COMMISSION",
                    platformCommission,
                },
            },
        });

        return updatedProfile;
    }

    // Bookings
    static async getAllBookings(params: {
        page: number;
        limit: number;
        status?: string;
        professionalId?: string;
        userId?: string;
    }) {
        const { page, limit, status, professionalId, userId } = params;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status) where.status = status;
        if (professionalId) where.professionalId = professionalId;
        if (userId) where.userId = userId;

        const [bookings, total] = await Promise.all([
            prisma.booking.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    user: { select: { name: true, email: true } },
                    professional: { select: { name: true, email: true } },
                },
            }),
            prisma.booking.count({ where }),
        ]);

        return { bookings, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }

    // Payments
    static async getAllPayments(params: { page: number; limit: number; status?: string; method?: string }) {
        const { page, limit, status, method } = params;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status) where.status = status;
        if (method) where.method = method;

        const [payments, total] = await Promise.all([
            prisma.payment.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    booking: {
                        include: {
                            user: { select: { name: true, email: true } },
                            professional: { select: { name: true, email: true } },
                        },
                    },
                },
            }),
            prisma.payment.count({ where }),
        ]);

        return { payments, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }

    // Withdraws
    static async getAllWithdrawRequests(params: { page: number; limit: number; status?: string }) {
        const { page, limit, status } = params;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (status) where.status = status;

        const [withdraws, total] = await Promise.all([
            prisma.withdrawRequest.findMany({
                where,
                skip,
                take: limit,
                orderBy: { requestedAt: "desc" },
                include: {
                    professional: { select: { name: true, email: true } },
                },
            }),
            prisma.withdrawRequest.count({ where }),
        ]);

        return { withdraws, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }

    static async approveWithdraw(withdrawId: string, adminId: string) {
        const withdraw = await prisma.withdrawRequest.findUnique({
            where: { id: withdrawId },
            include: { professional: true },
        });

        if (!withdraw) {
            throw new Error("Withdraw request not found");
        }

        if (withdraw.status !== "PENDING") {
            throw new Error("Can only approve pending withdraws");
        }

        // Update withdraw status
        await prisma.withdrawRequest.update({
            where: { id: withdrawId },
            data: {
                status: "PROCESSED",
                processedBy: adminId,
                processedAt: new Date(),
            },
        });

        // Update earnings
        await prisma.earnings.update({
            where: { professionalId: withdraw.professionalId },
            data: {
                pendingEarnings: { decrement: withdraw.amount },
                withdrawn: { increment: withdraw.amount },
            },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: "WITHDRAW_APPROVE",
                performedBy: adminId,
                targetId: withdrawId,
                details: {
                    amount: withdraw.amount,
                    professionalId: withdraw.professionalId,
                },
            },
        });

        if (withdraw.professional.email) {
            await emailService.sendWithdrawStatusUpdate(
                withdraw.professional.email,
                withdraw.professional.name || "Professional",
                withdraw.amount.toNumber(),
                "PROCESSED"
            );
        }

        return { success: true, message: "Withdraw approved" };
    }

    static async rejectWithdraw(withdrawId: string, reason: string, adminId: string) {
        const withdraw = await prisma.withdrawRequest.findUnique({
            where: { id: withdrawId },
        });

        if (!withdraw) {
            throw new Error("Withdraw request not found");
        }

        if (withdraw.status !== "PENDING") {
            throw new Error("Can only reject pending withdraws");
        }

        // Update withdraw status
        await prisma.withdrawRequest.update({
            where: { id: withdrawId },
            data: {
                status: "REJECTED",
                processedBy: adminId,
                processedAt: new Date(),
            },
        });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: "WITHDRAW_APPROVE", // Extend enum if needed
                performedBy: adminId,
                targetId: withdrawId,
                details: {
                    action: "REJECT",
                    reason,
                    amount: withdraw.amount,
                },
            },
        });

        // We need professional details for email
        const withdrawWithPro = await prisma.withdrawRequest.findUnique({
            where: { id: withdrawId },
            include: { professional: true }
        });

        if (withdrawWithPro?.professional.email) {
            await emailService.sendWithdrawStatusUpdate(
                withdrawWithPro.professional.email,
                withdrawWithPro.professional.name || "Professional",
                withdrawWithPro.amount.toNumber(),
                "REJECTED",
                reason
            );
        }

        return { success: true, message: "Withdraw rejected", reason };
    }

    // Audit Logs
    static async getAuditLogs(params: { page: number; limit: number; action?: string }) {
        const { page, limit, action } = params;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (action) where.action = action;

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: { performedByUser: { select: { name: true } } },
            }),
            prisma.auditLog.count({ where }),
        ]);

        return { logs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }

    // DRAFT PROFESSIONAL MANAGEMENT (Admin adds professionals directly)

    // Admin creates a draft professional (user + profile) and sends OTP for activation
    static async addDraftProfessional(adminId: string, data: {
        // User fields
        name: string;
        email: string;
        password: string;
        phone?: string;
        avatar?: string;
        location?: string;
        // Professional fields
        title: string;
        bio?: string;
        category: string;
        specialties: string[];
        sessionPrice: number;
        experience: number;
        languages: string[];
        linkedinUrl?: string;
        cvUrl?: string;
        education?: string[];
        certifications?: string[];
        platformCommission?: number;
    }) {

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
        if (existingUser) {
            throw new Error("Email already registered");
        }

        // Hash password
        const passwordHash = await bcrypt.hash(data.password, 12);

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otp, 10);

        // Create user (not verified yet)
        const user = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                passwordHash,
                phone: data.phone,
                avatar: data.avatar,
                bio: data.bio,
                location: data.location,
                role: "USER",
                isVerified: false,
            },
        });

        // Create professional profile as DRAFT
        const profile = await prisma.professionalProfile.create({
            data: {
                userId: user.id,
                title: data.title,
                bio: data.bio,
                category: data.category,
                specialties: data.specialties,
                sessionPrice: data.sessionPrice,
                experience: data.experience,
                languages: data.languages,
                linkedinUrl: data.linkedinUrl,
                cvUrl: data.cvUrl,
                education: data.education || [],
                certifications: data.certifications || [],
                platformCommission: data.platformCommission || 30,
                status: "DRAFT",
            },
        });

        // Create OTP record
        await prisma.oTP.upsert({
            where: { email_type: { email: data.email, type: "PROFESSIONAL_ACTIVATION" } },
            update: {
                codeHash: otpHash,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
                attempts: 0,
                resendCount: 0,
            },
            create: {
                email: data.email,
                type: "PROFESSIONAL_ACTIVATION",
                codeHash: otpHash,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            },
        });

        // Send OTP email
        try {
            await emailService.sendOTP(data.email, data.name, otp, "Activate Your Professional Account");
        } catch (err) {
            console.error("Failed to send OTP email:", err);
            // Continue anyway - admin can resend
        }

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: "PRO_DRAFT_CREATED",
                performedBy: adminId,
                targetId: user.id,
                details: { email: data.email, title: data.title, category: data.category },
            },
        });

        return {
            userId: user.id,
            email: data.email,
            status: "DRAFT",
            message: "Draft professional created. OTP sent to email for activation.",
            otp: process.env.NODE_ENV === "development" ? otp : undefined, // Only for dev testing
        };
    }

    // Verify OTP and activate draft professional → APPROVED
    static async verifyDraftProfessional(email: string, otp: string, adminId?: string) {

        const otpRecord = await prisma.oTP.findUnique({
            where: { email_type: { email, type: "PROFESSIONAL_ACTIVATION" } },
        });

        if (!otpRecord) {
            throw new Error("No pending activation found for this email");
        }

        if (otpRecord.attempts >= 5) {
            throw new Error("Too many failed attempts. Please request a new OTP.");
        }

        if (otpRecord.expiresAt < new Date()) {
            throw new Error("OTP expired. Please request a new one.");
        }

        const isValid = await bcrypt.compare(otp, otpRecord.codeHash);
        if (!isValid) {
            await prisma.oTP.update({
                where: { id: otpRecord.id },
                data: { attempts: { increment: 1 } },
            });
            throw new Error("Invalid OTP");
        }

        // Get user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            throw new Error("User not found");
        }

        // Update user to verified
        await prisma.user.update({
            where: { id: user.id },
            data: { isVerified: true },
        });

        // Update profile to APPROVED
        const profile = await prisma.professionalProfile.update({
            where: { userId: user.id },
            data: {
                status: "APPROVED",
                verifiedBy: adminId || "SELF",
                verifiedAt: new Date(),
                approvedBy: adminId || "SELF",
                approvedAt: new Date(),
            },
        });

        // Delete OTP
        await prisma.oTP.delete({ where: { id: otpRecord.id } });

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: "PRO_DRAFT_ACTIVATED",
                performedBy: adminId || user.id,
                targetId: user.id,
                details: { email, status: "APPROVED" },
            },
        });

        return {
            user: { id: user.id, name: user.name, email: user.email },
            profile,
            message: "Professional activated successfully!",
        };
    }

    /**
     * Get all draft professionals
     */
    static async getDraftProfessionals(params: { page: number; limit: number }) {
        const { page, limit } = params;
        const skip = (page - 1) * limit;

        const [drafts, total] = await Promise.all([
            prisma.professionalProfile.findMany({
                where: { status: "DRAFT" },
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    user: {
                        select: { id: true, name: true, email: true, phone: true, createdAt: true },
                    },
                },
            }),
            prisma.professionalProfile.count({ where: { status: "DRAFT" } }),
        ]);

        return { drafts, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
    }

    /**
     * Resend OTP for draft professional
     */
    static async resendDraftOTP(userId: string, adminId: string) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new Error("User not found");
        }

        const profile = await prisma.professionalProfile.findUnique({ where: { userId } });
        if (!profile || profile.status !== "DRAFT") {
            throw new Error("Professional is not in DRAFT status");
        }

        // Generate new OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = await bcrypt.hash(otp, 10);

        // Upsert OTP
        await prisma.oTP.upsert({
            where: { email_type: { email: user.email, type: "PROFESSIONAL_ACTIVATION" } },
            update: {
                codeHash: otpHash,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000),
                attempts: 0,
                resendCount: { increment: 1 },
            },
            create: {
                email: user.email,
                type: "PROFESSIONAL_ACTIVATION",
                codeHash: otpHash,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000),
            },
        });

        // Send email
        try {
            await emailService.sendOTP(user.email, user.name || "Professional", otp, "Activate Your Professional Account");
        } catch (err) {
            console.error("Failed to send OTP email:", err);
        }

        return {
            message: "OTP resent successfully",
            email: user.email,
            otp: process.env.NODE_ENV === "development" ? otp : undefined,
        };
    }
}
