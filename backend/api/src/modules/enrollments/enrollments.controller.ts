import type { Request, Response } from "express";
import { Course } from "../../models/Course";
import { Enrollment } from "../../models/Enrollment";
import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";

/** List the current user's enrolments, with course details populated. */
export const myEnrollments = asyncHandler(async (req: Request, res: Response) => {
  const enrollments = await Enrollment.find({ user: req.user!.sub })
    .populate("course")
    .sort({ updatedAt: -1 });
  res.json({ enrollments });
});

/** Enrol the current user in a course (free, idempotent). */
export const enroll = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const course = await Course.findOne({ slug, published: true });
  if (!course) throw ApiError.notFound("Course not found");

  const existing = await Enrollment.findOne({ user: req.user!.sub, course: course._id });
  if (existing) {
    return res.status(200).json({ enrollment: existing, alreadyEnrolled: true });
  }

  const enrollment = await Enrollment.create({
    user: req.user!.sub,
    course: course._id,
  });

  res.status(201).json({ enrollment, alreadyEnrolled: false });
});

/** Toggle completion of a level or challenge; recomputes overall progress. */
export const updateProgress = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const { kind, key, done } = req.body as { kind?: string; key?: string; done?: boolean };

  if ((kind !== "level" && kind !== "challenge") || typeof key !== "string" || !key) {
    throw ApiError.badRequest("Provide kind ('level'|'challenge'), key, and done");
  }

  const course = await Course.findOne({ slug, published: true });
  if (!course) throw ApiError.notFound("Course not found");

  const enrollment = await Enrollment.findOne({ user: req.user!.sub, course: course._id });
  if (!enrollment) throw ApiError.forbidden("Enroll in this course first");

  const field = kind === "level" ? "completedLevels" : "completedChallenges";
  const set = new Set<string>(enrollment[field] ?? []);
  if (done) set.add(key);
  else set.delete(key);
  enrollment[field] = Array.from(set);

  // Progress = completed levels + challenges over the course's total.
  const total = (course.levels?.length ?? 0) + (course.challenges?.length ?? 0);
  const completed =
    (enrollment.completedLevels?.length ?? 0) + (enrollment.completedChallenges?.length ?? 0);
  enrollment.progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  if (enrollment.progress >= 100) enrollment.status = "completed";
  else if (enrollment.status === "completed") enrollment.status = "active";

  await enrollment.save();

  res.json({
    progress: enrollment.progress,
    completedLevels: enrollment.completedLevels,
    completedChallenges: enrollment.completedChallenges,
    status: enrollment.status,
  });
});

/** Mark a course as opened — updates lastOpenedAt and returns the launch config. */
export const openCourseEditor = asyncHandler(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const course = await Course.findOne({ slug, published: true });
  if (!course) throw ApiError.notFound("Course not found");

  const enrollment = await Enrollment.findOne({ user: req.user!.sub, course: course._id });
  if (!enrollment) throw ApiError.forbidden("Enrol in this course before opening the editor");

  enrollment.lastOpenedAt = new Date();
  await enrollment.save();

  res.json({ course: course.toJSON() });
});
