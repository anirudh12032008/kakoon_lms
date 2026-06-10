import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, X, Zap, Flame, Medal } from "lucide-react";
import { ACHIEVEMENTS } from "../model/config";
import { usePlayerLevel, usePlayerProfile } from "../model/store";
import { useDisplayStreak } from "./PlayerChip";

function StatTile({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-xl border border-subtle bg-raised px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-base font-black text-body">
        {icon}
        {value}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wide text-hint">{label}</span>
    </div>
  );
}

/** Full-screen achievements & player stats overlay. */
export function AchievementsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const profile = usePlayerProfile();
  const level = usePlayerLevel();
  const streak = useDisplayStreak();
  const unlockedCount = Object.keys(profile.unlocked).length;

  // Portal to <body>: ancestors with backdrop-filter (e.g. the sticky header)
  // would otherwise become the containing block for this fixed overlay.
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-subtle bg-panel shadow-2xl"
          >
            {/* Header */}
            <div className="relative shrink-0 bg-brand-gradient px-6 pb-5 pt-6">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 rounded-full bg-white/15 p-1.5 text-white transition-colors hover:bg-white/30"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl font-black text-white">
                  {level.level}
                </div>
                <div>
                  <h2 className="text-xl font-black text-white">{level.title}</h2>
                  <p className="text-[13px] font-medium text-white/80">
                    {level.intoLevel} / {level.needed} XP to level {level.level + 1}
                  </p>
                </div>
              </div>
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-white transition-all duration-500"
                  style={{ width: `${Math.max(2, level.percent)}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid shrink-0 grid-cols-4 gap-2.5 px-6 py-4">
              <StatTile icon={<Zap className="h-4 w-4 text-primary-c" fill="currentColor" />} value={profile.xp} label="Total XP" />
              <StatTile icon={<Flame className="h-4 w-4 text-warning-c" fill={streak > 0 ? "currentColor" : "none"} />} value={streak} label="Day streak" />
              <StatTile icon={<Medal className="h-4 w-4 text-secondary-c" />} value={`${unlockedCount}/${ACHIEVEMENTS.length}`} label="Badges" />
              <StatTile icon={<span className="text-sm">🏆</span>} value={profile.coursesCompleted.length} label="Courses" />
            </div>

            {/* Badge grid */}
            <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {ACHIEVEMENTS.map((a) => {
                  const unlocked = !!profile.unlocked[a.id];
                  return (
                    <div
                      key={a.id}
                      className={`flex flex-col items-center gap-1.5 rounded-2xl border p-4 text-center transition-colors ${
                        unlocked
                          ? "border-primary-tint bg-raised"
                          : "border-subtle bg-raised/50 opacity-60"
                      }`}
                    >
                      <div className={`flex h-11 w-11 items-center justify-center rounded-full text-2xl ${unlocked ? "bg-primary-tint" : "bg-hover grayscale"}`}>
                        {unlocked ? a.icon : <Lock className="h-4 w-4 text-hint" />}
                      </div>
                      <span className="text-[12.5px] font-bold leading-tight text-body">{a.title}</span>
                      <span className="text-[11px] leading-snug text-sub">{a.description}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
