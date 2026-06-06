import { z } from "zod";

/**
 * Environment configuration with validation.
 *
 * In development we fall back to safe-ish defaults so the server boots with zero
 * setup (besides a running MongoDB). In production every secret is REQUIRED and
 * the process refuses to start if any are missing — fail fast, never ship
 * default secrets.
 */

const isProd = process.env.NODE_ENV === "production";

// Dev-only fallbacks. Only applied when NOT in production.
const devDefault = (value: string) => (isProd ? undefined : value);

const envSchema = z.object({
  PORT: z.string().default("4000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  MONGO_URI: z
    .string()
    .min(1, "MONGO_URI is required — paste your MongoDB Atlas connection string into backend/api/.env")
    .refine(
      (v) => v.startsWith("mongodb://") || v.startsWith("mongodb+srv://"),
      "MONGO_URI must start with mongodb:// or mongodb+srv://"
    ),

  // Redis is optional — only needed for future background jobs (BullMQ).
  REDIS_URL: z.string().optional(),

  JWT_ACCESS_SECRET: z
    .string()
    .min(16, "JWT_ACCESS_SECRET must be at least 16 chars")
    .default(devDefault("dev-access-secret-change-me-please-32chars") as string),
  JWT_REFRESH_SECRET: z
    .string()
    .min(16, "JWT_REFRESH_SECRET must be at least 16 chars")
    .default(devDefault("dev-refresh-secret-change-me-please-32chars") as string),

  JWT_ACCESS_EXPIRES: z.string().default("15m"),
  JWT_REFRESH_EXPIRES: z.string().default("30d"),

  CORS_ORIGINS: z.string().default("http://localhost:5173"),
  COOKIE_DOMAIN: z.string().optional(),
  BCRYPT_ROUNDS: z.string().default("12"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error(
    "❌ Invalid environment configuration:\n" +
      parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n")
  );
  process.exit(1);
}

export const config = {
  ...parsed.data,
  isProd,
  port: Number(parsed.data.PORT),
  bcryptRounds: Number(parsed.data.BCRYPT_ROUNDS),
  corsOrigins: parsed.data.CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean),
};

export type Config = typeof config;
