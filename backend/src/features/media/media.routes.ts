import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { MediaController } from "./media.controller.js";

const router = Router();

router.post("/signature", authenticate, MediaController.getUploadSignature);
router.post("/delete", authenticate, MediaController.deleteAsset);

export const mediaRoutes = router;