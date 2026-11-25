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

  const summary = `Level ${level.level}, ${level.title}. ${streak}-day streak. ${level.intoLevel} of ${level.needed} XP to the next level.`;

  return (
    <button
      onClick={onClick}
      title={summary}
      aria-label={`${summary} Open achievements`}
      className="flex min-h-9 items-center gap-2 rounded-md border border-subtle px-2 pr-2.5 transition-colors hover:bg-hover"
    >
      {/* Level badge */}
      <span className="flex h-6 min-w-6 items-center justify-center rounded bg-hover px-1.5 text-xs font-bold text-body">
        {level.level}
      </span>

      {!compact && (
        <span className="hidden flex-col items-start leading-none lg:flex">
          <span className="text-xs font-semibold text-body">{level.title}</span>
          <span className="mt-1 block h-1 w-16 overflow-hidden rounded-full bg-hover">
            <span
              className="block h-full rounded-full bg-brand-gradient transition-[width] duration-200"
              style={{ width: `${Math.max(4, level.percent)}%` }}
            />
          </span>
        </span>
      )}

      {/* Streak */}
      <span className="flex items-center gap-0.5 text-xs font-bold text-sub">
        <Flame className="h-3.5 w-3.5" fill={streak > 0 ? "currentColor" : "none"} aria-hidden="true" />
        {streak}
      </span>
    </button>
  );
}
