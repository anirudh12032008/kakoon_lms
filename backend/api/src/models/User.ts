import { Schema, model, type InferSchemaType, type HydratedDocument } from "mongoose";
import bcrypt from "bcryptjs";
import { config } from "../config/config";

const userSchema = new Schema(
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
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

userSchema.methods.setPassword = async function (plain: string) {
  this.passwordHash = await bcrypt.hash(plain, config.bcryptRounds);
};

userSchema.methods.verifyPassword = function (plain: string): Promise<boolean> {
  return bcrypt.compare(plain, this.passwordHash);
};

export type UserDoc = HydratedDocument<
  InferSchemaType<typeof userSchema>,
  {
    setPassword(plain: string): Promise<void>;
    verifyPassword(plain: string): Promise<boolean>;
  }
>;

export const User = model("User", userSchema);
