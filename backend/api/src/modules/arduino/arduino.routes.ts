import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { compile } from "./arduino.controller";

// Compiling is CPU-heavy: much tighter than the global limiter.
const compileLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  // Per student, not per IP: a whole lab shares one campus address.
  keyGenerator: (req) => req.user?.sub ?? req.ip ?? "anon",
  message: { error: "Too many compiles, please wait a minute" },
});

const compileSchema = z.object({
  code: z.string().max(100_000),
  fqbn: z.enum(["arduino:avr:uno", "arduino:avr:nano"]),
});

export const arduinoRouter = Router();

arduinoRouter.post("/compile", requireAuth, compileLimiter, validateBody(compileSchema), compile);
