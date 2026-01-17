import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { MeetingController } from "./meeting.controller.js";

const router = Router();

// Create meeting room (after booking confirmed)
router.post("/", authenticate, authorize("PROFESSIONAL"), MeetingController.createMeeting);

// Create ad-hoc meeting (ADMIN/MODERATOR only)
router.post("/adhoc", authenticate, authorize("ADMIN", "MODERATOR"), MeetingController.createAdHocMeeting);
// Add this route
router.get("/adhoc/:callId/token", authenticate, MeetingController.getAdHocJoinToken);

// Get guest token
router.post("/adhoc/:callId/guest-token", MeetingController.getGuestToken);

// Get join token for participant
router.get("/:bookingId/token", authenticate, MeetingController.getJoinToken);

// Recording control
router.post("/:callId/recording/start", authenticate, MeetingController.startRecording);
router.post("/:callId/recording/stop", authenticate, MeetingController.stopRecording);

// Stream.io webhook for recording ready
router.post("/webhook/recording", MeetingController.recordingWebhook);

export const meetingRoutes = router;