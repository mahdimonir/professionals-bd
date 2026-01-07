import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../utils/apiResponse.js";
import { MeetingService } from "./meeting.service.js";

export class MeetingController {
  static async createMeeting(req: Request, res: Response, next: NextFunction) {
    try {
      const { bookingId } = req.body;
      const result = await MeetingService.createMeetingFromBooking(bookingId);
      res.status(201).json(ApiResponse.created(result, "Meeting room created"));
    } catch (error) {
      next(error);
    }
  }

  static async createAdHocMeeting(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { title } = req.body;
      const result = await MeetingService.createAdHocMeeting(userId, title);
    res.status(201).json(ApiResponse.created(result, "Ad-hoc meeting created"));
  } catch (error) {
    next(error);
  }
}

  static async getJoinToken(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { bookingId } = req.params;
      const tokenData = await MeetingService.generateJoinToken(userId, bookingId);
      res.json(ApiResponse.success(tokenData));
    } catch (error) {
      next(error);
    }
  }

  static async getAdHocJoinToken(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user!.id;
    const { callId } = req.params;
    const tokenData = await MeetingService.generateAdHocJoinToken(userId, callId);
    res.json(ApiResponse.success(tokenData));
  } catch (error) {
    next(error);
  }
}

  static async approveRecording(req: Request, res: Response, next: NextFunction) {
    try {
      const { meetingId } = req.params;
      const { approved } = req.body;
      const adminId = req.user!.id;
      const meeting = await MeetingService.approveRecording(meetingId, adminId, approved);
      res.json(ApiResponse.success(meeting, "Recording approval updated"));
    } catch (error) {
      next(error);
    }
  }

  static async recordingWebhook(req: Request, res: Response) {
    try {
      await MeetingService.handleRecordingWebhook(req.body);
      res.status(200).send("OK");
    } catch (error) {
      res.status(500).send("Error");
    }
  }
}