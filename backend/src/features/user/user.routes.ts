import { Router } from "express";
import { authenticate, authorize } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import { UserController } from "./user.controller.js";
import {
  getUserParamsSchema,
  searchUsersQuerySchema,
  updateProfileSchema,
} from "./user.validation.js";

const router = Router();

// Public: View any user profile
router.get("/:id", validate(getUserParamsSchema), UserController.getUser);

// Protected: Current user
router.get("/me/profile", authenticate, UserController.getMyProfile);
router.patch("/me/profile", authenticate, validate(updateProfileSchema), UserController.updateMyProfile);

// Search users (public or authenticated)
router.get("/search", validate(searchUsersQuerySchema), UserController.searchUsers);

// Admin only
router.get("/admin/all", authenticate, authorize("ADMIN", "MODERATOR"), UserController.getAllUsers);

export const userRoutes = router;
