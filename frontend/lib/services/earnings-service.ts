import { ApiResponse } from '@/lib/types';
import { api } from './api';
import { PaymentMethod } from './payment-service';

export interface Earnings {
    id: string;
    professionalId: string;
    totalEarnings: number;
    pendingEarnings: number;
    withdrawn: number;
    updatedAt: string;
}

export interface WithdrawRequest {
    id: string;
    professionalId: string;
    amount: number;
    method: PaymentMethod;
    status: string;
    requestedAt: string;
    processedAt?: string;
    processedBy?: string;
}

export class EarningsService {
    static async getEarnings() {
        const response = await api.get<ApiResponse<Earnings>>('/earnings');
        return response.data;
    }

    static async requestWithdraw(amount: number, method: PaymentMethod) {
        const response = await api.post<ApiResponse<WithdrawRequest>>('/earnings/withdraw', {
            amount,
            method,
        });
        return response.data;
    }

    static async getWithdrawHistory() {
        const response = await api.get<ApiResponse<WithdrawRequest[]>>('/earnings/withdraw/history');
        return response.data;
    }
}
