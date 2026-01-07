import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../utils/apiResponse.js";
import { UserService } from "./user.service.js";

export class UserController {
  static async getMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const profile = await UserService.getProfile(userId);
      res.json(ApiResponse.success(profile));
    } catch (error) {
      next(error);
    }
  }

  static async updateMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data = req.body;
      const updated = await UserService.updateProfile(userId, data);
      res.json(ApiResponse.success(updated, "Profile updated successfully"));
    } catch (error) {
      next(error);
    }
  }

  static async getUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await UserService.getUserById(id);
      res.json(ApiResponse.success(user));
    } catch (error) {
      next(error);
    }
  }

  static async searchUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const query = req.query as any;
      const result = await UserService.searchUsers({
        q: query.q,
        role: query.role,
        page: Number(query.page || 1),
        limit: Number(query.limit || 10),
      });
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }

  static async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 20);
      const result = await UserService.getAllUsers(page, limit);
      res.json(ApiResponse.success(result));
    } catch (error) {
      next(error);
    }
  }
}
