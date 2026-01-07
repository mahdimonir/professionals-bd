import prisma from "../../config/client.js";
import { streamClient } from "../../config/stream.js";
import { ApiError } from "../../utils/apiError.js";

export class MeetingService {
  static async createMeeting(bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: { select: { id: true } },
        professional: { select: { id: true } },
      },
    });

    if (!booking) throw ApiError.notFound("Booking not found");
    if (booking.status !== "CONFIRMED") {
      throw ApiError.badRequest("Booking must be confirmed to create a meeting");
    }

    const callType = "default";
    const callId = bookingId; // Use booking ID as call ID

    const call = streamClient.video.call(callType, callId);

    await call.getOrCreate({
      data: {
        created_by_id: booking.professional.id,
        members: [
          { user_id: booking.user.id },
          { user_id: booking.professional.id },
        ],
      },
    });

    // Create or update meeting record
    const meeting = await prisma.meeting.upsert({
      where: { bookingId },
      update: {},
      create: { bookingId, streamCallId: bookingId },
    });

    return { meeting, callId, callType };
  }

  static async generateJoinToken(userId: string, bookingId: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) throw ApiError.notFound("Booking not found");

    if (booking.userId !== userId && booking.professionalId !== userId) {
      throw ApiError.forbidden("You are not a participant in this meeting");
    }

    const token = streamClient.createToken(userId);

    return {
      token,
      callId: bookingId,
      callType: "default",
    };
  }

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

  // Webhook handler for Stream recording events
  static async handleRecordingWebhook(payload: any) {
    if (payload.type !== "call.recording_ready") return;

    const callCid = payload.call_cid; // e.g., "default:booking_123"
    const callId = callCid.split(":").pop();

    const recordingUrl = payload.recording?.url;

    if (!recordingUrl) return;

    await prisma.meeting.update({
      where: { bookingId: callId },
      data: {
        recorded: true,
        recordingUrl,
      },
    });
  }
}