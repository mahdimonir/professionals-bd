import prisma from "../../config/client.js";
import { streamClient } from "../../config/stream.js";
import { ApiError } from "../../utils/apiError.js";

export class MeetingService {
  // 1. Create meeting from confirmed booking
  static async createMeetingFromBooking(bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: { select: { id: true, name: true } },
        professional: { select: { id: true, name: true } },
      },
    });

    if (!booking) throw ApiError.notFound("Booking not found");
    if (booking.status !== "CONFIRMED") {
      throw ApiError.badRequest("Booking must be confirmed to create a meeting");
    }

    const callType = "default";
    const callId = `booking-${bookingId}`; // Prefix to distinguish from ad-hoc

    const call = streamClient.video.call(callType, callId);

    await call.getOrCreate({
      data: {
        created_by_id: booking.professional.id,
        members: [
          { user_id: booking.user.id },
          { user_id: booking.professional.id },
        ],
        custom: { type: "booking", bookingId },
      },
    });

    const meeting = await prisma.meeting.upsert({
      where: { bookingId },
      update: { streamCallId: callId },
      create: {
        bookingId,
        streamCallId: callId,
      },
    });

    return { meeting, callId, callType };
  }

  // 2. Create ad-hoc meeting (ADMIN/MODERATOR only)
  static async createAdHocMeeting(creatorId: string, title?: string) {
    const callType = "default";
    const callId = `adhoc-${creatorId}-${Date.now()}`; // Unique ID

    const call = streamClient.video.call(callType, callId);

    await call.getOrCreate({
      data: {
        created_by_id: creatorId,
        custom: { type: "adhoc", title: title || "Instant Meeting" },
      },
    });

    return { callId, callType };
  }

  // 3. Generate join token (works for both booking & ad-hoc)
  static async generateJoinToken(userId: string, callId: string) {
    // Extract type from callId
    const isBookingCall = callId.startsWith("booking-");
    const isAdHocCall = callId.startsWith("adhoc-");

    if (!isBookingCall && !isAdHocCall) {
      throw ApiError.badRequest("Invalid call ID");
    }

    if (isBookingCall) {
      const bookingId = callId.replace("booking-", "");
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) throw ApiError.notFound("Booking not found");

      if (booking.userId !== userId && booking.professionalId !== userId) {
        throw ApiError.forbidden("You are not a participant");
      }
    }
    // For ad-hoc: allow any authenticated user (or add member check later)

    const token = streamClient.createToken(userId);

    return { token, callId, callType: "default" };
  }

  // Add this method
  static async generateAdHocJoinToken(userId: string, callId: string) {
    // Basic validation - call must exist in Stream
    const call = streamClient.video.call("default", callId);
    try {
      await call.get(); // Check if call exists
    } catch {
      throw ApiError.notFound("Meeting not found");
    }

    const token = streamClient.createToken(userId);

    return {
      token,
      callId,
      callType: "default",
    };
  }

  // Add this method for guest access
  static async generateGuestToken(callId: string, guestName: string) {
    const call = streamClient.video.call("default", callId);
    try {
      await call.get();
    } catch {
      throw ApiError.notFound("Meeting not found");
    }

    // Create a temporary user ID for the guest
    const guestId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Upsert guest user first
    await streamClient.upsertUsers([{
      id: guestId,
      name: guestName,
      role: "guest",
    }]);

    // Create token for this guest (expiration default)
    const token = streamClient.createToken(guestId);

    return {
      token,
      callId,
      callType: "default",
      user: { id: guestId, name: guestName },
    };
  }

  // 4. Approve recording (only for booking-based meetings)
  static async approveRecording(meetingId: string, adminId: string, approved: boolean) {
    const meeting = await prisma.meeting.findUnique({
      where: { id: meetingId },
    });

    if (!meeting) throw ApiError.notFound("Meeting not found");

    return prisma.meeting.update({
      where: { id: meetingId },
      data: {
        approvedForStorage: approved,
        approvedBy: approved ? adminId : null,
        approvedAt: approved ? new Date() : null,
      },
    });
  }

  // 5. Webhook handler
  static async handleRecordingWebhook(payload: any) {
    if (payload.type !== "call.recording_ready") return;

    const callCid = payload.call_cid;
    const callId = callCid.split(":").pop();

    if (!callId.startsWith("booking-")) return; // Only save recording for booking calls

    const bookingId = callId.replace("booking-", "");
    const recordingUrl = payload.recording?.url;

    if (!recordingUrl) return;

    await prisma.meeting.update({
      where: { bookingId },
      data: {
        recorded: true,
        recordingUrl,
      },
    });
  }
}