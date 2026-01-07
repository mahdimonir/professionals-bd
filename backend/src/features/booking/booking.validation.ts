import { z } from "zod";

export const createBookingSchema = z.object({
  body: z.object({
    professionalId: z.string(),
    startTime: z.string().datetime({ message: "Invalid datetime format" }),
    endTime: z.string().datetime({ message: "Invalid datetime format" }),
    notes: z.string().optional(),
  }),
});

export const cancelBookingSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    reason: z.string().min(5, "Cancellation reason must be at least 5 characters"),
  }),
});

export const updateBookingStatusSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    status: z.enum(["CONFIRMED", "COMPLETED", "CANCELLED"]),
  }),
});