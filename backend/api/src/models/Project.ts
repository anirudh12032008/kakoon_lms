import { randomBytes } from "node:crypto";
import { Schema, model, type InferSchemaType } from "mongoose";

/** Build a URL-safe, shareable slug from a project name plus a random suffix. */
export function makeProjectSlug(name: string): string {
  const base = (name || "project")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "project";
  return `${base}-${randomBytes(4).toString("hex")}`;
}

/**
 * A saved editor workspace belonging to a user, optionally tied to a course.
 * Lets learners persist their block program across devices/sessions.
 */
const projectSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    course: { type: Schema.Types.ObjectId, ref: "Course", default: null, index: true },
    // Shareable, auto-generated identifier for the public view link.
    slug: { type: String, unique: true, sparse: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    // ReactFlow workspace: { nodes: [...], edges: [...] }
    workspace: { type: Schema.Types.Mixed, required: true },
    // Generated/edited Python for the saved program (standalone projects).
    code: { type: String, default: "" },
    // Editor state needed to faithfully reopen a standalone project:
    // { generatedCode, editableCode, hasManualEdits, viewMode, isEditing, launchContext }.
    meta: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

// Auto-assign a shareable slug to standalone projects that don't have one yet.
projectSchema.pre("validate", function assignSlug(next) {
  if (!this.slug && this.course == null) {
    this.slug = makeProjectSlug(this.name as string);
  }
  next();
});

projectSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const r = ret as Record<string, unknown>;
    delete r.__v;
    return r;
  },
});

export type ProjectType = InferSchemaType<typeof projectSchema>;
export const Project = model("Project", projectSchema);
