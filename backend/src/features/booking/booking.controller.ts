import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../utils/apiResponse.js";
import { BookingService } from "./booking.service.js";

export class BookingController {
  static async createBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data = req.body;
      const booking = await BookingService.createBooking(userId, data);
      res.status(201).json(ApiResponse.created(booking, "Booking created successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async getMyBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const status = req.query.status as string | undefined;
      const bookings = await BookingService.getUserBookings(userId, status);
      res.json(ApiResponse.success(bookings));
    } catch (error) {
      next(error);
    }
  }

  static async getBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const booking = await BookingService.getBookingById(id, userId);
      res.json(ApiResponse.success(booking));
    } catch (error) {
      next(error);
    }
  }

  static async cancelBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { reason } = req.body;
      const booking = await BookingService.cancelBooking(id, userId, reason);
      res.json(ApiResponse.success(booking, "Booking cancelled"));
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { status } = req.body;
      const booking = await BookingService.updateStatus(id, status, userId);
      res.json(ApiResponse.success(booking, "Booking status updated"));
    } catch (error) {
      next(error);
    }
  }
}