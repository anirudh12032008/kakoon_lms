import { Schema, model, type Model, type HydratedDocument } from "mongoose";
import bcrypt from "bcryptjs";
import { config } from "../config/config";

export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
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
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["student", "admin"], default: "student" },
    // Bumped on password change / forced logout to invalidate old refresh tokens.
    tokenVersion: { type: Number, default: 0 },
    avatarColor: { type: String, default: "#7c3aed" },
  },
  { timestamps: true }
);

// Never leak the hash in JSON responses.
userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const r = ret as unknown as Record<string, unknown>;
    delete r.passwordHash;
    delete r.__v;
    return r;
  },
});

userSchema.methods.setPassword = async function (plain: string) {
  this.passwordHash = await bcrypt.hash(plain, config.bcryptRounds);
};

userSchema.methods.verifyPassword = function (plain: string): Promise<boolean> {
  return bcrypt.compare(plain, this.passwordHash);
};

export type UserDoc = HydratedDocument<IUser, IUserMethods>;

export const User = model<IUser, UserModel>("User", userSchema);
