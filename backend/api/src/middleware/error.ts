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
    // Operational errors (validation, bad credentials, etc.) are expected - the
    // code goes to the client for the popup, but we don't spam the terminal.
    return res.status(err.status).json({
      error: err.message,
      code: err.code,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  // Malformed id in the URL (e.g. /projects/not-an-id): a missing resource, not a crash.
  if ((err as { name?: string })?.name === "CastError") {
    return res.status(ERRORS.NOT_FOUND.status).json({ error: ERRORS.NOT_FOUND.message, code: ERRORS.NOT_FOUND.code });
  }

  // body-parser rejections (invalid JSON, payload too large) carry their own 4xx status.
  const status = (err as { status?: number })?.status;
  if (typeof status === "number" && status >= 400 && status < 500) {
    return res.status(status).json({
      error: status === 413 ? "This project is too large to save" : ERRORS.BAD_REQUEST.message,
      code: ERRORS.BAD_REQUEST.code,
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
