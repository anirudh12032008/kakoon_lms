import { Schema, model, type InferSchemaType } from "mongoose";

/**
 * A Course is a learning track tied to a physical robot build (forklift, tank,
 * turret, robotic arm). Its `launch` block mirrors the frontend's
 * EditorLaunchContext so enrolling + opening the editor configures the exact
 * blocks/categories that course needs.
 */
const launchSchema = new Schema(
  {
    mode: {
      type: String,
      enum: ["guided", "challenge", "sandbox", "full", "customize"],
      default: "guided",
    },
    launchType: { type: String, enum: ["mode", "kit", "custom", "course"], default: "course" },
    accent: { type: String, default: "from-violet-500 to-fuchsia-500" },
    allowedCategories: { type: [String], default: [] },
    allowedNodeTypes: { type: [String], default: undefined },
    availableSensors: { type: [String], default: [] },
  },
  { _id: false }
);

/**
 * A build level: aligned "Build" (physical/LMS) + "Editor" (coding) tasks.
 * Levels are the sequential journey from kit to working robot.
 */
const levelSchema = new Schema(
  {
    key: { type: String, required: true }, // "intro", "l1", ...
    label: { type: String, required: true }, // "Intro", "Level 1"
    build: { type: String, default: "" }, // LMS / physical assembly step
    editor: { type: String, default: "" }, // editor / coding step
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

/** An optional challenge — an add-on or modification done after the build. */
const challengeSchema = new Schema(
  {
    key: { type: String, required: true }, // "c1", ...
    title: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const courseSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    robotType: {
      type: String,
      enum: ["forklift", "tank", "turret", "robotic_arm"],
      required: true,
    },
    summary: { type: String, required: true },
    description: { type: String, default: "" },
    difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
    estimatedHours: { type: Number, default: 2 },
    accent: { type: String, default: "from-violet-500 to-fuchsia-500" },
    coverEmoji: { type: String, default: "🤖" },
    // What the learner will build / learn — shown on the course page.
    learningGoals: { type: [String], default: [] },
    components: { type: [String], default: [] },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: true },
    introVideoUrl: { type: String, default: "" },
    levels: { type: [levelSchema], default: [] },
    challenges: { type: [challengeSchema], default: [] },
    launch: { type: launchSchema, default: () => ({}) },
    // Optional pre-built starter workspace (ReactFlow nodes/edges JSON).
    starterWorkspace: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

courseSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const r = ret as Record<string, unknown>;
    delete r.__v;
    return r;
  },
});

export type CourseType = InferSchemaType<typeof courseSchema>;
export const Course = model("Course", courseSchema);
