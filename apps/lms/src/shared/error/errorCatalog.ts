/**
 * Frontend mirror of the API's error catalog (backend/api/src/utils/errorCatalog.ts).
 *
 * The backend is the source of truth for codes; this map only adds a short,
 * user-facing `hint` per code so the popup can explain what to do next. A future
 * "common errors" help page can render straight from this object. Codes we don't
 * recognise still show, just without a hint.
 */

export interface ErrorInfo {
  /** One-line, friendly guidance shown under the error message. */
  hint: string;
}

export const ERROR_CATALOG: Record<string, ErrorInfo> = {
  "KKN-1001": { hint: "Check the highlighted fields and try again." },
  "KKN-1002": { hint: "The request looked malformed — please retry." },
  "KKN-1003": { hint: "Please sign in to continue." },
  "KKN-1004": { hint: "Double-check your email and password." },
  "KKN-1005": { hint: "Your session timed out. Sign in again to continue." },
  "KKN-1006": { hint: "You don't have access to this. Contact an admin if that's wrong." },
  "KKN-1007": { hint: "We couldn't find what you were looking for." },
  "KKN-1008": { hint: "That page or route doesn't exist." },
  "KKN-1009": { hint: "There was a conflict with existing data." },
  "KKN-1010": { hint: "This already exists — try a different value." },
  "KKN-1011": { hint: "You're going a bit fast. Wait a moment and retry." },
  "KKN-5000": { hint: "Something broke on our end. Please try again shortly." },
  "KKN-5001": { hint: "The service is temporarily down. Try again in a minute." },
};

export function errorHint(code?: string | null): string | undefined {
  if (!code) return undefined;
  return ERROR_CATALOG[code]?.hint;
}
