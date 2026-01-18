import { parseISO } from "date-fns";
import { fromZonedTime } from 'date-fns-tz';
import prisma from "../../config/client.js";
import { emailService } from "../../services/email.service.js";
import { ApiError } from "../../utils/apiError.js";
import logger from "../../utils/logger.js";

export class BookingService {
  static async createBooking(userId: string, data: {
    professionalId: string;
    startTime: string;
    endTime?: string;
    notes?: string;
  }) {
    const { professionalId, startTime, notes } = data;
    const start = parseISO(startTime);
    const end = data.endTime ? parseISO(data.endTime) : new Date(start.getTime() + 60 * 60 * 1000);

    if (end <= start) throw ApiError.badRequest("End time must be after start time");
    if (end.getTime() - start.getTime() < 15 * 60 * 1000) {
      throw ApiError.badRequest("Minimum booking duration is 15 minutes");
    }

    const professional = await prisma.professionalProfile.findUnique({
      where: { userId: professionalId },
      select: { sessionPrice: true, availability: true },
    });

    if (!professional) throw ApiError.notFound("Professional not found");
    if (professional.availability) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayName = days[start.getDay()];
      const schedule = (professional.availability as any)[dayName];

      if (!schedule || !schedule.enabled || !schedule.slots || schedule.slots.length === 0) {
        throw ApiError.badRequest(`Professional is not available on ${dayName}`);
      }

      const bookingStartMinutes = start.getHours() * 60 + start.getMinutes();
      const bookingEndMinutes = end.getHours() * 60 + end.getMinutes();

      const isWithinSlot = schedule.slots.some((slot: any) => {
        const [slotStartH, slotStartM] = slot.start.split(':').map(Number);
        const [slotEndH, slotEndM] = slot.end.split(':').map(Number);
        const slotStartMinutes = slotStartH * 60 + slotStartM;
        const slotEndMinutes = slotEndH * 60 + slotEndM;

        return bookingStartMinutes >= slotStartMinutes && bookingEndMinutes <= slotEndMinutes;
      });

      if (!isWithinSlot) {
        throw ApiError.badRequest("Selected time is outside of professional's available slots");
      }
    }

    const expiryTime = new Date(Date.now() - 15 * 60 * 1000);

    const conflicting = await prisma.booking.findFirst({
      where: {
        professionalId,
        status: { not: "CANCELLED" },
        AND: [
          {
            startTime: { lt: end },
            endTime: { gt: start },
          },
          {
            OR: [
              { status: "CONFIRMED" },
              { status: "PAID" },
              { status: "COMPLETED" },
              {
                status: "PENDING",
                createdAt: { gt: expiryTime }
              }
            ]
          }
        ]
      },
    });

    if (conflicting) throw ApiError.conflict("This time slot is already booked");

    const price = Number(professional.sessionPrice || 0);

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

    emailService.sendBookingConfirmation(
      booking.user.email,
      booking.user.name || "User",
      booking.professional.name || "Professional",
      booking.id,
      start.toISOString(),
      end.toISOString(),
      price,
      "PENDING"
    ).catch((error) => {
      logger.error({ error }, "Failed to send booking confirmation email");
    });

    return booking;
  }

  static async getUserBookings(userId: string, status?: string) {
    const where: any = {
      userId,
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
                sessionPrice: true,
              },
            },
          },
        },
      },
    });
  }

  static async getProfessionalBookings(professionalId: string, status?: string) {
    const where: any = {
      professionalId,
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
                sessionPrice: true,
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

    emailService.sendBookingStatusUpdate(
      updated.user.email,
      updated.user.name || "User",
      updated.professional.name || "Professional",
      updated.id,
      "CANCELLED",
      reason
    ).catch((error) => {
      logger.error({ error }, "Failed to send booking status update (CANCELLED)");
    });

    return updated;
  }

  static async updateStatus(bookingId: string, status: "CONFIRMED" | "COMPLETED", userId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw ApiError.notFound("Booking not found");

    if (booking.professionalId !== userId) {
      throw ApiError.forbidden("Only the professional can update this status");
    }

    return prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    });
  }

  static async getAvailableSlots(professionalId: string, dateStr: string) {
    const professional = await prisma.user.findUnique({
      where: { id: professionalId },
      include: {
        professionalProfile: {
          select: { availability: true }
        }
      }
    });

    if (!professional || !professional.professionalProfile) {
      throw ApiError.notFound("Professional not found");
    }

    const timezone = professional.timezone || 'Asia/Dhaka';
    const availability = professional.professionalProfile.availability;

    const [y, m, d] = dateStr.split('-').map(Number);

    const dayIndex = new Date(y, m - 1, d).getDay();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[dayIndex];

    const schedule = (availability as any)?.[dayName];
    if (!schedule || !schedule.enabled || !schedule.slots || schedule.slots.length === 0) {
      return [];
    }

    const startOfDayUTC = fromZonedTime(`${dateStr} 00:00:00`, timezone);
    const endOfDayUTC = fromZonedTime(`${dateStr} 23:59:59`, timezone);
    const existingBookings = await prisma.booking.findMany({
      where: {
        professionalId,
        status: { not: "CANCELLED" },
        startTime: { lt: endOfDayUTC },
        endTime: { gt: startOfDayUTC }
      },
      select: { startTime: true, endTime: true }
    });

    const availableSlots: string[] = [];

    for (const window of schedule.slots) {
      const [startH, startM] = window.start.split(':').map(Number);
      const [endH, endM] = window.end.split(':').map(Number);

      let currentH = startH;
      let currentM = startM;

      while (true) {
        const startInMins = currentH * 60 + currentM;
        const endInMins = startInMins + 60;

        const windowEndInMins = endH * 60 + endM;
        if (endInMins > windowEndInMins) break;

        const slotTimeStr = `${String(Math.floor(startInMins / 60)).padStart(2, '0')}:${String(startInMins % 60).padStart(2, '0')}:00`;
        const slotEndStr = `${String(Math.floor(endInMins / 60)).padStart(2, '0')}:${String(endInMins % 60).padStart(2, '0')}:00`;

        const slotStartUTC = fromZonedTime(`${dateStr} ${slotTimeStr}`, timezone);
        const slotEndUTC = fromZonedTime(`${dateStr} ${slotEndStr}`, timezone);

        const hasConflict = existingBookings.some(b => {
          return (slotStartUTC < b.endTime && slotEndUTC > b.startTime);
        });

        if (!hasConflict) {
          availableSlots.push(slotStartUTC.toISOString());
        }

        currentH += 1;
      }
    }

    return availableSlots;
  }

  static async updateBookingTime(
    bookingId: string,
    startTime: string,
    endTime: string,
    performedByUserId: string,
    role: string = "USER"
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        professional: true
      }
    });

    if (!booking) throw ApiError.notFound("Booking not found");

    const isProfessional = booking.professionalId === performedByUserId;
    const canOverride = ["ADMIN", "MODERATOR"].includes(role);

    if (!isProfessional && !canOverride) {
      throw ApiError.forbidden("Unauthorized to reschedule this booking");
    }

    if (booking.status !== "CONFIRMED") {
      throw ApiError.badRequest("Only confirmed bookings can be rescheduled");
    }

    const start = parseISO(startTime);
    const end = parseISO(endTime);

    if (end <= start) throw ApiError.badRequest("End time must be after start time");

    if (end.getTime() - start.getTime() < 15 * 60 * 1000) {
      throw ApiError.badRequest("Minimum booking duration is 15 minutes");
    }

    const expiryTime = new Date(Date.now() - 15 * 60 * 1000);

    const conflicting = await prisma.booking.findFirst({
      where: {
        id: { not: bookingId },
        professionalId: booking.professionalId,
        status: { not: "CANCELLED" },
        AND: [
          {
            startTime: { lt: end },
            endTime: { gt: start },
          },
          {
            OR: [
              { status: "CONFIRMED" },
              { status: "PAID" },
              { status: "COMPLETED" },
              {
                status: "PENDING",
                createdAt: { gt: expiryTime }
              }
            ]
          }
        ]
      },
    });

    if (conflicting) throw ApiError.conflict("This time slot is already booked");

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        startTime: start,
        endTime: end,
      },
      include: {
        user: true,
        professional: true
      }
    });

    emailService.sendBookingStatusUpdate(
      updatedBooking.user.email,
      updatedBooking.user.name || "User",
      updatedBooking.professional.name || "Professional",
      updatedBooking.id,
      "RESCHEDULED",
      `New time: ${start.toLocaleString()} - ${end.toLocaleString()}`
    ).catch((error) => {
      logger.error({ error }, "Failed to send booking status update (RESCHEDULED)");
    });

    return updatedBooking;
  }
}