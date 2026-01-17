import { z } from "zod";

export const applyProfileSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    bio: z.string().min(50),
    specialties: z.array(z.string().min(1)).min(1),
    sessionPrice: z.number().positive(),
    experience: z.number().int().min(0),
    languages: z.array(z.string().min(1)).min(1),
    linkedinUrl: z.string().url().optional().or(z.literal("")),
    cvUrl: z.string().url().optional().or(z.literal("")),
    education: z.array(z.object({ name: z.string(), doc: z.string().url().optional().or(z.literal("")) })).optional(),
    certifications: z.array(z.object({ name: z.string(), doc: z.string().url().optional().or(z.literal("")) })).optional(),
    availability: z.any().optional(),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    title: z.string().min(3).optional(),
    bio: z.string().min(50).optional(),
    specialties: z.array(z.string().min(1)).optional(),
    sessionPrice: z.number().positive().optional(),
    experience: z.number().int().min(0).optional(),
    languages: z.array(z.string().min(1)).optional(),
    linkedinUrl: z.string().url().optional(),
    cvUrl: z.string().url().optional(),
    education: z.array(z.object({ name: z.string(), doc: z.string().url().optional().or(z.literal("")) })).optional(),
    certifications: z.array(z.object({ name: z.string(), doc: z.string().url().optional().or(z.literal("")) })).optional(),
    availability: z.any().optional(),
  }),
});

export const verifyProfileSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const rejectProfileSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    reason: z.string().min(5),
  }),
});