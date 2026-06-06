import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validateBody } from "../../middleware/validate";
import { requireAuth } from "../../middleware/auth";
import { registerSchema, loginSchema } from "./auth.schemas";
import { register, login, refresh, logout, me } from "./auth.controller";

// Tight limiter on credential endpoints to slow brute-force attempts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again later" },
});

export const authRouter = Router();

authRouter.post("/register", authLimiter, validateBody(registerSchema), register);
authRouter.post("/login", authLimiter, validateBody(loginSchema), login);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, me);
