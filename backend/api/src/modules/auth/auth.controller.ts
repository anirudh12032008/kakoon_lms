import type { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import { User } from "../../models/User";
import { config } from "../../config/config";
import { ApiError } from "../../utils/ApiError";
import { ERRORS } from "../../utils/errorCatalog";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshCookieOptions,
  REFRESH_COOKIE,
} from "../../utils/tokens";
import type { RegisterInput, LoginInput, GoogleInput } from "./auth.schemas";

const googleClient = new OAuth2Client(config.GOOGLE_CLIENT_ID);

// A few friendly avatar colors to assign new accounts.
const AVATAR_COLORS = ["#7c3aed", "#2563eb", "#10b981", "#f97316", "#e11d48", "#0891b2"];
const randomColor = () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

function issueTokens(user: { id: string; email: string; role: "student" | "admin"; tokenVersion: number }) {
  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id, tokenVersion: user.tokenVersion });
  return { accessToken, refreshToken };
}

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password } = req.body as RegisterInput;

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  const user = new User({ name, email });
  await user.setPassword(password);
  await user.save();

  const { accessToken, refreshToken } = issueTokens({
    id: user.id,
    email: user.email,
    role: user.role,
    tokenVersion: user.tokenVersion,
  });

  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  res.status(201).json({ user: user.toJSON(), accessToken });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginInput;

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) throw ApiError.from(ERRORS.INVALID_CREDENTIALS);

  const ok = await user.verifyPassword(password);
  if (!ok) throw ApiError.from(ERRORS.INVALID_CREDENTIALS);

  const { accessToken, refreshToken } = issueTokens({
    id: user.id,
    email: user.email,
    role: user.role,
    tokenVersion: user.tokenVersion,
  });

  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  res.json({ user: user.toJSON(), accessToken });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies?.[REFRESH_COOKIE];
  if (!token) throw ApiError.unauthorized("No refresh token");

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    throw ApiError.unauthorized("Invalid refresh token");
  }

  const user = await User.findById(payload.sub);
  if (!user || user.tokenVersion !== payload.tokenVersion) {
    throw ApiError.from(ERRORS.SESSION_EXPIRED);
  }

  // Rotate the refresh token on every use.
  const { accessToken, refreshToken } = issueTokens({
    id: user.id,
    email: user.email,
    role: user.role,
    tokenVersion: user.tokenVersion,
  });
  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  res.json({ user: user.toJSON(), accessToken });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const opts = refreshCookieOptions();
  res.clearCookie(REFRESH_COOKIE, { ...opts, maxAge: undefined });
  res.status(204).end();
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user!.sub);
  if (!user) throw ApiError.unauthorized("Account not found");
  res.json({ user: user.toJSON() });
});

export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  if (!config.GOOGLE_CLIENT_ID) {
    throw ApiError.badRequest("Google sign-in is not configured on the server");
  }
  const { credential } = req.body as GoogleInput;

  // Verify the ID token against Google and our client ID (audience).
  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: config.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    throw ApiError.unauthorized("Invalid Google credential");
  }

  if (!payload?.sub || !payload.email || payload.email_verified === false) {
    throw ApiError.unauthorized("Google account could not be verified");
  }

  const email = payload.email.toLowerCase();
  const googleId = payload.sub;

  // Link by googleId first, then by email (so an existing email account adopts Google login).
  let user = await User.findOne({ $or: [{ googleId }, { email }] });
  if (!user) {
    user = new User({
      name: payload.name || email.split("@")[0],
      email,
      googleId,
      avatarUrl: payload.picture,
      avatarColor: randomColor(),
    });
    await user.save();
  } else if (!user.googleId) {
    user.googleId = googleId;
    if (!user.avatarUrl && payload.picture) user.avatarUrl = payload.picture;
    await user.save();
  }

  const { accessToken, refreshToken } = issueTokens({
    id: user.id,
    email: user.email,
    role: user.role,
    tokenVersion: user.tokenVersion,
  });

  res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
  res.json({ user: user.toJSON(), accessToken });
});
