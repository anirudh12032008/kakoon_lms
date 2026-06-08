import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Hammer, Trophy, ChevronDown, Target, PartyPopper } from "lucide-react";
import type { useCourseMissions } from "../model/useCourseMissions";

type Missions = ReturnType<typeof useCourseMissions>;

export function MissionsPanel({ missions }: { missions: Missions }) {
  const { course, completedLevels, completedChallenges, progress, justCompleted, clearJustCompleted } = missions;
  const [open, setOpen] = useState(true);
  const [toast, setToast] = useState<{ kind: string; title: string } | null>(null);

  // Surface a celebration toast when something auto-completes.
  useEffect(() => {
    if (!justCompleted) return;
    setToast(justCompleted);
    const t = setTimeout(() => {
      setToast(null);
      clearJustCompleted();
    }, 3200);
    return () => clearTimeout(t);
  }, [justCompleted, clearJustCompleted]);

  if (!course) return null;

  const totalItems = course.levels.length + course.challenges.length;
  const doneItems = completedLevels.size + completedChallenges.size;
  // First incomplete level = the "current" objective.
  const activeLevel = course.levels.find((l) => !completedLevels.has(l.key));

  return (
    <>
      {/* Celebration toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="mission-toast"
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            className="absolute left-1/2 top-3 z-40 -translate-x-1/2 flex items-center gap-2 rounded-xl border border-success/40 bg-panel px-4 py-2.5 shadow-2xl"
          >
            <PartyPopper className="h-4 w-4 text-success-c" />
            <span className="text-sm font-bold text-body">
              {toast.kind === "level" ? "Level complete!" : "Challenge complete!"}
            </span>
            <span className="text-sm text-sub max-w-[220px] truncate">{toast.title}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel — top-right so it never covers the blocks palette on the left */}
      <div className="absolute right-3 top-3 z-30 w-[270px] select-none">
        <div className="rounded-2xl border border-subtle bg-panel/95 shadow-2xl backdrop-blur-md overflow-hidden">
          {/* Header / progress */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex w-full items-center gap-2.5 px-3.5 py-3 text-left"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-gradient text-base">
              {course.coverEmoji}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-bold text-body">{course.title}</div>
              <div className="text-[11px] text-hint">{doneItems}/{totalItems} done · {progress}%</div>
            </div>
            <ChevronDown className={`h-4 w-4 shrink-0 text-hint transition-transform ${open ? "" : "-rotate-90"}`} />
          </button>

          <div className="px-3.5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-hover">
              <div className="h-full rounded-full bg-brand-gradient transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="max-h-[52vh] overflow-y-auto px-3.5 pb-3 pt-3">
                  {/* Current objective */}
                  {activeLevel && (
                    <div className="mb-3 rounded-xl border border-primary/30 bg-primary-tint p-2.5">
                      <div className="mb-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-primary-c">
                        <Target className="h-3 w-3" /> Current objective
                      </div>
                      <div className="text-[12px] font-semibold text-body">{activeLevel.label}</div>
                      <div className="text-[11.5px] text-sub">{activeLevel.editor}</div>
                    </div>
                  )}

                  {/* Levels */}
                  <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-hint">
                    <Hammer className="h-3 w-3" /> Build levels
                  </div>
                  <div className="flex flex-col gap-1">
                    {course.levels.map((l) => {
                      const done = completedLevels.has(l.key);
                      return (
                        <div key={l.key} className="flex items-start gap-2 rounded-lg px-1.5 py-1">
                          {done
                            ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success-c" />
                            : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-hint" />}
                          <div className="min-w-0">
                            <div className={`text-[12px] font-semibold ${done ? "text-sub line-through" : "text-body"}`}>{l.label}</div>
                            <div className="truncate text-[11px] text-hint">{l.editor}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Challenges */}
                  {course.challenges.length > 0 && (
                    <>
                      <div className="mb-1 mt-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-hint">
                        <Trophy className="h-3 w-3 text-warning-c" /> Challenges
                      </div>
                      <div className="flex flex-col gap-1">
                        {course.challenges.map((c) => {
                          const done = completedChallenges.has(c.key);
                          return (
                            <div key={c.key} className="flex items-start gap-2 rounded-lg px-1.5 py-1">
                              {done
                                ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-warning-c" />
                                : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-hint" />}
                              <div className={`text-[12px] ${done ? "text-sub line-through" : "text-body"}`}>{c.title}</div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}

                  <p className="mt-3 text-[10px] leading-relaxed text-hint">
                    ✨ Levels &amp; challenges complete automatically as you add the right blocks.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
