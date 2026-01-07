import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/apiError.js";

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  throw new ApiError(404, `Route ${req.originalUrl} not found`);
};