import { Prisma } from "@prisma/client";
import prisma from "../../config/client.js";
import { emailService } from "../../services/email.service.js";
import { ApiError } from "../../utils/apiError.js";

export class DisputeService {
  static async raiseDispute(
    userId: string,
    bookingId: string,
    description: string,
    requestedRefundAmount?: number,
    metadata?: any,
    type: string = "BOOKING"
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        professional: { select: { id: true, name: true, email: true } },
      },
    });

    if (!booking) throw ApiError.notFound("Booking not found");

    // For Reschedule Requests, status checks might be different (e.g. only CONFIRMED)
    if (type === "RESCHEDULE_REQUEST") {
      if (booking.status !== "CONFIRMED")
        throw ApiError.badRequest("Only confirmed bookings can be rescheduled via dispute");
    } else {
      if (booking.status !== "COMPLETED" && booking.status !== "CONFIRMED" && booking.status !== "PAID")
        throw ApiError.badRequest("Only paid, confirmed or completed bookings can be disputed");
    }

    if (booking.userId !== userId && booking.professionalId !== userId) {
      throw ApiError.forbidden("Only participants can raise dispute");
    }

    const dispute = await prisma.dispute.create({
      data: {
        bookingId,
        userId,
        description,
        status: "OPEN",
        type,
        metadata: metadata || Prisma.JsonNull, // Store metadata
      },
    });

    // Determine complainant and other party
    const isUserComplainant = booking.userId === userId;
    const complainant = isUserComplainant ? booking.user : booking.professional;
    const otherParty = isUserComplainant ? booking.professional : booking.user;

    // Notify admin with complete details
    await emailService.sendDisputeRaised(
      "admin@professionalsbd.com",
      bookingId,
      dispute.id,
      complainant.name || "User",
      otherParty.name || "Professional",
      description
    );

    // Notify other participant
    await emailService.sendDisputeNotification(
      otherParty.email,
      otherParty.name || "User",
      bookingId,
      dispute.id,
      "A dispute has been raised on your booking. Our support team will review it shortly."
    );

    return dispute;
  }

  // ... existing getters ...

  static async getUserDisputes(userId: string) {
    return prisma.dispute.findMany({
      where: { userId },
      orderBy: { resolvedAt: "desc" },
      include: {
        booking: {
          select: {
            id: true,
            status: true,
            user: { select: { name: true, email: true } },
            professional: { select: { name: true, email: true } },
            startTime: true,
          },
        },
      },
    });
  }

  static async getDisputeDetails(disputeId: string) {
    return prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        booking: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            professional: { select: { id: true, name: true, email: true } },
            payment: true,
          },
        },
        user: { select: { id: true, name: true, email: true } },
        resolvedByUser: { select: { id: true, name: true } },
      },
    });
  }

  static async getAllDisputes() {
    return prisma.dispute.findMany({
      orderBy: { resolvedAt: "desc" },
      include: {
        booking: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            professional: { select: { id: true, name: true, email: true } },
            payment: true,
          },
        },
        user: { select: { id: true, name: true, email: true } },
        resolvedByUser: { select: { id: true, name: true } },
      },
    });
  }

  static async resolveDispute(
    disputeId: string,
    resolvedBy: string,
    approved: boolean,
    refundAmount?: number,
    note?: string
  ) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
    });

    if (!dispute) throw ApiError.notFound("Dispute not found");

    if (dispute.type === "RESCHEDULE_REQUEST") {
      return this.resolveRescheduleDispute(disputeId, resolvedBy, approved, note);
    }

    // Existing Logic for normal disputes
    return this.resolveRefundDispute(disputeId, resolvedBy, approved, refundAmount, note);
  }

  // Extracted original resolution logic
  private static async resolveRefundDispute(
    disputeId: string,
    resolvedBy: string,
    approved: boolean,
    refundAmount?: number,
    note?: string
  ) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        booking: {
          include: {
            user: true,
            professional: true,
            payment: true,
          },
        },
      },
    });

    if (!dispute) throw ApiError.notFound("Dispute not found");
    if (dispute.status !== "OPEN") throw ApiError.badRequest("Dispute already resolved");

    // Update dispute status
    const updated = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: approved ? "RESOLVED" : "CLOSED",
        resolvedBy,
        resolvedAt: new Date(),
      },
    });

    // If approved → process refund in Payment model
    if (approved && refundAmount && dispute.booking?.payment) {
      await prisma.payment.update({
        where: { id: dispute.booking.payment.id },
        data: {
          refundAmount,
          status: "REFUNDED",
          refundTrxId: `REFUND_${Date.now()}`,
        },
      });

      // Update booking status
      await prisma.booking.update({
        where: { id: dispute.bookingId! },
        data: {
          status: "CANCELLED",
          cancellationReason: `Dispute resolved - Refund approved${note ? `: ${note}` : ""}`,
        },
      });

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: "DISPUTE_RESOLVE",
          performedBy: resolvedBy,
          targetId: dispute.bookingId,
          details: {
            disputeId,
            approved,
            refundAmount,
            note,
          },
        },
      });
    }

    // Notify complainant
    if (dispute.booking) {
      await emailService.sendDisputeResolved(
        dispute.booking.user.email,
        dispute.booking.user.name || "User",
        dispute.bookingId!,
        disputeId,
        approved ? "approved" : "rejected",
        refundAmount,
        note
      );

      // Notify professional
      await emailService.sendDisputeResolvedProfessional(
        dispute.booking.professional.email,
        dispute.booking.professional.name || "Professional",
        dispute.bookingId!,
        disputeId,
        approved ? "approved" : "rejected",
        note
      );
    }

    return {
      dispute: updated,
      refundProcessed: approved && refundAmount ? true : false,
      message: approved ? "Dispute resolved and refund processed" : "Dispute closed",
    };
  }

  static async resolveRescheduleDispute(
    disputeId: string,
    resolvedBy: string,
    approved: boolean, // If approved, we execute reschedule. If rejected, just close dispute.
    note?: string
  ) {
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { booking: true }
    });

    if (!dispute) throw ApiError.notFound("Dispute not found");
    if (dispute.status !== "OPEN") throw ApiError.badRequest("Dispute already resolved");
    if (dispute.type !== "RESCHEDULE_REQUEST") throw ApiError.badRequest("Invalid dispute type for reschedule resolution");

    // Extract metadata
    const metadata = dispute.metadata as any;
    if (!metadata || !metadata.newStartTime || !metadata.newEndTime) {
      throw ApiError.badRequest("Dispute is missing reschedule metadata");
    }

    if (approved) {
      // Execute Reschedule (Admin Override)
      // We import BookingService dynamically or use prisma update directly to avoid circular dep if any, 
      // but cleaner is to use BookingService. Since circular dependency is possible in some setups, we'll try to use prisma update logic here
      // or just accept we are in Service layer. 
      // We will call BookingService.updateBookingTime with role override.
      // But importing BookingService here creates circular dependency? 
      // BookingService imports emailService, but not DisputeService. So DisputeService importing BookingService is fine?
      // Let's verify imports safely.

      // Actually best to re-implement specific logic or call BookingService if safe. 
      // We will import BookingService at top (need to check if it's safe).
      // Safest is to duplicate logic slightly or use a direct prisma update here since we are in a Service.

      const { BookingService } = await import("../booking/booking.service.js"); // Dynamic import to be safe

      await BookingService.updateBookingTime(
        dispute.bookingId!,
        metadata.newStartTime,
        metadata.newEndTime,
        resolvedBy, // Moderator ID
        "MODERATOR" // Role Override
      );
    }

    // Update Dispute Status
    const updatedDispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: approved ? "RESOLVED" : "CLOSED", // Resolved means approved/actioned. Closed means rejected/no-action.
        resolvedBy,
        resolvedAt: new Date(),
      }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        action: "DISPUTE_RESCHEDULE_RESOLVE",
        performedBy: resolvedBy,
        targetId: dispute.bookingId,
        details: {
          disputeId,
          approved,
          newStartTime: metadata.newStartTime,
          newEndTime: metadata.newEndTime,
          note
        }
      }
    });

    return {
      dispute: updatedDispute,
      rescheduled: approved,
      message: approved ? "Reschedule request approved and booking updated." : "Reschedule request rejected."
    };
  }
}
