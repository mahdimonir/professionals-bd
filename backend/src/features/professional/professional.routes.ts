import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import { ProfessionalController } from "./professional.controller.js";
import {
  applyProfileSchema,
  updateProfileSchema,
} from "./professional.validation.js";

const router = Router();


// PROFESSIONAL SELF-SERVICE

// Submit professional application
router.post(
  "/apply",
  authenticate,
  validate(applyProfileSchema),
  ProfessionalController.submitApplication
);

// Update professional profile
router.patch(
  "/me",
  authenticate,
  validate(updateProfileSchema),
  ProfessionalController.updateProfile
);


// List all APPROVED professionals (public)
router.get("/", ProfessionalController.getAllProfessionals);

// View specific professional profile (public)
router.get("/:id", ProfessionalController.getProfessionalProfile);

export const professionalRoutes = router;
