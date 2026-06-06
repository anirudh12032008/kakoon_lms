import jwt, { type SignOptions } from "jsonwebtoken";
import { config } from "../config/config";

export interface AccessPayload {
  sub: string; // user id
  email: string;
  role: "student" | "admin";
}

export interface RefreshPayload {
  sub: string;
  tokenVersion: number;
}

export function signAccessToken(payload: AccessPayload): string {
  return jwt.sign(payload, config.JWT_ACCESS_SECRET, {
    expiresIn: config.JWT_ACCESS_EXPIRES,
  } as SignOptions);
}

export function signRefreshToken(payload: RefreshPayload): string {
  return jwt.sign(payload, config.JWT_REFRESH_SECRET, {
    expiresIn: config.JWT_REFRESH_EXPIRES,
  } as SignOptions);
}

export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(token, config.JWT_ACCESS_SECRET) as AccessPayload;
}

export function verifyRefreshToken(token: string): RefreshPayload {
  return jwt.verify(token, config.JWT_REFRESH_SECRET) as RefreshPayload;
}

export const REFRESH_COOKIE = "kokoon_rt";

/** Cookie options for the httpOnly refresh token. */
export function refreshCookieOptions() {
  // 30 days in ms (kept in sync with JWT_REFRESH_EXPIRES default)
  const maxAge = 30 * 24 * 60 * 60 * 1000;
  return {
    httpOnly: true,
    secure: config.isProd,
    sameSite: config.isProd ? ("none" as const) : ("lax" as const),
    domain: config.COOKIE_DOMAIN,
    path: "/api/auth",
    maxAge,
  };
}
