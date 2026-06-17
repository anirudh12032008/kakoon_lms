import type { Request, Response } from "express";
import { z } from "zod";
import { Course } from "../../models/Course";
import { Enrollment } from "../../models/Enrollment";
import { Project } from "../../models/Project";
import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";

const saveSchema = z.object({
  // ReactFlow workspace { nodes, edges } — kept loose, validated shallowly.
  workspace: z.object({
    nodes: z.array(z.any()).default([]),
    edges: z.array(z.any()).default([]),
  }),
  code: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
});

// ── Standalone (course-less) projects ──────────────────────────────────────
// These are the user's own named projects, shown on the Projects page and
// created/updated from the editor.

const workspaceSchema = z.object({
  nodes: z.array(z.any()).default([]),
  edges: z.array(z.any()).default([]),
});

const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  workspace: workspaceSchema,
  code: z.string().optional(),
  meta: z.record(z.any()).nullable().optional(),
});

const updateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  workspace: workspaceSchema.optional(),
  code: z.string().optional(),
  meta: z.record(z.any()).nullable().optional(),
});

function parseOrThrow<T>(schema: z.ZodSchema<T>, body: unknown): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw ApiError.badRequest(
      "Invalid project payload",
      parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }))
    );
  }
  return parsed.data;
}

/** List the current user's standalone projects (lightweight, newest first). */
export const listProjects = asyncHandler(async (req: Request, res: Response) => {
  const projects = await Project.find({ user: req.user!.sub, course: null })
    .select("name slug code updatedAt createdAt")
    .sort({ updatedAt: -1 });
  res.json({ projects: projects.map((p) => p.toJSON()) });
});

/** Fetch one standalone project in full (owner-only). */
export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await Project.findOne({ _id: req.params.id, user: req.user!.sub });
  if (!project) throw ApiError.notFound("Project not found");
  res.json({ project: project.toJSON() });
});

/** Create a new standalone project for the current user. */
export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const data = parseOrThrow(createSchema, req.body);
  const project = await Project.create({
    user: req.user!.sub,
    course: null,
    name: data.name,
    workspace: data.workspace,
    code: data.code ?? "",
    meta: data.meta ?? null,
  });
  res.status(201).json({ project: project.toJSON() });
});

/** Update a standalone project (save / rename). Only the provided fields change. */
export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const data = parseOrThrow(updateSchema, req.body);
  const update: Record<string, unknown> = {};
  if (data.name !== undefined) update.name = data.name;
  if (data.workspace !== undefined) update.workspace = data.workspace;
  if (data.code !== undefined) update.code = data.code;
  if (data.meta !== undefined) update.meta = data.meta;

  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, user: req.user!.sub },
    { $set: update },
    { new: true }
  );
  if (!project) throw ApiError.notFound("Project not found");
  res.json({ project: project.toJSON(), savedAt: new Date().toISOString() });
});

/** Delete a standalone project (owner-only). */
export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await Project.findOneAndDelete({ _id: req.params.id, user: req.user!.sub });
  if (!project) throw ApiError.notFound("Project not found");
  res.json({ ok: true });
});

/**
 * Public, read-only view of a shared project by slug. Anyone with the link can
 * see it; `canEdit` is true only when the viewer is the author (compared by the
 * authenticated user's email), which lets the author open it in edit mode.
 */
export const getSharedProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await Project.findOne({ slug: req.params.slug, course: null })
    .populate<{ user: { name: string; email: string } }>("user", "name email");
  if (!project) throw ApiError.notFound("Shared project not found");

  const author = project.user as unknown as { name?: string; email?: string } | null;
  const canEdit = !!req.user?.email && !!author?.email && req.user.email === author.email;

  res.json({
    project: {
      id: project._id,
      slug: project.slug,
      name: project.name,
      workspace: project.workspace,
      code: project.code,
      meta: project.meta,
      updatedAt: project.get("updatedAt"),
    },
    authorName: author?.name ?? "Unknown",
    canEdit,
  });
});

/** Get the current user's saved workspace for a course (null if none yet). */
export const getCourseProject = asyncHandler(async (req: Request, res: Response) => {
  const course = await Course.findOne({ slug: req.params.slug });
  if (!course) throw ApiError.notFound("Course not found");

  const project = await Project.findOne({ user: req.user!.sub, course: course._id });
  res.json({ project: project ? project.toJSON() : null });
});

/** Create or update the current user's workspace for a course (autosave target). */
export const saveCourseProject = asyncHandler(async (req: Request, res: Response) => {
  const parsed = saveSchema.safeParse(req.body);
  if (!parsed.success) {
    throw ApiError.badRequest(
      "Invalid workspace payload",
      parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }))
    );
  }

  const course = await Course.findOne({ slug: req.params.slug });
  if (!course) throw ApiError.notFound("Course not found");

  const enrollment = await Enrollment.findOne({ user: req.user!.sub, course: course._id });
  if (!enrollment) throw ApiError.forbidden("Enroll in this course before saving work");

  const project = await Project.findOneAndUpdate(
    { user: req.user!.sub, course: course._id },
    {
      $set: {
        workspace: parsed.data.workspace,
        name: course.title,
      },
      $setOnInsert: { user: req.user!.sub, course: course._id },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  // Track activity / progress on the enrollment.
  enrollment.lastOpenedAt = new Date();
  if (typeof parsed.data.progress === "number") enrollment.progress = parsed.data.progress;
  await enrollment.save();

  res.json({ project: project.toJSON(), savedAt: new Date().toISOString() });
});
