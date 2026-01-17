import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../utils/apiResponse.js";
import { ProfessionalService } from "./professional.service.js";

export class ProfessionalController {
  static async submitApplication(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data = req.body;
      const profile = await ProfessionalService.submitApplication(userId, data);
      res.status(201).json(ApiResponse.created(profile, "Application submitted successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data = req.body;
      const result = await ProfessionalService.updateProfile(userId, data);
      res.json(ApiResponse.success(result, result.message));
    } catch (error) {
      next(error);
    }
  }

  static async getAllProfessionals(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 20);
      const search = req.query.q as string | undefined;
      const category = req.query.category as string | undefined;

      const result = await ProfessionalService.getAllProfessionals(page, limit, search, category);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  static async getProfessionalProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const profile = await ProfessionalService.getProfessionalProfile(id);
      res.json(ApiResponse.success(profile));
    } catch (error) {
      next(error);
    }
  }
}