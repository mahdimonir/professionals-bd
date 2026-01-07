import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { MeetingController } from "./meeting.controller.js";

const router = Router();

// Create meeting room (after booking confirmed)
router.post("/", authenticate, MeetingController.createMeeting);

// Get join token for participant
router.get("/:bookingId/token", authenticate, MeetingController.getJoinToken);

// Admin approve recording storage
router.patch("/:meetingId/recording", authenticate, authorize("ADMIN"), MeetingController.approveRecording);

// Stream.io webhook for recording ready
router.post("/webhook/recording", MeetingController.recordingWebhook);

export const meetingRoutes = router;