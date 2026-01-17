import prisma from "../../config/client.js";
import { ApiError } from "../../utils/apiError.js";

export class ReviewService {
  static async submitReview(userId: string, bookingId: string, rating: number, comment?: string) {
    // Verify booking exists and belongs to user
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { review: true },
    });

    if (!booking) {
      throw ApiError.notFound("Booking not found");
    }

    if (booking.userId !== userId) {
      throw ApiError.forbidden("You can only review your own bookings");
    }

    if (booking.status !== "COMPLETED") {
      throw ApiError.badRequest("You can only review completed bookings");
    }

    if (booking.review) {
      throw ApiError.badRequest("Review already exists for this booking");
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        bookingId,
        rating,
        comment,
      },
      include: {
        booking: {
          include: {
            professional: {
              select: { id: true, name: true, avatar: true },
            },
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
    });

    // Update professional's average rating (optional - could be calculated on-the-fly)
    const reviews = await prisma.review.findMany({
      where: {
        booking: {
          professionalId: booking.professionalId,
        },
      },
    });

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    // If you have a Professional model with averageRating field, update it here
    // await prisma.professional.update({
    //     where: { id: booking.professionalId },
    //     data: { averageRating: avgRating },
    // });

    return review;
  }

  static async getProfessionalReviews(professionalId: string) {
    const reviews = await prisma.review.findMany({
      where: {
        booking: {
          professionalId,
        },
      },
      include: {
        booking: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    return {
      reviews,
      averageRating: avgRating,
      totalReviews: reviews.length,
    };
  }

  static async getUserReviews(userId: string) {
    return prisma.review.findMany({
      where: {
        booking: {
          userId,
        },
      },
      include: {
        booking: {
          include: {
            professional: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async getReview(reviewId: string) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        booking: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
            professional: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
    });

    if (!review) {
      throw ApiError.notFound("Review not found");
    }

    return review;
  }

  static async getBestReviews() {
    return prisma.review.findMany({
      where: {
        rating: { gte: 4 },
      },
      include: {
        booking: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
            professional: { select: { id: true, name: true, avatar: true } },
          },
        },
      },
      orderBy: { rating: "desc" },
      take: 10,
    });
  }

  static async deleteReview(reviewId: string, userId: string) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { booking: true },
    });

    if (!review) {
      throw ApiError.notFound("Review not found");
    }

    if (review.booking.userId !== userId) {
      throw ApiError.forbidden("You can only delete your own reviews");
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    return { success: true };
  }

  static async updateReview(reviewId: string, userId: string, rating: number, comment?: string) {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { booking: true },
    });

    if (!review) {
      throw ApiError.notFound("Review not found");
    }

    if (review.booking.userId !== userId) {
      throw ApiError.forbidden("You can only update your own reviews");
    }

    return prisma.review.update({
      where: { id: reviewId },
      data: {
        rating,
        comment,
      },
      include: {
        booking: {
          include: {
            professional: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
    });
  }
}