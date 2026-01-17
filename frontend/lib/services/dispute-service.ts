import { ApiResponse } from '@/lib/types';
import { api } from './api';

export interface Dispute {
    id: string;
    bookingId?: string;
    userId: string;
    description: string;
    status: 'OPEN' | 'RESOLVED' | 'REJECTED';
    statusNote?: string;
    type?: string;
    metadata?: any;
    createdAt: string;
    updatedAt: string;
    booking?: {
        id: string;
        startTime: string;
        professional?: { name: string };
    };
}

export class DisputeService {
    static async createDispute(bookingId: string | null, description: string, requestedRefundAmount?: number, type: string = 'REFUND_REQUEST', metadata?: any) {
        const response = await api.post<ApiResponse<Dispute>>('/disputes', {
            bookingId,
            description,
            requestedRefundAmount,
            type,
            metadata
        });
        return response.data;
    }

    static async getMyDisputes() {
        const response = await api.get<ApiResponse<Dispute[]>>('/disputes/my');
        return response.data;
    }

    static async getDisputeDetails(disputeId: string) {
        const response = await api.get<ApiResponse<Dispute>>(`/disputes/${disputeId}`);
        return response.data;
    }
    static async getAllDisputes(status?: string) {
        const queryParams = status ? `?status=${status}` : '';
        const response = await api.get<ApiResponse<Dispute[]>>(`/disputes${queryParams}`);
        return response.data;
    }

    static async resolveDispute(disputeId: string, resolution: 'RESOLVED' | 'REJECTED', statusNote: string) {
        const response = await api.patch<ApiResponse<Dispute>>(`/disputes/${disputeId}/resolve`, {
            status: resolution,
            statusNote,
        });
        return response.data;
    }

    static async resolveRescheduleDispute(disputeId: string, approved: boolean) {
        const response = await api.post<ApiResponse<Dispute>>(`/disputes/${disputeId}/resolve-reschedule`, {
            approved
        });
        return response.data;
    }
}
