import type { Request, Response } from "express";
import { User } from "../../models/User";
import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshCookieOptions,
  REFRESH_COOKIE,
} from "../../utils/tokens";
import type { RegisterInput, LoginInput } from "./auth.schemas";

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
  if (!user) throw ApiError.unauthorized("Invalid email or password");

  const ok = await user.verifyPassword(password);
  if (!ok) throw ApiError.unauthorized("Invalid email or password");

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
    throw ApiError.unauthorized("Session expired, please sign in again");
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
