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
    const callId = `booking-${bookingId}`;

    const call = streamClient.video.call(callType, callId);

    await call.getOrCreate({
      data: {
        created_by_id: booking.professional.id,
        members: [
          { user_id: booking.professional.id, role: "host" },
          { user_id: booking.user.id, role: "guest" },
        ],
        settings_override: {
          recording: {
            mode: "available", // Backend routes enforce host-only access
            quality: "1080p",
          },
        },
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
    const callId = `adhoc-${creatorId}-${Date.now()}`;

    const call = streamClient.video.call(callType, callId);

    await call.getOrCreate({
      data: {
        created_by_id: creatorId,
        members: [
          { user_id: creatorId, role: "host" },
        ],
        settings_override: {
          recording: {
            mode: "available", // Backend routes enforce host-only access
            quality: "1080p",
          },
        },
        custom: { type: "adhoc", title: title || "Instant Meeting" },
      },
    });

    return { callId, callType };
  }

  // 3. Generate join token (works for both booking & ad-hoc)
  static async generateJoinToken(userId: string, callId: string) {
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

    const call = streamClient.video.call("default", callId);
    try {
      const callData = await call.get();

      if (callData.call.ended_at) {
        throw ApiError.badRequest("This call has ended and cannot be rejoined");
      }
    } catch (error: any) {
      if (error.statusCode === 400) {
        throw error;
      }
    }

    const token = streamClient.createToken(userId);

    return { token, callId, callType: "default" };
  }

  static async generateAdHocJoinToken(userId: string, callId: string) {
    const call = streamClient.video.call("default", callId);
    try {
      const callData = await call.get();

      if (callData.call.ended_at) {
        throw ApiError.badRequest("This call has ended and cannot be rejoined");
      }
    } catch (error: any) {
      if (error.statusCode === 400) {
        throw error;
      }
      throw ApiError.notFound("Meeting not found");
    }

    const token = streamClient.createToken(userId);

    return {
      token,
      callId,
      callType: "default",
      userId,
    };
  }

  static async generateGuestToken(callId: string, guestName: string) {
    const call = streamClient.video.call("default", callId);
    try {
      const callData = await call.get();
      if (callData.call.ended_at) {
        throw ApiError.badRequest("This call has ended and cannot be joined");
      }
    } catch (error: any) {
      if (error.statusCode === 400) {
        throw error;
      }
      throw ApiError.notFound("Meeting not found");
    }

    const guestId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await streamClient.upsertUsers([{
      id: guestId,
      name: guestName,
    }]);

    const token = streamClient.createToken(guestId);

    return {
      token,
      callId,
      callType: "default",
      userId: guestId,
      user: { id: guestId, name: guestName },
    };
  }

  static async startRecording(callId: string, userId: string) {
    const call = streamClient.video.call("default", callId);

    const callInfo = await call.get();
    const member = callInfo.members.find(m => m.user_id === userId);
    if (!member || member.role !== "host") {
      throw ApiError.forbidden("Only the host can start recording");
    }

    await call.startRecording();

    return { success: true, message: "Recording started" };
  }

  static async stopRecording(callId: string, userId: string) {
    const call = streamClient.video.call("default", callId);

    const callInfo = await call.get();
    const member = callInfo.members.find(m => m.user_id === userId);
    if (!member || member.role !== "host") {
      throw ApiError.forbidden("Only the host can stop recording");
    }

    await call.stopRecording();

    return { success: true, message: "Recording stopped" };
  }

  static async handleRecordingWebhook(payload: any) {
    if (payload.type !== "call.recording_ready") return;

    const callCid = payload.call_cid;
    const callId = callCid.split(":").pop();

    if (!callId.startsWith("booking-")) return;

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