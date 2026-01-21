import { ApiResponse, ProfessionalProfile } from '@/lib/types';
import { api } from './api';

export class ProfessionalService {
    // Get all professionals with optional filters (Approved only)
    static async getProfessionals(params?: {
        page?: number;
        limit?: number;
        category?: string;
        search?: string;
    }) {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.category) queryParams.append('category', params.category);
        if (params?.search) queryParams.append('q', params.search);

        const queryString = queryParams.toString();
        const endpoint = queryString ? `/professionals?${queryString}` : '/professionals';

        const response = await api.get<ApiResponse<{ professionals: ProfessionalProfile[]; pagination: any }>>(endpoint);
        return response.data.data;
    }

    // Get single professional by ID (public)
    static async getProfessionalById(id: string) {
        const response = await api.get<ApiResponse<ProfessionalProfile>>(`/professionals/${id}`);
        return response.data;
    }

    // Submit Application
    static async submitApplication(data: {
        title: string;
        bio?: string;
        category?: string;
        specialties: string[];
        sessionPrice: number;
        experience: number;
        languages: string[];
        linkedinUrl?: string;
        cvUrl?: string;
        education?: { name: string; doc?: string }[];
        certifications?: { name: string; doc?: string }[];
        availability?: any;
    }) {
        const response = await api.post<ApiResponse<ProfessionalProfile>>('/professionals/apply', data);
        return response.data;
    }

    // Update Profile
    static async updateProfile(data: Partial<ProfessionalProfile>) {
        const response = await api.patch<ApiResponse<ProfessionalProfile>>('/professionals/me', data);
        return response.data;
    }

    // Earnings & Withdrawals
    static async getEarnings() {
        const response = await api.get<ApiResponse<{ totalEarnings: string | number; pendingEarnings: string | number; withdrawn: string | number; currency?: string }>>('/earnings');
        return response.data;
    }

    static async requestWithdraw(amount: number, method: string, accountDetails: any) {
        const response = await api.post<ApiResponse<any>>('/earnings/withdraw', { amount, method, accountDetails });
        return response.data;
    }

    static async getWithdrawHistory() {
        const response = await api.get<ApiResponse<any[]>>('/earnings/withdraw/history');
        return response.data;
    }
}
