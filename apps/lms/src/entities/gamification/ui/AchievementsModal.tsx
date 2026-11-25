import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { GraduationCap, Lock, Medal, X, Zap, Flame } from "lucide-react";
import { ACHIEVEMENTS } from "../model/config";
import { usePlayerLevel, usePlayerProfile } from "../model/store";
import { useDisplayStreak } from "./PlayerChip";

function StatTile({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col gap-1 bg-panel px-4 py-3">
      <dt className="flex items-center gap-1.5 text-xs font-semibold text-sub">{icon} {label}</dt>
      <dd className="text-lg font-semibold text-body">{value}</dd>
    </div>
  );
}

/** Achievements & player stats dialog. */
export function AchievementsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const profile = usePlayerProfile();
  const level = usePlayerLevel();
  const streak = useDisplayStreak();
  const unlockedCount = Object.keys(profile.unlocked).length;
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  // Parents pass a fresh onClose each render; a ref keeps the effect below from
  // re-running (and re-stealing focus) while the dialog is open.
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; });

  // Modal keyboard contract: focus moves in, Tab stays in, Escape closes,
  // and focus returns to whatever opened the dialog.
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onCloseRef.current();
      if (e.key !== "Tab" || !dialogRef.current) return;
      const stops = dialogRef.current.querySelectorAll<HTMLElement>("button, [tabindex='0']");
      const first = stops[0];
      const last = stops[stops.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [open]);

  // Portal to <body> so no ancestor can become the containing block for this fixed overlay.
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4"
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="achievements-title"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85dvh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-subtle bg-panel shadow-xl"
          >
            {/* Header */}
            <div className="shrink-0 border-b border-subtle px-5 pb-5 pt-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <div aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-gradient text-xl font-bold text-on-primary">
                    {level.level}
                  </div>
                  <div className="min-w-0">
                    <h2 id="achievements-title" className="font-display text-2xl font-semibold text-body">
                      <span className="sr-only">Level {level.level}: </span>{level.title}
                    </h2>
                    <p className="text-sm text-sub">
                      {level.intoLevel} of {level.needed} XP to level {level.level + 1}
                    </p>
                  </div>
                </div>
                <button
                  ref={closeRef}
                  onClick={onClose}
                  aria-label="Close achievements"
                  className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-sub transition-colors hover:bg-hover hover:text-body"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-hover" aria-hidden="true">
                <div
                  className="h-full rounded-full bg-brand-gradient transition-[width] duration-200"
                  style={{ width: `${Math.max(2, level.percent)}%` }}
                />
              </div>
            </div>

            {/* Scrolls as one region; focusable so the keyboard can scroll it. */}
            <div tabIndex={0} role="group" aria-label="Stats and badges" className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-subtle bg-[var(--k-border)] sm:grid-cols-4">
                <StatTile icon={<Zap className="h-3.5 w-3.5" aria-hidden="true" />} value={profile.xp} label="Total XP" />
                <StatTile icon={<Flame className="h-3.5 w-3.5" aria-hidden="true" />} value={streak} label="Day streak" />
                <StatTile icon={<Medal className="h-3.5 w-3.5" aria-hidden="true" />} value={`${unlockedCount} of ${ACHIEVEMENTS.length}`} label="Badges" />
                <StatTile icon={<GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />} value={profile.coursesCompleted.length} label="Courses" />
              </dl>

              <h3 className="mt-6 text-sm font-semibold uppercase tracking-wider text-sub">Badges</h3>
              <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {ACHIEVEMENTS.map((a) => {
                  const unlocked = !!profile.unlocked[a.id];
                  return (
                    <li
                      key={a.id}
                      className={`flex items-start gap-3 rounded-md border p-3.5 ${
                        unlocked ? "border-subtle bg-raised" : "border-dashed border-subtle"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          unlocked ? "bg-brand-gradient text-on-primary" : "bg-hover text-sub"
                        }`}
                      >
                        {unlocked ? <Medal className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold leading-snug text-body">{a.title}</span>
                        <span className="mt-0.5 block text-[13px] leading-snug text-sub">{a.description}</span>
                        <span className="mt-1 block text-xs font-semibold text-sub">{unlocked ? "Earned" : "Locked"}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
