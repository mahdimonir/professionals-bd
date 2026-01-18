import { v2 as cloudinary } from "cloudinary";
import { NextFunction, Request, Response } from "express";
import { env } from "../../config/env.js";
import { ApiResponse } from "../../utils/apiResponse.js";

export class MediaController {
  // Called by frontend to get signed params
  static getUploadSignature(req: Request, res: Response, next: NextFunction) {
    try {
      const timestamp = Math.round(Date.now() / 1000);
      const folder = req.body.folder || "professionals-bd";

      const signature = cloudinary.utils.api_sign_request(
        {
          timestamp,
          folder,
        },
        env.CLOUDINARY_API_SECRET!
      );

      res.json(
        ApiResponse.success({
          timestamp,
          signature,
          cloudName: env.CLOUDINARY_CLOUD_NAME,
          apiKey: env.CLOUDINARY_API_KEY,
          folder,
        })
      );
    } catch (error) {
      next(error);
    }
  }

  // Optional: Delete specific asset (call from frontend when removing avatar/certification)
  static async deleteAsset(req: Request, res: Response, next: NextFunction) {
    try {
      const { publicId } = req.body;

      if (!publicId) {
        return res.status(400).json({ success: false, message: "publicId required" });
      }

      await cloudinary.uploader.destroy(publicId, { invalidate: true });

      res.json(ApiResponse.success(null, "Asset deleted"));
    } catch (error) {
      next(error);
    }
  }
}