import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import { BookingController } from "./booking.controller.js";
import {
    cancelBookingSchema,
    createBookingSchema,
    updateBookingStatusSchema,
} from "./booking.validation.js";

const router = Router();

// User actions
router.get("/availability", authenticate, BookingController.getAvailability);
router.post("/", authenticate, validate(createBookingSchema), BookingController.createBooking);
router.get("/my", authenticate, BookingController.getMyBookings); // Client bookings
router.get("/professional", authenticate, BookingController.getProfessionalBookings); // Professional bookings
router.get("/:id", authenticate, BookingController.getBooking);
router.patch("/:id/cancel", authenticate, validate(cancelBookingSchema), BookingController.cancelBooking);

// Professional actions
router.patch("/:id/status", authenticate, validate(updateBookingStatusSchema), BookingController.updateStatus);
router.patch("/:id/reschedule", authenticate, BookingController.rescheduleBooking);

export const bookingRoutes = router;