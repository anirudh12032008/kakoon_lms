import { ERRORS, type ErrorDef } from "./errorCatalog";

/**
 * Operational error with an HTTP status code. Thrown anywhere in the request
 * lifecycle and translated to a JSON response by the central error handler.
 *
 * Each error also carries a stable machine `code` from the error catalog so the
 * client can show a precise popup and key into a shared "common errors" section.
 */
export class ApiError extends Error {
  status: number;
  details?: unknown;
  /** Stable catalog code, e.g. "KKN-1004". */
  code: string;

  constructor(status: number, message: string, details?: unknown, code: string = ERRORS.INTERNAL.code) {
    super(message);
    this.status = status;
    this.details = details;
    this.code = code;
    this.name = "ApiError";
    Error.captureStackTrace?.(this, ApiError);
  }

  /**
   * Build an error straight from a catalog entry. Pass `message` to override the
   * catalog's default wording while keeping its code and status.
   *
   *   throw ApiError.from(ERRORS.INVALID_CREDENTIALS);
   */
  static from(def: ErrorDef, message?: string, details?: unknown) {
    return new ApiError(def.status, message ?? def.message, details, def.code);
  }

  static badRequest(msg: string = ERRORS.BAD_REQUEST.message, details?: unknown) {
    return new ApiError(400, msg, details, ERRORS.BAD_REQUEST.code);
  }
  static unauthorized(msg: string = ERRORS.UNAUTHORIZED.message) {
    return new ApiError(401, msg, undefined, ERRORS.UNAUTHORIZED.code);
  }
  static forbidden(msg: string = ERRORS.FORBIDDEN.message) {
    return new ApiError(403, msg, undefined, ERRORS.FORBIDDEN.code);
  }
  static notFound(msg: string = ERRORS.NOT_FOUND.message) {
    return new ApiError(404, msg, undefined, ERRORS.NOT_FOUND.code);
  }
  static conflict(msg: string = ERRORS.CONFLICT.message) {
    return new ApiError(409, msg, undefined, ERRORS.CONFLICT.code);
  }
}
