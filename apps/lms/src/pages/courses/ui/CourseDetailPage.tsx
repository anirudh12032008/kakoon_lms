import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Clock, Cpu, Target, Sparkles } from "lucide-react";
import {
  fetchCourse, enrollInCourse, openCourseEditor, courseToLaunchContext, type Course,
} from "@/shared/api/courses";
import { apiErrorMessage } from "@/shared/api/client";
import { useLaunchStore } from "@/shared/launch/launchStore";
import { DashboardHeader, DifficultyBadge } from "./DashboardHeader";

export function CourseDetailPage() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const setLaunchContext = useLaunchStore((s) => s.setContext);

  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchCourse(slug)
      .then((c) => !cancelled && setCourse(c))
      .catch((e) => !cancelled && setError(apiErrorMessage(e, "Could not load this course")));
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const handleEnroll = async () => {
    if (!course) return;
    setBusy(true);
    setError(null);
    try {
      await enrollInCourse(course.slug);
      setCourse({ ...course, enrolled: true });
    } catch (e) {
      setError(apiErrorMessage(e, "Could not enroll"));
    } finally {
      setBusy(false);
    }
  };

  const handleOpenEditor = async () => {
    if (!course) return;
    setBusy(true);
    setError(null);
    try {
      const fresh = await openCourseEditor(course.slug);
      setLaunchContext(courseToLaunchContext(fresh));
      navigate("/editor");
    } catch (e) {
      setError(apiErrorMessage(e, "Could not open the editor"));
      setBusy(false);
    }
  };

  if (error && !course) {
    return (
      <div className="min-h-screen bg-page">
        <DashboardHeader />
        <div className="mx-auto max-w-3xl px-5 py-16 text-center">
          <p className="text-lg font-semibold text-body">{error}</p>
          <button onClick={() => navigate("/courses")} className="mt-4 text-primary-c hover:underline">
            ← Back to courses
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-page">
        <DashboardHeader />
        <div className="mx-auto max-w-4xl px-5 py-8">
          <div className="h-44 animate-pulse rounded-2xl border border-subtle bg-raised" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page">
      <DashboardHeader />

      <main className="mx-auto max-w-4xl px-5 py-7">
        <button
          onClick={() => navigate("/courses")}
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-sub transition-colors hover:text-body"
        >
          <ArrowLeft className="h-4 w-4" /> All courses
        </button>

        {/* Hero */}
        <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${course.accent} p-7`}>
          <div className="flex items-start justify-between">
            <span className="text-6xl drop-shadow-lg">{course.coverEmoji}</span>
            <div className="flex items-center gap-2">
              <DifficultyBadge difficulty={course.difficulty} />
              {course.enrolled && (
                <span className="flex items-center gap-1 rounded-full bg-white/25 px-3 py-1 text-[12px] font-bold text-white">
                  <Check className="h-3.5 w-3.5" /> Enrolled
                </span>
              )}
            </div>
          </div>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-white">{course.title}</h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-white/85">{course.description || course.summary}</p>
          <div className="mt-4 flex items-center gap-2 text-[13px] font-semibold text-white/80">
            <Clock className="h-4 w-4" /> About {course.estimatedHours} hours
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-error-tint bg-error-tint px-4 py-3 text-sm font-medium text-error-c">
            {error}
          </div>
        )}

        {/* CTA */}
        <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-subtle bg-raised p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-bold text-body">
              {course.enrolled ? "You're enrolled 🎉" : "Free to enroll"}
            </p>
            <p className="text-sm text-sub">
              {course.enrolled
                ? "Open the editor pre-loaded with this robot's blocks."
                : "Enroll to unlock the editor for this robot build."}
            </p>
          </div>
          {course.enrolled ? (
            <button
              onClick={handleOpenEditor} disabled={busy}
              className="rounded-xl bg-brand-gradient px-6 py-3 text-[15px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "Opening…" : "Open Editor →"}
            </button>
          ) : (
            <button
              onClick={handleEnroll} disabled={busy}
              className="rounded-xl bg-brand-gradient px-6 py-3 text-[15px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "Enrolling…" : "Enroll for free"}
            </button>
          )}
        </div>

        {/* Details grid */}
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <section className="rounded-2xl border border-subtle bg-raised p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-sub">
              <Target className="h-4 w-4 text-primary-c" /> What you'll learn
            </h2>
            <ul className="mt-3 flex flex-col gap-2.5">
              {course.learningGoals.map((g, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[14px] text-body">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary-c" />
                  {g}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-subtle bg-raised p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-sub">
              <Cpu className="h-4 w-4 text-primary-c" /> Components
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {course.components.map((c, i) => (
                <span key={i} className="rounded-lg border border-subtle bg-hover px-3 py-1.5 text-[13px] font-medium text-sub">
                  {c}
                </span>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
