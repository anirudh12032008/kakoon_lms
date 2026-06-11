import { Flame } from "lucide-react";
import { usePlayerLevel, usePlayerProfile } from "../model/store";

/** Streak shown to the user: 0 if they haven't built today or yesterday. */
export function useDisplayStreak(): number {
  const p = usePlayerProfile();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  now.setDate(now.getDate() - 1);
  const yesterday = now.toISOString().slice(0, 10);
  return p.lastActiveDay === today || p.lastActiveDay === yesterday ? p.streakDays : 0;
}

/**
 * Compact level + XP + streak chip for headers. Click opens the achievements
 * modal (wired by the parent via onClick).
 */
export function PlayerChip({ onClick, compact }: { onClick?: () => void; compact?: boolean }) {
  const level = usePlayerLevel();
  const streak = useDisplayStreak();

  return (
    <button
      onClick={onClick}
      title={`Level ${level.level} · ${level.title} — ${level.intoLevel}/${level.needed} XP to next level`}
      className="group flex items-center gap-2.5 rounded-full border border-subtle bg-raised px-2 py-1.5 pr-3 transition-colors hover:border-primary/40"
    >
      {/* Level badge */}
      <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-gradient px-1.5 text-[11px] font-black text-white">
        {level.level}
      </span>

      {!compact && (
        <span className="hidden flex-col items-start leading-none lg:flex">
          <span className="text-[11px] font-bold text-body">{level.title}</span>
          <span className="mt-1 block h-1 w-16 overflow-hidden rounded-full bg-hover">
            <span
              className="block h-full rounded-full bg-brand-gradient transition-all duration-500"
              style={{ width: `${Math.max(4, level.percent)}%` }}
            />
          </span>
        </span>
      )}

      {/* Streak flame */}
      <span
        className={`flex items-center gap-0.5 text-[11px] font-black ${
          streak > 0 ? "text-warning-c" : "text-hint"
        }`}
      >
        <Flame className={`h-3.5 w-3.5 ${streak > 0 ? "anim-flame" : ""}`} fill={streak > 0 ? "currentColor" : "none"} />
        {streak}
      </span>
    </button>
  );
}
