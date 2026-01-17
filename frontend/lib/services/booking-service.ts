import { ApiResponse, Booking, BookingStatus } from '../types';
import { api } from './api';

export class BookingService {
    static async getAvailability(professionalId: string, date: string) {
        const response = await api.get<ApiResponse<string[]>>(`/bookings/availability?professionalId=${professionalId}&date=${date}`);
        return response.data;
    }

    static async createBooking(data: {
        professionalId: string;
        startTime: string;
        endTime: string;
        notes?: string;
    }) {
        const response = await api.post<ApiResponse<Booking>>('/bookings', data);
        return response.data;
    }


    // Get bookings where current user is the CLIENT
    static async getMyBookings(status?: BookingStatus) {
        const endpoint = status ? `/bookings/my?status=${status}` : '/bookings/my';
        const response = await api.get<ApiResponse<Booking[]>>(endpoint);
        return response.data;
    }

    // Get bookings where current user is the PROFESSIONAL
    static async getProfessionalBookings(status?: BookingStatus) {
        const endpoint = status ? `/bookings/professional?status=${status}` : '/bookings/professional';
        const response = await api.get<ApiResponse<Booking[]>>(endpoint);
        return response.data;
    }

    static async getBookingById(id: string) {
        const response = await api.get<ApiResponse<Booking>>(`/bookings/${id}`);
        return response.data;
    }

    static async cancelBooking(id: string, reason?: string) {
        const response = await api.patch<ApiResponse<Booking>>(`/bookings/${id}/cancel`, { reason });
        return response.data;
    }

    static async rescheduleBooking(id: string, startTime: string, endTime: string) {
        const response = await api.patch<ApiResponse<Booking>>(`/bookings/${id}/reschedule`, {
            startTime,
            endTime,
        });
        return response.data;
    }

    static async confirmBooking(id: string) {
        const response = await api.patch<ApiResponse<Booking>>(`/bookings/${id}/status`, { status: 'CONFIRMED' });
        return response.data;
    }

    static async completeBooking(id: string) {
        const response = await api.patch<ApiResponse<Booking>>(`/bookings/${id}/status`, { status: 'COMPLETED' });
        return response.data;
    }

    static async updateBookingStatus(id: string, status: BookingStatus) {
        const response = await api.patch<ApiResponse<Booking>>(`/bookings/${id}/status`, { status });
        return response.data;
    }
}
