import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default("8000"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  DATABASE_URL: z.string().url(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  STREAM_API_KEY: z.string().optional(),
  STREAM_SECRET: z.string().optional(),
  JWT_ACCESS_SECRET: z.string().min(8),
  JWT_REFRESH_SECRET: z.string().min(8),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_SERVICE: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  // ADMIN_EMAIL: z.string().email().optional(),
  FRONTEND_URL: z.string().url().optional(),
  BKASH_APP_KEY: z.string().optional(),
  BKASH_APP_SECRET: z.string().optional(),
  BKASH_USERNAME: z.string().optional(),
  BKASH_PASSWORD: z.string().optional(),
  BKASH_REFRESH_TOKEN: z.string().optional(),
  BKASH_BASE_URL: z.string().url().optional() || 'https://tokenized.sandbox.bka.sh/v1.2.0-beta',
  BKASH_CALLBACK_URL: z.string().url().optional(),
  SSL_STORE_ID: z.string().optional(),
  SSL_STORE_PASSWORD: z.string().optional(),
  SSL_BASE_URL: z.string().url().optional() || 'https://sandbox.sslcommerz.com',
  SSL_CALLBACK_URL: z.string().url().optional(),
  SSL_SANDBOX: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  BASE_URL: z.string().url().optional(),
  GOOGLE_AI_API_KEY: z.string().optional(),
});

const envServer = envSchema.safeParse(process.env);

if (!envServer.success) {
  console.error("❌ Invalid environment variables:", envServer.error.format());
  process.exit(1);
}

export const env = envServer.data;
