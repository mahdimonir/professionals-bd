import { ApiResponse, User } from '@/lib/types';
import { api } from './api';

export class UserService {
    static async getProfile() {
        const response = await api.get<ApiResponse<{ user: User }>>('/users/me');
        return response.data;
    }

    static async updateProfile(data: {
        name?: string;
        phone?: string;
        bio?: string;
        location?: string;
        avatar?: string;
    }) {
        const response = await api.patch<ApiResponse<User>>('/users/me', data);
        return response.data;
    }

    static async searchUsers(query: string, params?: { role?: string; page?: number; limit?: number }) {
        const queryParams = new URLSearchParams();
        queryParams.append('q', query);
        if (params?.role) queryParams.append('role', params.role);
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());

        const response = await api.get<ApiResponse<{ users: User[]; pagination: any }>>(
            `/users/search?${queryParams.toString()}`
        );
        return response.data;
    }
}
