import { Router } from "express";
import { ProfessionalController } from "./professional.controller.js";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import {
  createProfileSchema,
  updateProfileSchema,
  verifyProfileSchema,
} from "./professional.validation.js";

const router = Router();

// Current professional (own profile)
router.get("/me", authenticate, ProfessionalController.getMyProfile);
router.post("/me", authenticate, validate(createProfileSchema), ProfessionalController.createProfile);
router.patch("/me", authenticate, validate(updateProfileSchema), ProfessionalController.updateProfile);

// Public: List all professionals
router.get("/", ProfessionalController.getAllProfessionals);

// Admin: Verify professional
router.patch(
  "/verify/:userId",
  authenticate,
  authorize("ADMIN"),
  validate(verifyProfileSchema),
  ProfessionalController.verifyProfessional
);

export const professionalRoutes = router;
