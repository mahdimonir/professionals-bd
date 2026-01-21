import { ApiResponse, User } from '@/lib/types';
import { api } from './api';
import { PaymentMethod } from './payment-service';

export interface AdminUser extends User {
    createdAt: string;
}

export interface AdminProfessional {
    id: string;
    userId: string;
    title?: string;
    status: string;
    experience?: number;
    sessionPrice?: number;
    bio?: string;
    category?: string;
    specialties?: string[];
    languages?: string[];
    linkedinUrl?: string;
    cvUrl?: string;
    education?: string[];
    certifications?: string[];
    createdAt: string;
    verifiedBy?: string;
    verifiedAt?: string;
    approvedBy?: string;
    approvedAt?: string;
    rejectionReason?: string;
    user?: {
        name: string;
        email: string;
        avatar?: string;
    };
}

export interface AdminBooking {
    id: string;
    userId: string;
    professionalId: string;
    startTime: string;
    endTime: string;
    status: string;
    price?: number;
    createdAt: string;
}

export interface AdminPayment {
    id: string;
    bookingId: string;
    amount: number;
    method: PaymentMethod;
    status: string;
    createdAt: string;
}

export interface AdminWithdrawRequest {
    id: string;
    professionalId: string;
    amount: number;
    method: PaymentMethod;
    status: string;
    requestedAt: string;
}

export interface AdminDispute {
    id: string;
    userId: string;
    bookingId?: string;
    description: string;
    status: string;
    type: string;
}

export interface AuditLog {
    id: string;
    action: string;
    performedBy: string;
    targetId?: string;
    details?: any;
    createdAt: string;
    performedByUser?: {
        name: string;
    };
}

export class AdminService {

    static async getAllUsers(params?: { page?: number; limit?: number; role?: string; search?: string }) {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.role) queryParams.append('role', params.role);
        if (params?.search) queryParams.append('search', params.search);

        const response = await api.get<ApiResponse<{ users: AdminUser[]; pagination: any }>>(
            `/admin/users?${queryParams.toString()}`
        );
        return response.data;
    }

    static async getUserDetails(userId: string) {
        const response = await api.get<ApiResponse<AdminUser>>(`/admin/users/${userId}`);
        return response.data;
    }

    static async banUser(userId: string, reason: string) {
        const response = await api.patch<ApiResponse<{ success: boolean }>>(`/admin/users/${userId}/ban`, {
            reason,
        });
        return response.data;
    }

    static async unbanUser(userId: string) {
        const response = await api.patch<ApiResponse<{ success: boolean }>>(`/admin/users/${userId}/unban`);
        return response.data;
    }

    static async updateUserRoleByAdmin(userId: string, role: string) {
        const response = await api.patch<ApiResponse<User>>(`/admin/users/${userId}/role`, { role });
        return response.data;
    }

    static async updateModeratorPermissionsByAdmin(userId: string, permissions: string[]) {
        const response = await api.patch<ApiResponse<User>>(`/admin/users/${userId}/permissions`, { permissions });
        return response.data;
    }

    static async getAllProfessionals(params?: {
        page?: number;
        limit?: number;
        status?: string;
        search?: string;
    }) {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.status) queryParams.append('status', params.status);
        if (params?.search) queryParams.append('search', params.search);

        const response = await api.get<ApiResponse<{ professionals: AdminProfessional[]; pagination: any }>>(
            `/admin/professionals?${queryParams.toString()}`
        );
        return response.data;
    }

    static async getProfessionalDetails(professionalId: string) {
        const response = await api.get<ApiResponse<AdminProfessional>>(`/admin/professionals/${professionalId}`);
        return response.data;
    }

    static async getPendingProfessionals() {
        const response = await api.get<ApiResponse<{ professionals: AdminProfessional[]; pagination: any }>>(
            `/admin/professionals/pending`
        );
        return response.data;
    }

    static async getVerifiedProfessionals() {
        const response = await api.get<ApiResponse<{ professionals: AdminProfessional[]; pagination: any }>>(
            `/admin/professionals/verified`
        );
        return response.data;
    }

    static async verifyProfessional(userId: string, isVerified: boolean, category: string) {
        const response = await api.patch<ApiResponse<{ success: boolean }>>(
            `/admin/professionals/${userId}/verify`,
            { isVerified, category }
        );
        return response.data;
    }
    static async rejectUnverifiedProfessional(userId: string, reason: string) {
        const response = await api.patch<ApiResponse<{ success: boolean }>>(
            `/admin/professionals/${userId}/reject-unverified`,
            { reason }
        );
        return response.data;
    }

    static async approveProfessionalByAdmin(userId: string) {
        const response = await api.patch<ApiResponse<{ success: boolean }>>(
            `/admin/professionals/${userId}/approve`
        );
        return response.data;
    }
    static async rejectProfessionalByAdmin(userId: string, reason: string) {
        const response = await api.patch<ApiResponse<{ success: boolean }>>(
            `/admin/professionals/${userId}/reject`,
            { reason }
        );
        return response.data;
    }

    static async setCommissionRateByAdmin(userId: string, commissionRate: number) {
        const response = await api.patch<ApiResponse<{ success: boolean }>>(
            `/admin/professionals/${userId}/commission`,
            { commissionRate }
        );
        return response.data;
    }

    static async getAllBookings(params?: {
        page?: number;
        limit?: number;
        status?: string;
        professionalId?: string;
        userId?: string;
    }) {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.status) queryParams.append('status', params.status);
        if (params?.professionalId) queryParams.append('professionalId', params.professionalId);
        if (params?.userId) queryParams.append('userId', params.userId);

        const response = await api.get<ApiResponse<{ bookings: AdminBooking[]; pagination: any }>>(
            `/admin/bookings?${queryParams.toString()}`
        );
        return response.data;
    }

    static async getAllPayments(params?: { page?: number; limit?: number; status?: string; method?: string }) {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.status) queryParams.append('status', params.status);
        if (params?.method) queryParams.append('method', params.method);

        const response = await api.get<ApiResponse<{ payments: AdminPayment[]; pagination: any }>>(
            `/admin/payments?${queryParams.toString()}`
        );
        return response.data;
    }

    static async getAllWithdrawRequests(params?: { page?: number; limit?: number; status?: string }) {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.status) queryParams.append('status', params.status);

        const response = await api.get<ApiResponse<{ withdraws: AdminWithdrawRequest[]; pagination: any }>>(
            `/admin/withdraws?${queryParams.toString()}`
        );
        return response.data;
    }

    static async approveWithdrawByAdmin(withdrawId: string) {
        const response = await api.patch<ApiResponse<{ success: boolean }>>(
            `/admin/withdraws/${withdrawId}/approve`
        );
        return response.data;
    }

    static async rejectWithdrawByAdmin(withdrawId: string, reason: string) {
        const response = await api.patch<ApiResponse<{ success: boolean }>>(
            `/admin/withdraws/${withdrawId}/reject`,
            { reason }
        );
        return response.data;
    }

    static async getAvailableReports() {
        const response = await api.get<ApiResponse<{ reports: { type: string; name: string; description: string }[]; formats: string[] }>>('/reports/available');
        return response.data;
    }

    static async getReportPreview(type: string, startDate?: string, endDate?: string) {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const response = await api.get<ApiResponse<any>>(`/reports/${type}/preview?${params.toString()}`);
        return response.data;
    }

    static async downloadReport(type: string, format: 'pdf' | 'excel' | 'json' = 'pdf', startDate?: string, endDate?: string) {
        const params = new URLSearchParams();
        params.append('format', format);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const response = await api.get(`/reports/${type}/download?${params.toString()}`, {
            responseType: 'blob'
        });
        const blob = new Blob([response.data], {
            type: format === 'pdf' ? 'application/pdf'
                : format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    : 'application/json'
        });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${type}-report.${format === 'excel' ? 'xlsx' : format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }

    static async getRevenueReportByAdmin(startDate?: string, endDate?: string) {
        return this.getReportPreview('revenue', startDate, endDate);
    }
    static async getUserReportByAdmin(startDate?: string, endDate?: string) {
        return this.getReportPreview('users', startDate, endDate);
    }
    static async getBookingReportByAdmin(startDate?: string, endDate?: string) {
        return this.getReportPreview('bookings', startDate, endDate);
    }
    static async getProfessionalReportByAdmin(startDate?: string, endDate?: string) {
        return this.getReportPreview('professionals', startDate, endDate);
    }
    static async getPaymentReportByAdmin(startDate?: string, endDate?: string) {
        return this.getReportPreview('payments', startDate, endDate);
    }
    static async getDisputeReportByAdmin(startDate?: string, endDate?: string) {
        return this.getReportPreview('disputes', startDate, endDate);
    }
    static async getWithdrawReportByAdmin(startDate?: string, endDate?: string) {
        return this.getReportPreview('withdrawals', startDate, endDate);
    }
    static async getEarningsReportByAdmin() {
        return this.getReportPreview('my-earnings');
    }

    static async getAuditLogsByAdmin(params?: { page?: number; limit?: number; action?: string }) {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.action) queryParams.append('action', params.action);

        const response = await api.get<ApiResponse<{ logs: AuditLog[]; pagination: any }>>(
            `/admin/audit-logs?${queryParams.toString()}`
        );
        return response.data;
    }

    static async addDraftProfessional(data: {
        name: string;
        email: string;
        password: string;
        phone?: string;
        avatar?: string;
        bio?: string;
        location?: string;
        title: string;
        category: string;
        specialties: string[];
        sessionPrice: number;
        experience: number;
        languages: string[];
        linkedinUrl?: string;
        cvUrl?: string;
        certifications?: string[];
        platformCommission?: number;
    }): Promise<ApiResponse<{ userId: string; email: string; status: string; message: string; otp?: string }>> {
        const response = await api.post<ApiResponse<{ userId: string; email: string; status: string; message: string; otp?: string }>>(
            '/admin/professionals/add-draft',
            data
        );
        return response.data;
    }

    static async verifyDraftProfessional(email: string, otp: string): Promise<ApiResponse<{ user: any; profile: any; message: string }>> {
        const response = await api.post<ApiResponse<{ user: any; profile: any; message: string }>>(
            '/admin/professionals/verify-draft',
            { email, otp }
        );
        return response.data;
    }

    static async getDraftProfessionals(params?: { page?: number; limit?: number }): Promise<ApiResponse<{ drafts: AdminProfessional[]; pagination: any }>> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());

        const response = await api.get<ApiResponse<{ drafts: AdminProfessional[]; pagination: any }>>(
            `/admin/professionals/drafts?${queryParams.toString()}`
        );
        return response.data;
    }

    static async resendDraftOTP(userId: string): Promise<ApiResponse<{ message: string; email: string; otp?: string }>> {
        const response = await api.post<ApiResponse<{ message: string; email: string; otp?: string }>>(
            `/admin/professionals/${userId}/resend-otp`
        );
        return response.data;
    }
}
