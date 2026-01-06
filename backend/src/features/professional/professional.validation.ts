import { z } from "zod";

export const createProfileSchema = z.object({
  specialties: z.array(z.string().min(1)).min(1),
  rates: z.number().positive(),
  experience: z.number().int().min(0).optional(),
  languages: z.array(z.string().min(1)).min(1),
  certifications: z.array(z.string().url()).optional(), // Cloudinary URLs from frontend
});

export const updateProfileSchema = z.object({
  specialties: z.array(z.string().min(1)).optional(),
  rates: z.number().positive().optional(),
  experience: z.number().int().min(0).optional(),
  languages: z.array(z.string().min(1)).optional(),
  certifications: z.array(z.string().url()).optional(),
});

export const verifyProfileSchema = z.object({
  userId: z.string(),
  isVerified: z.boolean(),
});