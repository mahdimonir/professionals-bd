import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import { UserController } from "./user.controller.js";
import {
  getUserParamsSchema,
  searchUsersQuerySchema,
  updateProfileSchema,
} from "./user.validation.js";

const router = Router();

// Unified profile endpoint - returns user + professional data if applicable
router.get("/me", authenticate, UserController.getMyProfile);
router.patch("/me", authenticate, validate(updateProfileSchema), UserController.updateMyProfile);

// Search users (public - useful for finding professionals)
router.get("/search", validate(searchUsersQuerySchema), UserController.searchUsers);

// Public: View any user profile (limited fields for professionals to see clients)
router.get("/:id", validate(getUserParamsSchema), UserController.getUser);

export const userRoutes = router;
