import { Schema, model, type Model, type HydratedDocument } from "mongoose";
import bcrypt from "bcryptjs";
import { config } from "../config/config";

export interface IUser {
  name: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  avatarUrl?: string;
  role: "student" | "admin";
  tokenVersion: number;
  avatarColor: string;
}

export interface IUserMethods {
  setPassword(plain: string): Promise<void>;
  verifyPassword(plain: string): Promise<boolean>;
}

type UserModel = Model<IUser, Record<string, never>, IUserMethods>;

const userSchema = new Schema<IUser, UserModel, IUserMethods>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // Optional: users who sign up with Google have no password.
    passwordHash: { type: String, required: false, select: false },
    googleId: { type: String, index: true, sparse: true },
    avatarUrl: { type: String },
    role: { type: String, enum: ["student", "admin"], default: "student" },
    // Bumped on password change / forced logout to invalidate old refresh tokens.
    tokenVersion: { type: Number, default: 0 },
    avatarColor: { type: String, default: "#7c3aed" },
  },
  { timestamps: true }
);

// Public shape only: map _id -> id and never leak internal fields
// (passwordHash, tokenVersion used for refresh-token invalidation, etc).
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const r = ret as unknown as Record<string, unknown>;
    r.id = String(r._id);
    delete r._id;
    delete r.passwordHash;
    delete r.tokenVersion;
    delete r.updatedAt;
    delete r.__v;
    return r;
  },
});

userSchema.methods.setPassword = async function (plain: string) {
  this.passwordHash = await bcrypt.hash(plain, config.bcryptRounds);
};

userSchema.methods.verifyPassword = function (plain: string): Promise<boolean> {
  // Google-only accounts have no password — password login always fails for them.
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(plain, this.passwordHash);
};

export type UserDoc = HydratedDocument<IUser, IUserMethods>;

export const User = model<IUser, UserModel>("User", userSchema);
