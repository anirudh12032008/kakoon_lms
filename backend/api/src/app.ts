import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { config } from "./config/config";
import { authRouter } from "./modules/auth/auth.routes";
import { coursesRouter } from "./modules/courses/courses.routes";
import { enrollmentsRouter } from "./modules/enrollments/enrollments.routes";
import { projectsRouter } from "./modules/projects/projects.routes";
import { notFound, errorHandler } from "./middleware/error";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigins,
      credentials: true,
    })
  );
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  // Global, gentle rate limit (auth routes add a tighter one of their own).
  app.use(
    rateLimit({
      windowMs: 60 * 1000,
      max: 120,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime(), env: config.NODE_ENV });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/courses", coursesRouter);
  app.use("/api/enrollments", enrollmentsRouter);
  app.use("/api/projects", projectsRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
