import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { reportError } from "@/shared/error/errorToastStore";

/**
 * Central axios instance.
 *
 * Auth model: the refresh token lives in an httpOnly cookie (set by the API).
 * The short-lived access token is kept in memory only (never localStorage) and
 * attached as a Bearer header. On a 401 we transparently hit /auth/refresh once
 * and retry the original request.
 */

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

export const api = axios.create({
  baseURL,
  withCredentials: true, // send/receive the refresh cookie
});

// ── In-memory access token ────────────────────────────────────────────────
let accessToken: string | null = null;
export function setAccessToken(token: string | null) {
  accessToken = token;
}
export function getAccessToken() {
  return accessToken;
}

api.interceptors.request.use((cfg) => {
  if (accessToken) {
    cfg.headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return cfg;
});

// ── Transparent refresh-on-401 ────────────────────────────────────────────
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data } = await axios.post(
      `${baseURL}/auth/refresh`,
      {},
      { withCredentials: true }
    );
    const token = (data as { accessToken?: string }).accessToken ?? null;
    setAccessToken(token);
    return token;
  } catch {
    setAccessToken(null);
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const url = original?.url ?? "";
    const isAuthCall = url.includes("/auth/");

    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      refreshPromise = refreshPromise ?? refreshAccessToken().finally(() => (refreshPromise = null));
      const token = await refreshPromise;
      if (token) {
        original.headers.set("Authorization", `Bearer ${token}`);
        return api(original);
      }
    }

    // Surface every failed request as an error popup. The 401 that triggers a
    // successful silent refresh returns above, so it never reaches here.
    reportError({ message: apiErrorMessage(error), code: apiErrorCode(error) });
    return Promise.reject(error);
  }
);

/** Extracts a human-friendly message from an axios error. */
export function apiErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string } | undefined;
    return data?.error ?? err.message ?? fallback;
  }
  return fallback;
}

/** Extracts the stable catalog code (e.g. "KKN-1004") from an axios error, if present. */
export function apiErrorCode(err: unknown): string | undefined {
  if (axios.isAxiosError(err)) {
    return (err.response?.data as { code?: string } | undefined)?.code;
  }
  return undefined;
}
