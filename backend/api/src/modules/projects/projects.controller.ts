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
