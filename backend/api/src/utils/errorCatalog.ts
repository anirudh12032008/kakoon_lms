/**
 * Central catalog of known, frequently-hit errors.
 *
 * Every entry has a stable machine `code` (e.g. "KKN-1003") that never changes
 * once shipped — the HTTP status or human message can be reworded freely, but
 * the code is the contract the frontend and a future "common errors" help
 * section key off. Add new errors at the bottom of the relevant range; never
 * recycle a retired code.
 *
 * Ranges:
 *   1xxx — client / request errors (4xx)
 *   5xxx — server / infrastructure errors (5xx)
 */

export interface ErrorDef {
  /** Stable machine code. Safe to surface in the UI and logs. */
  code: string;
  /** Default HTTP status. */
  status: number;
  /** Default human-friendly message. */
  message: string;
}

export const ERRORS = {
  // ── 1xxx — client / request ────────────────────────────────────────────
  VALIDATION_FAILED: { code: "KKN-1001", status: 400, message: "Validation failed" },
  BAD_REQUEST: { code: "KKN-1002", status: 400, message: "Bad request" },
  UNAUTHORIZED: { code: "KKN-1003", status: 401, message: "Unauthorized" },
  INVALID_CREDENTIALS: { code: "KKN-1004", status: 401, message: "Invalid email or password" },
  SESSION_EXPIRED: { code: "KKN-1005", status: 401, message: "Session expired, please sign in again" },
  FORBIDDEN: { code: "KKN-1006", status: 403, message: "You don't have permission to do that" },
  NOT_FOUND: { code: "KKN-1007", status: 404, message: "Not found" },
  ROUTE_NOT_FOUND: { code: "KKN-1008", status: 404, message: "Route not found" },
  CONFLICT: { code: "KKN-1009", status: 409, message: "Conflict" },
  DUPLICATE_RESOURCE: { code: "KKN-1010", status: 409, message: "Resource already exists" },
  RATE_LIMITED: { code: "KKN-1011", status: 429, message: "Too many requests — slow down a moment" },

  // ── 5xxx — server / infrastructure ─────────────────────────────────────
  INTERNAL: { code: "KKN-5000", status: 500, message: "Internal server error" },
  DB_UNAVAILABLE: { code: "KKN-5001", status: 503, message: "Service temporarily unavailable" },
} as const satisfies Record<string, ErrorDef>;

export type ErrorKey = keyof typeof ERRORS;
