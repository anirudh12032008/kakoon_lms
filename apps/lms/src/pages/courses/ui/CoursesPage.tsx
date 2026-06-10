import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check, Clock, Flame, Medal, Sparkles, Wrench, Zap } from "lucide-react";
import { fetchCourses, type Course } from "@/shared/api/courses";
import { apiErrorMessage } from "@/shared/api/client";
import { useAuth } from "@/shared/auth/AuthContext";
import { useLaunchStore } from "@/shared/launch/launchStore";
import { buildLaunchContext, EDITOR_MODE_PRESETS } from "@/entities/editor-launch/model/config";
import {
  ACHIEVEMENTS, usePlayerLevel, usePlayerProfile, useDisplayStreak,
} from "@/entities/gamification";
import { DashboardHeader, DifficultyBadge } from "./DashboardHeader";

/** Shared fade-up entrance; `order` staggers siblings. */
const fadeUp = (order: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { type: "spring" as const, stiffness: 320, damping: 28, delay: order * 0.06 },
});

function CourseCard({ course, onOpen, order = 0 }: { course: Course; onOpen: () => void; order?: number }) {
  return (
    <motion.button
      {...fadeUp(order)}
      onClick={onOpen}
      className="group flex flex-col overflow-hidden rounded-2xl border border-subtle bg-raised text-left transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-black/30"
    >
      <div className={`relative bg-gradient-to-br ${course.accent} px-5 pt-5 pb-6`}>
        <div className="flex items-start justify-between">
          <span className="text-4xl drop-shadow">{course.coverEmoji}</span>
          {course.enrolled && (
            <span className="flex items-center gap-1 rounded-full bg-white/25 px-2.5 py-1 text-[11px] font-bold text-white">
              <Check className="h-3 w-3" /> Enrolled
            </span>
          )}
        </div>
        <h3 className="mt-3 text-lg font-black leading-tight text-white">{course.title}</h3>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="text-[14px] leading-relaxed text-sub">{course.summary}</p>

        {/* Progress (enrolled only) */}
        {course.enrolled && (
          <div>
            <div className="mb-1 flex items-center justify-between text-[11px] font-bold">
              <span className="text-hint">Progress</span>
              <span className="text-primary-c">{course.progress ?? 0}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-hover">
              <div
                className="h-full rounded-full bg-brand-gradient transition-all duration-500"
                style={{ width: `${course.progress ?? 0}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <DifficultyBadge difficulty={course.difficulty} />
            <span className="flex items-center gap-1 text-[12px] text-hint">
              <Clock className="h-3.5 w-3.5" /> ~{course.estimatedHours}h
            </span>
          </div>
          <span className="flex items-center gap-1 text-sm font-bold text-primary-c">
            {course.enrolled ? "Open" : "View"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </motion.button>
  );
}

/** Big call-to-action that opens the editor with every block unlocked. */
function FullWorkshopBanner({ onOpen }: { onOpen: () => void }) {
  return (
    <motion.button
      {...fadeUp(1)}
      onClick={onOpen}
      className="group relative mb-7 flex w-full items-center gap-5 overflow-hidden rounded-2xl border border-primary/30 bg-brand-gradient p-6 text-left transition-shadow hover:shadow-xl hover:shadow-primary/20"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/20 text-3xl">
        🧰
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-black text-white">Full Workshop</h2>
          <span className="flex items-center gap-1 rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            <Sparkles className="h-3 w-3" /> Everything unlocked
          </span>
        </div>
        <p className="mt-1 text-sm text-white/85">
          Open a free-build sandbox with every block, sensor, and tool available — no course, no limits.
        </p>
      </div>
      <span className="flex shrink-0 items-center gap-1.5 rounded-xl bg-white/20 px-4 py-2.5 text-sm font-bold text-white transition-transform group-hover:translate-x-0.5">
        <Wrench className="h-4 w-4" /> Open
        <ArrowRight className="h-4 w-4" />
      </span>
    </motion.button>
  );
}

/** XP / streak / badges strip under the page heading. */
function PlayerStatsStrip() {
  const profile = usePlayerProfile();
  const level = usePlayerLevel();
  const streak = useDisplayStreak();
  const badges = Object.keys(profile.unlocked).length;

  const stats = [
    { icon: <Zap className="h-4 w-4 text-primary-c" fill="currentColor" />, value: profile.xp, label: "XP earned" },
    { icon: <span className="text-[15px] font-black text-secondary-c">{level.level}</span>, value: level.title, label: "Level" },
    { icon: <Flame className={`h-4 w-4 ${streak > 0 ? "text-warning-c" : "text-hint"}`} fill={streak > 0 ? "currentColor" : "none"} />, value: streak === 1 ? "1 day" : `${streak} days`, label: "Streak" },
    { icon: <Medal className="h-4 w-4 text-accent-c" />, value: `${badges}/${ACHIEVEMENTS.length}`, label: "Badges" },
  ];

  return (
    <div className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((s, i) => (
        <motion.div key={s.label} {...fadeUp(i * 0.7)} className="flex items-center gap-3 rounded-2xl border border-subtle bg-raised px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-hover">{s.icon}</div>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[15px] font-black text-body">{s.value}</div>
            <div className="text-[11px] font-semibold text-hint">{s.label}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function CoursesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const setLaunchContext = useLaunchStore((s) => s.setContext);
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const openFullWorkshop = () => {
    const preset = EDITOR_MODE_PRESETS.find((p) => p.id === "full-workshop") ?? EDITOR_MODE_PRESETS[0];
    // No courseSlug → unrestricted blocks + local-draft persistence (sandbox).
    setLaunchContext(buildLaunchContext(preset));
    navigate("/editor");
  };

  useEffect(() => {
    let cancelled = false;
    fetchCourses()
      .then((c) => !cancelled && setCourses(c))
      .catch((e) => !cancelled && setError(apiErrorMessage(e, "Could not load courses")));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="h-screen overflow-y-auto bg-page">
      <DashboardHeader />

      <main className="mx-auto max-w-6xl px-5 py-8">
        <motion.div {...fadeUp(0)} className="mb-6">
          <h1 className="text-3xl font-black tracking-tight text-body">
            {user ? `Hey ${user.name.split(" ")[0]} 👋` : "Robot Courses"}
          </h1>
          <p className="mt-1.5 text-[15px] text-sub">
            Pick a robot to build. Enroll for free and jump straight into the block editor.
          </p>
        </motion.div>

        <PlayerStatsStrip />

        <FullWorkshopBanner onOpen={openFullWorkshop} />

        {error && (
          <div className="rounded-xl border border-error-tint bg-error-tint px-4 py-3 text-sm font-medium text-error-c">
            {error} — is the API running on <code className="font-mono">localhost:4000</code>?
          </div>
        )}

        {!courses && !error && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl border border-subtle bg-raised" />
            ))}
          </div>
        )}

        {courses && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course, i) => (
              <CourseCard
                key={course._id}
                course={course}
                order={2 + i}
                onOpen={() => navigate(`/courses/${course.slug}`)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
