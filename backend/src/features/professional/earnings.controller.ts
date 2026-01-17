import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../utils/apiResponse.js";
import { EarningsService } from "./earnings.service.js";

export class EarningsController {
    static async getEarnings(req: Request, res: Response, next: NextFunction) {
        try {
            const professionalId = req.user!.id;
            const earnings = await EarningsService.getEarnings(professionalId);
            res.json(ApiResponse.success(earnings));
        } catch (error) {
            next(error);
        }
    }

    static async requestWithdraw(req: Request, res: Response, next: NextFunction) {
        try {
            const professionalId = req.user!.id;
            const { amount, method } = req.body;
            const result = await EarningsService.requestWithdraw(professionalId, amount, method);
            res.json(ApiResponse.success(result));
        } catch (error) {
            next(error);
        }
    }

    static async getWithdrawHistory(req: Request, res: Response, next: NextFunction) {
        try {
            const professionalId = req.user!.id;
            const history = await EarningsService.getWithdrawHistory(professionalId);
            res.json(ApiResponse.success(history));
        } catch (error) {
            next(error);
        }
    }
}