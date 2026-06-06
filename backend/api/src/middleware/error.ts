import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { logger } from "../utils/logger";

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound("Route not found"));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Mongo duplicate key
  if (typeof err === "object" && err && (err as { code?: number }).code === 11000) {
    return res.status(409).json({ error: "Resource already exists" });
  }

  logger.error("Unhandled error", {
    message: (err as Error)?.message,
    stack: (err as Error)?.stack,
  });
  return res.status(500).json({ error: "Internal server error" });
}
