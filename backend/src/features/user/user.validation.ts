import { z } from "zod";

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    bio: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    timezone: z.string().optional(),
    avatar: z.string().url().nullable().optional(),
  }),
});

export const getUserParamsSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
});

export const searchUsersQuerySchema = z.object({
  query: z.object({
    q: z.string().optional(),
    role: z.enum(["USER", "PROFESSIONAL", "ADMIN", "MODERATOR"]).optional(),
    page: z.coerce.number().min(1).default(1).optional(),
    limit: z.coerce.number().min(1).max(50).default(10).optional(),
  }),
});