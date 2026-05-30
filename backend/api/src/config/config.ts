import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("4000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  MONGO_URI: z.string(),
  REDIS_URL: z.string(),
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_ACCESS_EXPIRES: z.string().default("15m"),
  JWT_REFRESH_EXPIRES: z.string().default("30d"),
  CORS_ORIGINS: z.string().default("http://localhost:5173"),
  BCRYPT_ROUNDS: z.string().default("12"),
});

export const config = envSchema.parse(process.env);
export type Config = z.infer<typeof envSchema>;
