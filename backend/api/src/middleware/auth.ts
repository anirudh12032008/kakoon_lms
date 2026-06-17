import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken, type AccessPayload } from "../utils/tokens";
import { ApiError } from "../utils/ApiError";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AccessPayload;
    }
  }
}

/** Requires a valid Bearer access token. Attaches the payload to req.user. */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(ApiError.unauthorized("Missing access token"));
  }
  const token = header.slice(7);
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(ApiError.unauthorized("Invalid or expired access token"));
  }
}

/** Requires the authenticated user to have the admin role. */
export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") return next(ApiError.forbidden("Admin only"));
  next();
}

/**
 * Attaches req.user when a valid Bearer token is present, but never rejects.
 * Used by public routes that behave differently for the resource owner
 * (e.g. a shared project the author can open in edit mode).
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      req.user = verifyAccessToken(header.slice(7));
    } catch {
      /* ignore invalid/expired token — treat as anonymous */
    }
  }
  next();
}
