import { ApiResponse } from '../types';
import { api } from './api';

interface MeetingTokenResponse {
    token: string;
    callId: string;
    callType: string;
    userId?: string;
    user?: {
        id: string;
        name: string;
    };
}

export class MeetingService {
    // Create meeting room for a booking (PROFESSIONAL only)
    static async createMeeting(bookingId: string) {
        const response = await api.post<ApiResponse<any>>('/meetings', { bookingId });
        return response.data;
    }

    // Create ad-hoc meeting (ADMIN/MODERATOR only)
    static async createAdHocMeeting(title?: string) {
        const response = await api.post<ApiResponse<{ callId: string; callType: string }>>('/meetings/adhoc', {
            title: title || 'Ad-hoc Meeting',
        });
        return response.data;
    }

    // Get join token for booking participant
    static async getJoinToken(bookingId: string) {
        const response = await api.get<ApiResponse<MeetingTokenResponse>>(`/meetings/${bookingId}/token`);
        return response.data;
    }

    // Get ad-hoc meeting join token (for logged-in users)
    static async getAdHocJoinToken(callId: string) {
        const response = await api.get<ApiResponse<MeetingTokenResponse & { userId?: string }>>(`/meetings/adhoc/${callId}/token`);
        return response.data;
    }

    // Get guest token for ad-hoc meeting (no auth required)
    static async getGuestToken(callId: string, guestName: string) {
        const response = await api.post<ApiResponse<MeetingTokenResponse>>(`/meetings/adhoc/${callId}/guest-token`, {
            guestName,
        });
        return response.data;
    }

    // Start recording for a call
    static async startRecording(callId: string) {
        const response = await api.post<ApiResponse<{ success: boolean }>>(`/meetings/${callId}/recording/start`, {});
        return response.data;
    }

    // Stop recording for a call
    static async stopRecording(callId: string) {
        const response = await api.post<ApiResponse<{ success: boolean }>>(`/meetings/${callId}/recording/stop`, {});
        return response.data;
    }
}
