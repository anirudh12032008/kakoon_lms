import type { Request, Response } from "express";
import { Course } from "../../models/Course";
import { Enrollment } from "../../models/Enrollment";
import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";
import { verifyAccessToken } from "../../utils/tokens";

/** Optionally resolve the current user id from a Bearer token (no error if absent). */
function optionalUserId(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;
  try {
    return verifyAccessToken(header.slice(7)).sub;
  } catch {
    return null;
  }
}

export const listCourses = asyncHandler(async (req: Request, res: Response) => {
  const courses = await Course.find({ published: true }).sort({ order: 1, createdAt: 1 });

  const userId = optionalUserId(req);
  const enrolledIds = userId
    ? new Set(
        (await Enrollment.find({ user: userId }).select("course")).map((e) => String(e.course))
      )
    : new Set<string>();

  res.json({
    courses: courses.map((c) => ({
      ...c.toJSON(),
      enrolled: enrolledIds.has(String(c._id)),
    })),
  });
});

export const getCourse = asyncHandler(async (req: Request, res: Response) => {
  const course = await Course.findOne({ slug: req.params.slug, published: true });
  if (!course) throw ApiError.notFound("Course not found");

  const userId = optionalUserId(req);
  let enrolled = false;
  let completedLevels: string[] = [];
  let completedChallenges: string[] = [];
  let progress = 0;

  if (userId) {
    const enrollment = await Enrollment.findOne({ user: userId, course: course._id });
    if (enrollment) {
      enrolled = true;
      completedLevels = enrollment.completedLevels ?? [];
      completedChallenges = enrollment.completedChallenges ?? [];
      progress = enrollment.progress ?? 0;
    }
  }

  res.json({
    course: { ...course.toJSON(), enrolled, completedLevels, completedChallenges, progress },
  });
});
