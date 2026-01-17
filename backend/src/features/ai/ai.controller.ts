import { NextFunction, Request, Response } from "express";
import { ApiError } from "../../utils/apiError.js";
import { ApiResponse } from "../../utils/apiResponse.js";
import { AIService } from "./ai.service.js";

export class AIController {
    // Main AI assistant query
    static async query(req: Request, res: Response): Promise<void> {
        const { query } = req.body;

        if (!query || typeof query !== 'string') {
            throw ApiError.badRequest('Query is required');
        }

        // Optional user - chatbot works for both guest and authenticated users
        const userId = req.user?.id;
        const response = await AIService.queryWithContext(query, userId);

        res.json(ApiResponse.success(response, 'AI response generated'));
    }

    // Smart natural language search
    static async smartSearch(req: Request, res: Response, next: NextFunction) {
        try {
            const { query } = req.body;

            if (!query || typeof query !== "string") {
                throw ApiError.badRequest("Query is required");
            }

            const result = await AIService.smartSearch(query);
            res.json(ApiResponse.success(result));
        } catch (error) {
            next(error);
        }
    }

    // Get user's chat history
    static async getChatHistory(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const limit = parseInt(req.query.limit as string) || 20;

            const history = await AIService.getChatHistory(userId, limit);
            res.json(ApiResponse.success(history));
        } catch (error) {
            next(error);
        }
    }

    // Get AI feature status
    static async getFeatureStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const { featureName } = req.params;
            const enabled = await AIService.checkFeatureEnabled(featureName);
            res.json(ApiResponse.success({ featureName, enabled }));
        } catch (error) {
            next(error);
        }
    }
}
