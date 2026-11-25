import { APP_NAME } from "@/shared/config/brand";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Check, Clock, Cpu, Target, CheckCircle2, Circle, Hammer, Code2, Trophy,
} from "lucide-react";
import {
  fetchCourse, enrollInCourse, openCourseEditor, courseToLaunchContext, setProgress, type Course,
} from "@/shared/api/courses";
import { apiErrorMessage } from "@/shared/api/client";
import { useLaunchStore } from "@/shared/launch/launchStore";
import { useProjectStore } from "@/shared/launch/projectStore";
import { XP_REWARDS, useGamification } from "@/entities/gamification";
import { DashboardHeader, DifficultyBadge } from "./DashboardHeader";

/** Fade-up once when the block scrolls into view. */
function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.2, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}

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
      useProjectStore.getState().clearActiveProject();
      setLaunchContext(courseToLaunchContext(fresh));
      navigate("/editor");
    } catch (e) {
      setError(apiErrorMessage(e, "Could not open the editor"));
      setBusy(false);
    }
  };

  const recordProgressToggle = useGamification((s) => s.recordProgressToggle);
  const recordCourseCompleted = useGamification((s) => s.recordCourseCompleted);

  const handleToggle = async (kind: "level" | "challenge", key: string, done: boolean) => {
    if (!course?.enrolled) return;
    // Optimistic update, then reconcile with the server's recomputed progress.
    const listKey = kind === "level" ? "completedLevels" : "completedChallenges";
    const current = new Set(course[listKey] ?? []);
    if (done) current.add(key); else current.delete(key);
    setCourse({ ...course, [listKey]: Array.from(current) });
    recordProgressToggle(kind, done);
    try {
      const res = await setProgress(course.slug, kind, key, done);
      if (res.status === "completed") recordCourseCompleted(course.slug);
      setCourse((c) => c && ({
        ...c,
        completedLevels: res.completedLevels,
        completedChallenges: res.completedChallenges,
        progress: res.progress,
      }));
    } catch (e) {
      // Roll the optimistic XP back if the server rejected the toggle.
      recordProgressToggle(kind, !done);
      setError(apiErrorMessage(e, "Could not save progress"));
    }
  };

  if (error && !course) {
    return (
      <div className="h-full overflow-y-auto bg-page">
        <title>{`Course unavailable · ${APP_NAME}`}</title>
        <DashboardHeader />
        <main id="main" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-16 text-center outline-none sm:px-6">
          <h1 className="font-display text-2xl font-semibold text-body">This course is unavailable</h1>
          <p role="alert" className="mt-2 text-sm text-sub">{error}</p>
          <button
            onClick={() => navigate("/courses")}
            className="mt-5 inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary-c underline underline-offset-2"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Learn
          </button>
        </main>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="h-full overflow-y-auto bg-page">
        <DashboardHeader />
        <main id="main" tabIndex={-1} className="mx-auto max-w-4xl px-4 py-8 outline-none sm:px-6">
          <p role="status" className="sr-only">Loading course</p>
          <div aria-hidden="true" className="h-44 animate-pulse rounded-lg border border-subtle bg-panel" />
        </main>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-page">
      <title>{`${course.title} · ${APP_NAME}`}</title>
      <DashboardHeader />

      <main id="main" tabIndex={-1} className="mx-auto max-w-4xl px-4 pb-16 pt-5 outline-none sm:px-6">
        <button
          onClick={() => navigate("/courses")}
          className="mb-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-sub transition-colors hover:text-body"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to Learn
        </button>

        {/* Course summary */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="rounded-lg border border-subtle bg-panel p-6 sm:p-8"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-sub">Robot kit course</span>
            <DifficultyBadge difficulty={course.difficulty} />
            {course.enrolled && (
              <span className="flex items-center gap-1 rounded bg-hover px-2 py-0.5 text-xs font-semibold text-body">
                <Check className="h-3.5 w-3.5" aria-hidden="true" /> Enrolled
              </span>
            )}
          </div>
          <h1 className="mt-3 font-display text-3xl font-semibold text-body sm:text-4xl">{course.title}</h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-sub">{course.description || course.summary}</p>
          <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-sub">
            <Clock className="h-4 w-4" aria-hidden="true" /> About {course.estimatedHours} hours
          </div>
        </motion.div>

        {error && (
          <div role="alert" className="mt-5 rounded-md border border-error-tint bg-error-tint px-4 py-3 text-sm font-medium text-error-c">
            {error}
          </div>
        )}

        {/* CTA */}
        <div className="mt-5 flex flex-col gap-3 rounded-lg border border-subtle bg-panel p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-bold text-body">
              {course.enrolled ? "You're enrolled" : "Free to enroll"}
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
              className="min-h-11 shrink-0 rounded-md bg-brand-gradient px-6 text-base font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Opening…" : "Open editor"}
            </button>
          ) : (
            <button
              onClick={handleEnroll} disabled={busy}
              className="min-h-11 shrink-0 rounded-md bg-brand-gradient px-6 text-base font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Enrolling…" : "Enroll for free"}
            </button>
          )}
        </div>

        {/* Details grid */}
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
          <Reveal>
          <section className="h-full rounded-lg border border-subtle bg-panel p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-sub">
              <Target className="h-4 w-4 text-primary-c" aria-hidden="true" /> What you'll learn
            </h2>
            <ul className="mt-3 flex flex-col gap-2.5">
              {course.learningGoals.map((g, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[14px] text-body">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary-c" aria-hidden="true" />
                  {g}
                </li>
              ))}
            </ul>
          </section>
          </Reveal>

          <Reveal delay={0.08}>
          <section className="h-full rounded-lg border border-subtle bg-panel p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-sub">
              <Cpu className="h-4 w-4 text-primary-c" aria-hidden="true" /> Components
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {course.components.map((c, i) => (
                <span key={i} className="rounded-lg border border-subtle bg-hover px-3 py-1.5 text-[13px] font-medium text-sub">
                  {c}
                </span>
              ))}
            </div>
          </section>
          </Reveal>
        </div>

        {/* Progress bar (enrolled only) */}
        {course.enrolled && (
          <div className="mt-6 rounded-lg border border-subtle bg-panel p-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-bold text-body">Your progress</span>
              <span className="text-sm font-bold text-primary-c">{course.progress ?? 0}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-hover" aria-hidden="true">
              <div
                className="h-full rounded-full bg-brand-gradient transition-[width] duration-200"
                style={{ width: `${course.progress ?? 0}%` }}
              />
            </div>
          </div>
        )}

        {/* Build levels */}
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold text-body">
            <Hammer className="h-5 w-5 text-primary-c" aria-hidden="true" /> Build levels
          </h2>
          <p className="mb-4 text-sm text-sub">
            Follow these in order - each level pairs a hands-on build step with what you'll code in the editor.
          </p>
          <div className="flex flex-col">
            {course.levels.map((lv, idx) => {
              const completedSet = new Set(course.completedLevels ?? []);
              const done = completedSet.has(lv.key);
              // The quest marker: first level that isn't done yet.
              const isCurrent = !done && course.levels.slice(0, idx).every((l) => completedSet.has(l.key));
              const prevDone = idx > 0 && completedSet.has(course.levels[idx - 1].key);
              return (
                <Reveal key={lv.key} delay={Math.min(idx * 0.04, 0.16)}>
                {/* Connector rail between quest steps */}
                {idx > 0 && (
                  <div aria-hidden="true" className={`ml-[31px] h-4 w-0.5 ${prevDone ? "bg-primary" : "bg-hover"}`} />
                )}
                <div
                  className={`rounded-lg border bg-panel p-4 transition-colors ${
                    isCurrent ? "border-[var(--k-primary-text)]" : "border-subtle"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Step number / done */}
                    <div aria-hidden="true" className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${
                      done || isCurrent ? "bg-brand-gradient text-on-primary" : "bg-hover text-sub"
                    }`}>
                      {done ? <Check className="h-4 w-4" /> : idx}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-sub">{lv.label}</h3>
                        <span className={`rounded px-2 py-0.5 text-xs font-semibold ${
                          done ? "bg-primary-tint text-primary-c" : "bg-hover text-sub"
                        }`}>
                          {done && <span className="sr-only">Completed, </span>}+{XP_REWARDS.levelComplete} XP
                        </span>
                        {isCurrent && (
                          <span className="rounded bg-brand-gradient px-2 py-0.5 text-xs font-semibold text-on-primary">
                            Up next
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        <div className="rounded-md border border-subtle bg-page px-3 py-2">
                          <div className="mb-0.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-sub">
                            <Hammer className="h-3 w-3" aria-hidden="true" /> Build
                          </div>
                          <p className="text-[13.5px] leading-snug text-body">{lv.build}</p>
                        </div>
                        <div className="rounded-md border border-subtle bg-page px-3 py-2">
                          <div className="mb-0.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-sub">
                            <Code2 className="h-3 w-3" aria-hidden="true" /> Editor
                          </div>
                          <p className="text-[13.5px] leading-snug text-body">{lv.editor}</p>
                        </div>
                      </div>
                    </div>

                    {/* Complete toggle */}
                    {course.enrolled && (
                      <button
                        onClick={() => handleToggle("level", lv.key, !done)}
                        title={done ? "Mark incomplete" : "Mark complete"}
                        aria-label={`${lv.label}: mark ${done ? "incomplete" : "complete"}`}
                        aria-pressed={done}
                        className="-m-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-hover"
                      >
                        {done
                          ? <CheckCircle2 className="h-6 w-6 text-primary-c" aria-hidden="true" />
                          : <Circle className="h-6 w-6 text-sub" aria-hidden="true" />}
                      </button>
                    )}
                  </div>
                </div>
                </Reveal>
              );
            })}
          </div>
        </section>

        {/* Challenges */}
        {course.challenges.length > 0 && (
          <section className="mt-7 mb-4">
            <h2 className="mb-3 flex items-center gap-2 text-xl font-semibold text-body">
              <Trophy className="h-5 w-5 text-primary-c" aria-hidden="true" /> Challenges
            </h2>
            <p className="mb-4 text-sm text-sub">
              Optional add-ons and modifications to try once your robot is built.
            </p>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {course.challenges.map((c) => {
                const done = course.completedChallenges?.includes(c.key) ?? false;
                return (
                  <button
                    key={c.key}
                    onClick={() => course.enrolled && handleToggle("challenge", c.key, !done)}
                    disabled={!course.enrolled}
                    aria-pressed={done}
                    className={`flex min-h-11 items-center gap-3 rounded-md border p-3.5 text-left transition-colors ${
                      done ? "border-primary-tint bg-primary-tint" : "border-subtle bg-panel hover:bg-raised"
                    } ${!course.enrolled ? "cursor-default" : ""}`}
                  >
                    {done
                      ? <CheckCircle2 className="h-5 w-5 shrink-0 text-primary-c" aria-hidden="true" />
                      : <Circle className="h-5 w-5 shrink-0 text-sub" aria-hidden="true" />}
                    <span className={`flex-1 text-[14px] font-medium ${done ? "text-body" : "text-sub"}`}>{c.title}</span>
                    <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${
                      done ? "text-primary-c" : "bg-hover text-sub"
                    }`}>
                      +{XP_REWARDS.challengeComplete} XP
                    </span>
                  </button>
                );
              })}
            </div>
            {!course.enrolled && (
              <p className="mt-3 text-[13px] text-sub">Enroll to track levels and challenges.</p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
