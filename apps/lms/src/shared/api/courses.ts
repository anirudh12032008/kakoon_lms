import { api } from "./client";
import type { EditorLaunchContext } from "@/entities/editor-launch/model/config";

export interface CourseLaunch {
  mode: EditorLaunchContext["mode"];
  launchType: string;
  accent: string;
  allowedCategories: string[];
  allowedNodeTypes?: string[];
  availableSensors: string[];
}

export interface Level {
  key: string;
  label: string;
  build: string;
  editor: string;
  order: number;
}

export interface Challenge {
  key: string;
  title: string;
  order: number;
}

export interface Course {
  _id: string;
  slug: string;
  title: string;
  robotType: "forklift" | "tank" | "turret" | "robotic_arm";
  summary: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedHours: number;
  accent: string;
  coverEmoji: string;
  learningGoals: string[];
  components: string[];
  order: number;
  levels: Level[];
  challenges: Challenge[];
  launch: CourseLaunch;
  enrolled?: boolean;
  completedLevels?: string[];
  completedChallenges?: string[];
  progress?: number;
}

export interface Enrollment {
  _id: string;
  status: "active" | "completed";
  progress: number;
  lastOpenedAt: string | null;
  course: Course;
}

export async function fetchCourses(): Promise<Course[]> {
  const { data } = await api.get<{ courses: Course[] }>("/courses");
  return data.courses;
}

export async function fetchCourse(slug: string): Promise<Course> {
  const { data } = await api.get<{ course: Course }>(`/courses/${slug}`);
  return data.course;
}

export async function fetchMyEnrollments(): Promise<Enrollment[]> {
  const { data } = await api.get<{ enrollments: Enrollment[] }>("/enrollments");
  return data.enrollments;
}

export async function enrollInCourse(slug: string): Promise<void> {
  await api.post(`/enrollments/${slug}`);
}

export interface ProgressResult {
  progress: number;
  completedLevels: string[];
  completedChallenges: string[];
  status: "active" | "completed";
}

/** Toggle completion of a level or challenge. */
export async function setProgress(
  slug: string,
  kind: "level" | "challenge",
  key: string,
  done: boolean
): Promise<ProgressResult> {
  const { data } = await api.post<ProgressResult>(`/enrollments/${slug}/progress`, {
    kind,
    key,
    done,
  });
  return data;
}

/** Marks the course as opened and returns its fresh data (incl. launch config). */
export async function openCourseEditor(slug: string): Promise<Course> {
  const { data } = await api.post<{ course: Course }>(`/enrollments/${slug}/open`);
  return data.course;
}

/** Maps a course's launch config into the editor's EditorLaunchContext shape. */
export function courseToLaunchContext(course: Course): EditorLaunchContext {
  return {
    id: `course-${course.slug}`,
    title: course.title,
    description: course.summary,
    mode: course.launch.mode,
    launchType: "kit",
    kitId: course.slug,
    courseSlug: course.slug,
    accent: course.launch.accent ?? course.accent,
    allowedCategories: course.launch.allowedCategories,
    allowedNodeTypes: course.launch.allowedNodeTypes,
    availableSensors: course.launch.availableSensors,
  };
}

// ── Course workspace persistence (editor → LMS) ────────────────────────────
export interface SavedWorkspace {
  nodes: unknown[];
  edges: unknown[];
}

/** Loads the user's saved workspace for a course (null if they haven't saved yet). */
export async function getCourseWorkspace(slug: string): Promise<SavedWorkspace | null> {
  const { data } = await api.get<{ project: { workspace?: SavedWorkspace } | null }>(
    `/projects/course/${slug}`
  );
  return data.project?.workspace ?? null;
}

/** Saves (upserts) the user's workspace for a course. Returns the server timestamp. */
export async function saveCourseWorkspace(
  slug: string,
  workspace: SavedWorkspace,
  code?: string
): Promise<string> {
  const { data } = await api.put<{ savedAt: string }>(`/projects/course/${slug}`, {
    workspace,
    code,
  });
  return data.savedAt;
}
