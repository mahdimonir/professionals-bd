import { parseISO } from "date-fns";
import prisma from "../../config/client.js";
import { emailService } from "../../services/email.service.js";
import { ApiError } from "../../utils/apiError.js";

export class BookingService {
  static async createBooking(userId: string, data: {
    professionalId: string;
    startTime: string;
    endTime: string;
    notes?: string;
  }) {
    const { professionalId, startTime, endTime, notes } = data;

    const start = parseISO(startTime);
    const end = parseISO(endTime);

    if (end <= start) throw ApiError.badRequest("End time must be after start time");
    if (end.getTime() - start.getTime() < 15 * 60 * 1000) {
      throw ApiError.badRequest("Minimum booking duration is 15 minutes");
    }

    // Check professional profile exists
    const professional = await prisma.professionalProfile.findUnique({
      where: { userId: professionalId },
      select: { rates: true, availability: true },
    });

    if (!professional) throw ApiError.notFound("Professional not found");

    // Check availability conflict
    const conflicting = await prisma.booking.findFirst({
      where: {
        professionalId,
        status: { not: "CANCELLED" },
        OR: [
          {
            startTime: { lt: end },
            endTime: { gt: start },
          },
        ],
      },
    });

    if (conflicting) throw ApiError.conflict("This time slot is already booked");

    const price = Number(professional.rates) * ((end.getTime() - start.getTime()) / (60 * 60 * 1000)); // Hourly rate

    const booking = await prisma.booking.create({
      data: {
        userId,
        professionalId,
        startTime: start,
        endTime: end,
        notes,
        price,
        status: "PENDING",
      },
      include: {
        user: { select: { name: true, email: true } },
        professional: { select: { name: true, email: true } },
      },
    });

    // Send emails (async, no await to not block)
    emailService.sendBookingConfirmation(
      booking.user.email,
      booking.user.name || "User",
      booking.professional.name || "Professional",
      booking.id,
      start.toISOString(),
      end.toISOString(),
      price,
      "PENDING"
    ).catch(() => {});

    return booking;
  }

  static async getUserBookings(userId: string, status?: string) {
    const where: any = {
      OR: [
        { userId },
        { professionalId: userId },
      ],
    };

    if (status) where.status = status.toUpperCase();

    return prisma.booking.findMany({
      where,
      orderBy: { startTime: "desc" },
      include: {
        user: { select: { name: true, email: true, avatar: true } },
        professional: {
          select: {
            name: true,
            email: true,
            avatar: true,
            professionalProfile: {
              select: {
                specialties: true,
                rates: true,
              },
            },
          },
        },
      },
    });
  }

  static async getBookingById(bookingId: string, userId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: { select: { name: true, email: true } },
        professional: {
          select: { name: true, email: true },
        },
      },
    });

    if (!booking) throw ApiError.notFound("Booking not found");

    // User can only access own bookings
    if (booking.userId !== userId && booking.professionalId !== userId) {
      throw ApiError.forbidden("Access denied");
    }

    return booking;
  }

  static async cancelBooking(bookingId: string, userId: string, reason: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw ApiError.notFound("Booking not found");

    if (booking.userId !== userId && booking.professionalId !== userId) {
      throw ApiError.forbidden("You can only cancel your own bookings");
    }

    if (booking.status === "CANCELLED") {
      throw ApiError.badRequest("Booking already cancelled");
    }

    if (booking.status === "COMPLETED") {
      throw ApiError.badRequest("Cannot cancel completed booking");
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "CANCELLED",
        cancellationReason: reason,
        cancelledBy: userId,
      },
      include: {
        user: true,
        professional: true,
      },
    });

    // Notify both parties
    emailService.sendBookingStatusUpdate(
      updated.user.email,
      updated.user.name || "User",
      updated.professional.name || "Professional",
      updated.id,
      "CANCELLED",
      reason
    ).catch(() => {});

    return updated;
  }

  static async updateStatus(bookingId: string, status: "CONFIRMED" | "COMPLETED", userId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw ApiError.notFound("Booking not found");

    // Only professional or admin can confirm/complete
    if (booking.professionalId !== userId) {
      throw ApiError.forbidden("Only the professional can update this status");
    }

    return prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    });
  }
}