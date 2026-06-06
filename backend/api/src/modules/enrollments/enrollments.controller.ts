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
