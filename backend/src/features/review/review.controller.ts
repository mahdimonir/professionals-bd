import { NextFunction, Request, Response } from "express";
import { ApiResponse } from "../../utils/apiResponse.js";
import { ReviewService } from "./review.service.js";

export class ReviewController {
    static async submitReview(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const { bookingId, rating, comment } = req.body;

            const review = await ReviewService.submitReview(userId, bookingId, rating, comment);
            res.status(201).json(ApiResponse.created(review, "Review submitted"));
        } catch (error) {
            next(error);
        }
    }

    static async getProfessionalReviews(req: Request, res: Response, next: NextFunction) {
        try {
            const { professionalId } = req.params;
            const reviews = await ReviewService.getProfessionalReviews(professionalId);
            res.json(ApiResponse.success(reviews));
        } catch (error) {
            next(error);
        }
    }

    static async getMyReviews(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.user!.id;
            const reviews = await ReviewService.getUserReviews(userId);
            res.json(ApiResponse.success(reviews));
        } catch (error) {
            next(error);
        }
    }

    static async getReview(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const review = await ReviewService.getReview(id);
            res.json(ApiResponse.success(review));
        } catch (error) {
            next(error);
        }
    }

    static async getBestReviews(req: Request, res: Response, next: NextFunction) {
        try {
            const reviews = await ReviewService.getBestReviews();
            res.json(ApiResponse.success(reviews));
        } catch (error) {
            next(error);
        }
    }

    static async updateReview(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const userId = req.user!.id;
            const { rating, comment } = req.body;
            const review = await ReviewService.updateReview(id, userId, rating, comment);
            res.json(ApiResponse.success(review, "Review updated"));
        } catch (error) {
            next(error);
        }
    }

    static async deleteReview(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            const userId = req.user!.id;
            const result = await ReviewService.deleteReview(id, userId);
            res.json(ApiResponse.success(result, "Review deleted"));
        } catch (error) {
            next(error);
        }
    }
}