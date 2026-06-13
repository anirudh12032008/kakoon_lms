import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { ERRORS } from "../utils/errorCatalog";
import { logger } from "../utils/logger";

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(ApiError.from(ERRORS.ROUTE_NOT_FOUND));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    // Operational errors (validation, bad credentials, etc.) are expected — the
    // code goes to the client for the popup, but we don't spam the terminal.
    return res.status(err.status).json({
      error: err.message,
      code: err.code,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Mongo duplicate key
  if (typeof err === "object" && err && (err as { code?: number }).code === 11000) {
    return res.status(ERRORS.DUPLICATE_RESOURCE.status).json({
      error: ERRORS.DUPLICATE_RESOURCE.message,
      code: ERRORS.DUPLICATE_RESOURCE.code,
    });
  }

  logger.error(`[${ERRORS.INTERNAL.code}] Unhandled error`, {
    method: req.method,
    path: req.originalUrl,
    message: (err as Error)?.message,
    stack: (err as Error)?.stack,
  });
  return res.status(ERRORS.INTERNAL.status).json({
    error: ERRORS.INTERNAL.message,
    code: ERRORS.INTERNAL.code,
  });
}
