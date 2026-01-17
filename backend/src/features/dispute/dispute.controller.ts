import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../utils/apiResponse.js";
import { DisputeService } from "./dispute.service.js";

export class DisputeController {
  static async raiseDispute(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { bookingId, description, requestedRefundAmount, metadata, type } = req.body;

      const dispute = await DisputeService.raiseDispute(userId, bookingId, description, requestedRefundAmount, metadata, type);
      res.status(201).json(ApiResponse.created(dispute, "Dispute raised"));
    } catch (error) {
      next(error);
    }
  }

  static async getMyDisputes(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const disputes = await DisputeService.getUserDisputes(userId);
      res.json(ApiResponse.success(disputes));
    } catch (error) {
      next(error);
    }
  }

  static async getDisputeDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const dispute = await DisputeService.getDisputeDetails(id);
      res.json(ApiResponse.success(dispute));
    } catch (error) {
      next(error);
    }
  }

  static async getAllDisputes(req: Request, res: Response, next: NextFunction) {
    try {
      const disputes = await DisputeService.getAllDisputes();
      res.json(ApiResponse.success(disputes));
    } catch (error) {
      next(error);
    }
  }

  static async resolveDispute(req: Request, res: Response, next: NextFunction) {
    try {
      const adminId = req.user!.id;
      const { id } = req.params;
      const { approved, refundAmount, note } = req.body;

      const result = await DisputeService.resolveDispute(id, adminId, approved, refundAmount, note);
      res.json(ApiResponse.success(result, "Dispute resolved"));
    } catch (error) {
      next(error);
    }
  }
}