import { ApiResponse } from '@/lib/types';
import { api } from './api';

export interface Review {
    id: string;
    bookingId: string;
    rating: number;
    comment?: string;
    createdAt: string;
    booking?: {
        id: string;
        professional?: {
            id: string;
            name: string;
            avatar?: string;
        };
        user?: {
            id: string;
            name: string;
            avatar?: string;
        };
    };
}

export interface ProfessionalReviewsResponse {
    reviews: Review[];
    averageRating: number;
    totalReviews: number;
}

export class ReviewService {
    // Submit a review for a completed booking
    static async submitReview(bookingId: string, rating: number, comment?: string) {
        try {
            const response = await api.post<ApiResponse<Review>>('/reviews', {
                bookingId,
                rating,
                comment,
            });
            return response.data;
        } catch (error: any) {
            console.error('ReviewService.submitReview failed:', error);
            throw error;
        }
    }

    // Get all reviews for a specific professional
    static async getProfessionalReviews(professionalId: string) {
        try {
            const response = await api.get<ApiResponse<ProfessionalReviewsResponse>>(
                `/reviews/professional/${professionalId}`
            );
            return response.data;
        } catch (error: any) {
            console.error('ReviewService.getProfessionalReviews failed:', error);
            throw error;
        }
    }

    // Get a specific review
    static async getReview(reviewId: string) {
        try {
            const response = await api.get<ApiResponse<Review>>(`/reviews/${reviewId}`);
            return response.data;
        } catch (error: any) {
            console.error('ReviewService.getReview failed:', error);
            throw error;
        }
    }

    // Get Featured reviews
    static async getBestReviews() {
        try {
            const response = await api.get<ApiResponse<Review[]>>('/reviews/best');
            return response.data;
        } catch (error: any) {
            console.error('ReviewService.getBestReviews failed:', error);
            throw error;
        }
    }

    // Get all reviews submitted by the current user
    static async getMyReviews() {
        try {
            const response = await api.get<ApiResponse<Review[]>>('/reviews/my-reviews');
            return response.data;
        } catch (error: any) {
            console.error('ReviewService.getMyReviews failed:', error);
            throw error;
        }
    }

    // Update an existing review
    static async updateReview(reviewId: string, rating: number, comment?: string) {
        try {
            const response = await api.patch<ApiResponse<Review>>(`/reviews/${reviewId}`, {
                rating,
                comment,
            });
            return response.data;
        } catch (error: any) {
            console.error('ReviewService.updateReview failed:', error);
            throw error;
        }
    }

    // Delete a review
    static async deleteReview(reviewId: string) {
        try {
            const response = await api.delete<ApiResponse<{ success: boolean }>>(`/reviews/${reviewId}`);
            return response.data;
        } catch (error: any) {
            console.error('ReviewService.deleteReview failed:', error);
            throw error;
        }
    }
}
