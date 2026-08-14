import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  ACHIEVEMENTS,
  DAILY_HARDWARE_XP_CAP,
  XP_REWARDS,
  levelFromXp,
  type LevelInfo,
  type PlayerCounters,
  type XpEvent,
} from "./config";

/**
 * Player progression store. Profiles are kept per user id (so two siblings
 * sharing a laptop don't share a streak) and persisted locally; the shape is
 * deliberately flat so a future `/api/player` sync can mirror it 1:1.
 */

export interface PlayerProfile extends PlayerCounters {
  /** YYYY-MM-DD of the last day with activity (streak bookkeeping). */
  lastActiveDay: string | null;
  /** Daily-capped hardware XP bookkeeping. */
  hardwareXpDay: string | null;
  hardwareXpCount: number;
  /** achievement id → ISO date unlocked. */
  unlocked: Record<string, string>;
}

export interface GamificationToast {
  id: number;
  kind: "xp" | "achievement" | "level-up";
  title: string;
  subtitle?: string;
  icon?: string;
  xp?: number;
}

const EMPTY_PROFILE: PlayerProfile = {
  xp: 0,
  levelsCompleted: 0,
  challengesCompleted: 0,
  coursesCompleted: [],
  runs: 0,
  uploads: 0,
  streakDays: 0,
  lastActiveDay: null,
  hardwareXpDay: null,
  hardwareXpCount: 0,
  unlocked: {},
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Streak: same day → unchanged; consecutive day → +1; gap → reset to 1. */
function bumpStreak(p: PlayerProfile): Pick<PlayerProfile, "streakDays" | "lastActiveDay"> {
  const now = today();
  if (p.lastActiveDay === now) return { streakDays: Math.max(1, p.streakDays), lastActiveDay: now };
  if (p.lastActiveDay === yesterday()) return { streakDays: p.streakDays + 1, lastActiveDay: now };
  return { streakDays: 1, lastActiveDay: now };
}

interface GamificationStore {
  userId: string | null;
  profiles: Record<string, PlayerProfile>;
  /** Transient celebration queue (not persisted). */
  toasts: GamificationToast[];

  setUser: (userId: string | null) => void;
  dismissToast: (id: number) => void;

  /** Generic XP event — bumps streak, evaluates achievements, queues toasts. */
  award: (event: XpEvent, label?: string) => void;
  /** Mirrors a level/challenge being toggled on the course page. */
  recordProgressToggle: (kind: "level" | "challenge", done: boolean) => void;
  /** One-time course completion bonus (idempotent per slug). */
  recordCourseCompleted: (slug: string) => void;
}

let toastId = 0;

export const useGamification = create<GamificationStore>()(
  persist(
    (set, get) => {
      /** Apply a profile mutation for the active user + run achievement checks. */
      const mutate = (
        fn: (p: PlayerProfile) => Partial<PlayerProfile>,
        opts?: { silent?: boolean }
      ) => {
        const { userId, profiles, toasts } = get();
        if (!userId) return;
        const prev = profiles[userId] ?? EMPTY_PROFILE;
        const prevLevel = levelFromXp(prev.xp).level;
        const next: PlayerProfile = { ...prev, ...fn(prev) };

        const newToasts: GamificationToast[] = [];

        // Level-up celebration
        const nextLevel = levelFromXp(next.xp);
        if (!opts?.silent && nextLevel.level > prevLevel) {
          newToasts.push({
            id: ++toastId,
            kind: "level-up",
            icon: "",
            title: `Level ${nextLevel.level} — ${nextLevel.title}!`,
            subtitle: "Keep building to reach the next rank",
          });
        }

        // Newly earned achievements (never revoked, even if counters drop)
        for (const a of ACHIEVEMENTS) {
          if (!next.unlocked[a.id] && a.earned(next)) {
            next.unlocked = { ...next.unlocked, [a.id]: new Date().toISOString() };
            if (!opts?.silent) {
              newToasts.push({
                id: ++toastId,
                kind: "achievement",
                icon: a.icon,
                title: `Achievement unlocked: ${a.title}`,
                subtitle: a.description,
              });
            }
          }
        }

        set({
          profiles: { ...profiles, [userId]: next },
          toasts: [...toasts, ...newToasts],
        });
      };

      return {
        userId: null,
        profiles: {},
        toasts: [],

        setUser: (userId) => set({ userId, toasts: [] }),
        dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),

        award: (event, label) => {
          const isHardware = event === "runCode" || event === "uploadCode";
          let xpGained: number = XP_REWARDS[event];

          mutate((p) => {
            const patch: Partial<PlayerProfile> = { ...bumpStreak(p) };
            if (event === "runCode") patch.runs = p.runs + 1;
            if (event === "uploadCode") patch.uploads = p.uploads + 1;

            if (isHardware) {
              const day = today();
              const count = p.hardwareXpDay === day ? p.hardwareXpCount : 0;
              if (count >= DAILY_HARDWARE_XP_CAP) xpGained = 0;
              patch.hardwareXpDay = day;
              patch.hardwareXpCount = count + (xpGained > 0 ? 1 : 0);
            }
            patch.xp = p.xp + xpGained;
            return patch;
          });

          if (xpGained > 0 && label) {
            set({
              toasts: [
                ...get().toasts,
                { id: ++toastId, kind: "xp", title: label, xp: xpGained },
              ],
            });
          }
        },

        recordProgressToggle: (kind, done) => {
          const xp = kind === "level" ? XP_REWARDS.levelComplete : XP_REWARDS.challengeComplete;
          if (done) {
            mutate((p) => ({
              ...bumpStreak(p),
              xp: p.xp + xp,
              levelsCompleted: p.levelsCompleted + (kind === "level" ? 1 : 0),
              challengesCompleted: p.challengesCompleted + (kind === "challenge" ? 1 : 0),
            }));
            set({
              toasts: [
                ...get().toasts,
                {
                  id: ++toastId,
                  kind: "xp",
                  title: kind === "level" ? "Build level complete" : "Challenge complete",
                  xp,
                },
              ],
            });
          } else {
            // Un-marking takes the XP back (no farming), quietly.
            mutate(
              (p) => ({
                xp: Math.max(0, p.xp - xp),
                levelsCompleted: Math.max(0, p.levelsCompleted - (kind === "level" ? 1 : 0)),
                challengesCompleted: Math.max(0, p.challengesCompleted - (kind === "challenge" ? 1 : 0)),
              }),
              { silent: true }
            );
          }
        },

        recordCourseCompleted: (slug) => {
          const { userId, profiles } = get();
          if (!userId) return;
          const p = profiles[userId] ?? EMPTY_PROFILE;
          if (p.coursesCompleted.includes(slug)) return;
          mutate((prev) => ({
            ...bumpStreak(prev),
            xp: prev.xp + XP_REWARDS.courseComplete,
            coursesCompleted: [...prev.coursesCompleted, slug],
          }));
          set({
            toasts: [
              ...get().toasts,
              {
                id: ++toastId,
                kind: "xp",
                title: "Course complete!",
                xp: XP_REWARDS.courseComplete,
              },
            ],
          });
        },
      };
    },
    {
      name: "kokoon-player-progress",
      partialize: (s) => ({ userId: s.userId, profiles: s.profiles }),
    }
  )
);

/** Convenience selector — the active user's profile (or a blank one). */
export function usePlayerProfile(): PlayerProfile {
  return useGamification((s) => (s.userId ? s.profiles[s.userId] : undefined)) ?? EMPTY_PROFILE;
}

/** The active user's level info, derived from XP. */
export function usePlayerLevel(): LevelInfo {
  const profile = usePlayerProfile();
  return levelFromXp(profile.xp);
}
