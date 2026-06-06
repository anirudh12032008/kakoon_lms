import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * Join record between a user and a course. Free enrollment, but modelled
 * explicitly so we can track progress, completion, and last-opened time.
 */
const enrollmentSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    status: { type: String, enum: ["active", "completed"], default: "active" },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    lastOpenedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// A user can only enrol in a given course once.
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

enrollmentSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const r = ret as Record<string, unknown>;
    delete r.__v;
    return r;
  },
});

export type EnrollmentType = InferSchemaType<typeof enrollmentSchema>;
export const Enrollment = model("Enrollment", enrollmentSchema);
