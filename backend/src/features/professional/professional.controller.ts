import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../utils/apiResponse.js";
import { ProfessionalService } from "./professional.service.js";

export class ProfessionalController {
  static async getMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const profile = await ProfessionalService.getProfile(userId);
      res.json(ApiResponse.success(profile));
    } catch (error) {
      next(error);
    }
  }

  static async createProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data = req.body;
      const profile = await ProfessionalService.createOrUpdateProfile(userId, data);
      res.status(201).json(ApiResponse.created(profile, "Professional profile created"));
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data = req.body;
      const profile = await ProfessionalService.createOrUpdateProfile(userId, data);
      res.json(ApiResponse.success(profile, "Professional profile updated"));
    } catch (error) {
      next(error);
    }
  }

  static async getAllProfessionals(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 20);
      const result = await ProfessionalService.getAllProfessionals(page, limit);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  static async verifyProfessional(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { isVerified } = req.body;
      const profile = await ProfessionalService.verifyProfessional(userId, isVerified);
      res.json(ApiResponse.success(profile, "Professional verification updated"));
    } catch (error) {
      next(error);
    }
  }
}