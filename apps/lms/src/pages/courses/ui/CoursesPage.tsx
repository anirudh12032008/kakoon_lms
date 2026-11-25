import { APP_NAME } from "@/shared/config/brand";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Check, Clock, Cpu, Flame, Medal, SquarePen, TrendingUp, Zap } from "lucide-react";
import { fetchCourses, type Course } from "@/shared/api/courses";
import { useAuth } from "@/shared/auth/AuthContext";
import { useLaunchStore } from "@/shared/launch/launchStore";
import { useProjectStore } from "@/shared/launch/projectStore";
import { buildLaunchContext, EDITOR_MODE_PRESETS } from "@/entities/editor-launch/model/config";
import {
  ACHIEVEMENTS, usePlayerLevel, usePlayerProfile, useDisplayStreak,
} from "@/entities/gamification";
import { builtinTutorials, type Tutorial } from "@/features/editor/tutorial/lib/tutorials";
import { BOARDS, BOARD_ORDER, useBoardStore, type BoardId } from "@/entities/board";
import { DashboardHeader, DifficultyBadge } from "./DashboardHeader";

const cardClass =
  "group flex h-full w-full flex-col rounded-lg border border-subtle bg-panel p-5 text-left transition-colors duration-150 hover:border-[var(--k-primary-text)] hover:bg-raised";

const sectionHead = "flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-subtle pb-4";

const LEVELS: Record<Tutorial["difficulty"], number> = { Easy: 1, Medium: 2, Hard: 3 };

/** Difficulty as a word plus a three-step meter, so it never relies on colour. */
function DifficultyMeter({ difficulty }: { difficulty: Tutorial["difficulty"] }) {
  return (
    <span className="flex items-center gap-2 text-xs font-semibold text-sub">
      <span className="flex items-end gap-0.5" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={`w-1 rounded-sm ${n <= LEVELS[difficulty] ? "bg-[var(--k-muted)]" : "bg-[var(--k-border)]"}`}
            style={{ height: 4 + n * 3 }}
          />
        ))}
      </span>
      {difficulty}
    </span>
  );
}

/** One built-in IoT project. The whole card is the button. */
function ProjectCard({ tutorial, index, onOpen }: { tutorial: Tutorial; index: number; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className={cardClass}>
      <span className="flex w-full items-center justify-between">
        <span className="font-mono text-xs font-semibold text-sub" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </span>
        <DifficultyMeter difficulty={tutorial.difficulty} />
      </span>
      <span className="mt-4 text-lg font-semibold leading-snug text-body">{tutorial.title}</span>
      <span className="mt-2 text-sm leading-relaxed text-sub">{tutorial.description}</span>
      {tutorial.components.length > 0 && (
        <span className="mt-3 text-[13px] leading-relaxed text-sub">
          <span className="font-semibold text-body">Parts: </span>
          {tutorial.components
            .filter((c) => c !== "if_else" && c !== "forever_loop")
            .map((c) => c.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()))
            .join(", ")}
        </span>
      )}
      <span className="mt-auto flex items-center gap-1.5 pt-5 text-sm font-semibold text-primary-c">
        Open in editor
        <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </button>
  );
}

/** A DB-backed robot kit course. Secondary to the IoT projects, so it stays compact. */
function CourseCard({ course }: { course: Course }) {
  const progress = course.progress ?? 0;
  return (
    <Link to={`/courses/${course.slug}`} className={cardClass}>
      <span className="flex w-full items-center justify-between gap-2">
        <DifficultyBadge difficulty={course.difficulty} />
        <span className="flex items-center gap-1 text-xs text-sub">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" /> About {course.estimatedHours} h
        </span>
      </span>
      <span className="mt-3 text-base font-semibold leading-snug text-body">{course.title}</span>
      <span className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-sub">{course.summary}</span>
      <span className="mt-auto block w-full pt-4">
        {course.enrolled ? (
          <>
            <span className="flex items-center justify-between text-xs font-semibold text-sub">
              <span className="flex items-center gap-1">
                <Check className="h-3.5 w-3.5" aria-hidden="true" /> Enrolled
              </span>
              <span>{progress}% complete</span>
            </span>
            <span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-hover" aria-hidden="true">
              <span className="block h-full rounded-full bg-brand-gradient" style={{ width: `${progress}%` }} />
            </span>
          </>
        ) : (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-primary-c">
            View course <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
      </span>
    </Link>
  );
}

/** XP / level / streak / badges, as one quiet row of figures. */
function ProgressSummary() {
  const profile = usePlayerProfile();
  const level = usePlayerLevel();
  const streak = useDisplayStreak();
  const badges = Object.keys(profile.unlocked).length;

  const stats = [
    { icon: Zap, label: "XP earned", value: String(profile.xp) },
    { icon: TrendingUp, label: "Level", value: `${level.level} · ${level.title}` },
    { icon: Flame, label: "Streak", value: streak === 1 ? "1 day" : `${streak} days` },
    { icon: Medal, label: "Badges", value: `${badges} of ${ACHIEVEMENTS.length}` },
  ];

  return (
    <section aria-labelledby="progress-heading" className="mt-12">
      <h2 id="progress-heading" className="text-sm font-semibold uppercase tracking-wider text-sub">Your progress</h2>
      {/* gap-px over a border-coloured ground draws the hairlines between cells */}
      <dl className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-subtle bg-[var(--k-border)] sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="flex min-w-0 flex-col gap-1 bg-panel px-4 py-3.5">
            <dt className="flex items-center gap-1.5 text-xs font-semibold text-sub">
              <s.icon className="h-3.5 w-3.5" aria-hidden="true" /> {s.label}
            </dt>
            <dd className="truncate text-base font-semibold text-body">{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function CoursesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const setLaunchContext = useLaunchStore((s) => s.setContext);
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const openFullWorkshop = () => {
    const preset = EDITOR_MODE_PRESETS.find((p) => p.id === "full-workshop") ?? EDITOR_MODE_PRESETS[0];
    // No courseSlug → unrestricted blocks + local-draft persistence (sandbox).
    useProjectStore.getState().clearActiveProject();
    setLaunchContext(buildLaunchContext(preset));
    navigate("/editor");
  };

  // Built-in example projects for the selected board; opened straight in the editor.
  const boardId = useBoardStore((s) => s.boardId);
  const setBoard = useBoardStore((s) => s.setBoard);
  const demos = builtinTutorials(boardId);
  const openDemo = (id: string) => {
    sessionStorage.setItem("codelab-open-demo", id); // picked up by the editor (useTutorial)
    openFullWorkshop();
  };

  useEffect(() => {
    let cancelled = false;
    fetchCourses()
      .then((c) => !cancelled && setCourses(c))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const firstName = user?.name.trim().split(" ")[0];
  // The robot kit courses are secondary: the section disappears when there are none.
  const showCourses = failed || !courses || courses.length > 0;

  return (
    <div className="h-full overflow-y-auto bg-page">
      <title>{`Learn · ${APP_NAME}`}</title>
      <DashboardHeader />

      <main id="main" tabIndex={-1} className="mx-auto max-w-6xl px-4 pb-20 pt-8 outline-none sm:px-6 sm:pt-12">
        <h1 className="font-display text-3xl font-semibold text-body sm:text-4xl">
          {firstName ? `Hello, ${firstName}` : "Learn"}
        </h1>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-sub">
          Choose a project for your board and open it in the block editor.
        </p>

        {/* ── IoT projects: the main thing on this page ── */}
        <section aria-labelledby="iot-heading" className="mt-10">
          <div className={sectionHead}>
            <div>
              <h2 id="iot-heading" className="text-2xl font-semibold text-body">IoT Projects</h2>
              <p className="mt-1 text-sm text-sub" aria-live="polite">
                {demos.length === 1 ? "1 project" : `${demos.length} projects`} ready to open on {BOARDS[boardId].label}
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-body">
              <Cpu className="h-4 w-4 text-sub" aria-hidden="true" />
              Board
              <select
                value={boardId}
                onChange={(e) => setBoard(e.target.value as BoardId)}
                className="select w-auto min-w-40 text-sm font-semibold"
              >
                {BOARD_ORDER.map((id) => (
                  <option key={id} value={id}>{BOARDS[id].label}</option>
                ))}
              </select>
            </label>
          </div>

          {demos.length > 0 ? (
            <ol className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {demos.map((t, i) => (
                <li key={t.id}>
                  <ProjectCard tutorial={t} index={i} onOpen={() => openDemo(t.id)} />
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-5 text-sm text-sub">
              There are no ready-made projects for this board yet. You can still start from a blank workspace.
            </p>
          )}

          <div className="mt-4 flex flex-col gap-4 rounded-lg border border-subtle bg-panel p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-body">Start from a blank workspace</h3>
              <p className="mt-1 text-sm text-sub">
                Every block, sensor and tool is available. Build your own idea from scratch.
              </p>
            </div>
            <button
              onClick={openFullWorkshop}
              className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-brand-gradient px-5 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
            >
              <SquarePen className="h-4 w-4" aria-hidden="true" /> Open blank workspace
            </button>
          </div>
        </section>

        <ProgressSummary />

        {/* ── Robot kit courses: older, DB-backed, secondary ── */}
        {showCourses && (
          <section aria-labelledby="courses-heading" className="mt-12">
            <div className={sectionHead}>
              <div>
                <h2 id="courses-heading" className="text-lg font-semibold text-body">Robot kit courses</h2>
                <p className="mt-1 text-sm text-sub">Guided builds for the robot kits, with levels and challenges.</p>
              </div>
            </div>

            {failed && (
              <p role="status" className="mt-5 text-sm text-sub">
                The robot kit courses could not be loaded right now. The IoT projects above are not affected.{" "}
                <button
                  onClick={() => { setFailed(false); setAttempt((n) => n + 1); }}
                  className="inline-flex min-h-6 items-center font-semibold text-primary-c underline underline-offset-2"
                >
                  Try again
                </button>
              </p>
            )}

            {!courses && !failed && (
              <div role="status" className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <span className="sr-only">Loading courses</span>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} aria-hidden="true" className="h-36 animate-pulse rounded-lg border border-subtle bg-panel" />
                ))}
              </div>
            )}

            {courses && !failed && (
              <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <li key={course._id}>
                    <CourseCard course={course} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
