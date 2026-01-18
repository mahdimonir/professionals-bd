import { ApiResponse, AuthResponse } from '../types';
import { api } from './api';

export const authService = {
    async register(data: { name: string; email: string; password: string; phone: string }) {
        const response = await api.post<ApiResponse<any>>('/auth/register', data);
        return response.data;
    },

    async verify(data: { email: string; otp: string }) {
        const response = await api.post<ApiResponse<AuthResponse>>('/auth/register/verify', data);
        if (response.data.success) {
            this.saveSession(response.data.data);
        }
        return response.data;
    },

    async login(data: { email: string; password: string }) {
        const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
        if (response.data.success) {
            this.saveSession(response.data.data);
        }
        return response.data;
    },

    async logout() {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                await api.post('/auth/logout', { refreshToken });
            }
        } finally {
            this.clearSession();
        }
    },

    async getProfile() {
        const response = await api.get<ApiResponse<any>>('/users/me');
        if (response.data.success) {
            const currentUser = this.getSession();
            if (currentUser) {
                const userData = response.data.data.user || response.data.data;
                this.saveUser(userData);
            }
        }
        return response.data;
    },

    async updateProfile(data: any) {
        const response = await api.patch<ApiResponse<any>>('/users/me', data);
        if (response.data.success) {
            const currentUser = this.getSession();
            if (currentUser) {
                const updatedUser = { ...currentUser, ...data };
                this.saveUser(updatedUser);
            }
        }
        return response.data;
    },

    async updateProfessionalProfile(data: any) {
        const response = await api.patch<ApiResponse<any>>('/professionals/me', data);
        return response.data;
    },

    saveSession(data: AuthResponse) {
        if (typeof window === 'undefined') return;
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        this.saveUser(data.user);
    },

    saveUser(user: any) {
        if (typeof window === 'undefined' || !user) return;
        try {
            localStorage.setItem('probd_user', JSON.stringify(user));
        } catch (e) {
            console.error('Failed to save user session', e);
        }
    },

    clearSession() {
        if (typeof window === 'undefined') return;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('probd_user');
    },

    getSession() {
        if (typeof window === 'undefined') return null;
        try {
            const userStr = localStorage.getItem('probd_user');
            if (!userStr || userStr === 'undefined' || userStr === 'null') {
                return null;
            }
            return JSON.parse(userStr);
        } catch (error) {
            console.error('Error parsing session:', error);
            localStorage.removeItem('probd_user');
            return null;
        }
    },

    async changeEmailRequest(data: { currentPassword: string; newEmail: string }) {
        const response = await api.post<ApiResponse<any>>('/auth/change-email/request', data);
        return response.data;
    },

    async changeEmailVerify(data: { newEmail: string; otp: string }) {
        const response = await api.post<ApiResponse<any>>('/auth/change-email/verify', data);
        return response.data;
    },

    async changePassword(data: { currentPassword: string; newPassword: string }) {
        const response = await api.post<ApiResponse<any>>('/auth/change-password', data);
        return response.data;
    },
};
