import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";
import logger from "./logger.js";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export const getPublicIdFromUrl = (url: string | null): string | null => {
  if (!url) return null;

  try {
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;
    const pathAfterUpload = parts[1];
    const withoutVersion = pathAfterUpload.replace(/^v\d+\//, ""); // Remove version like v1234567890/
    const withoutExtension = withoutVersion.replace(/\.[^/.]+$/, "");
    return withoutExtension;
  } catch {
    return null;
  }
};

export const deleteFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
      resource_type: "image", // Change to "raw" for PDFs if needed
    });

    if (result.result === "ok" || result.result === "not found") {
      logger.info(`Deleted Cloudinary asset: ${publicId}`);
    } else {
      logger.warn(`Cloudinary delete failed: ${publicId}`, result);
    }
  } catch (error) {
    logger.error({ err: error }, `Cloudinary delete error: ${publicId}`);
    // Don't throw — cleanup should not break main operation
  }
};