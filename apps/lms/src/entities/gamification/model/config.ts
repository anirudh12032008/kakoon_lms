/**
 * Gamification config — XP rewards, the level curve, and achievement
 * definitions. Tune the numbers here; the store and UI adapt automatically.
 */

// ── XP rewards ──────────────────────────────────────────────────────────────
export const XP_REWARDS = {
  levelComplete: 50, // finishing a build level in a course
  challengeComplete: 30, // finishing an optional challenge
  courseComplete: 200, // one-time bonus when a course hits 100%
  runCode: 10, // running code on the robot (daily-capped)
  uploadCode: 15, // saving code onto the ESP32 (daily-capped)
} as const;

export type XpEvent = keyof typeof XP_REWARDS;

/** Hardware XP (run/upload) only counts this many times per day — no farming. */
export const DAILY_HARDWARE_XP_CAP = 5;

// ── Level curve ─────────────────────────────────────────────────────────────
/** XP needed to go from `level` to `level + 1`. */
export function xpForNextLevel(level: number): number {
  return 100 + (level - 1) * 50;
}

export interface LevelInfo {
  level: number;
  title: string;
  /** XP earned inside the current level. */
  intoLevel: number;
  /** XP required to finish the current level. */
  needed: number;
  /** 0–100 progress through the current level. */
  percent: number;
}

const LEVEL_TITLES: [number, string][] = [
  [1, "Spark"],
  [3, "Tinkerer"],
  [5, "Builder"],
  [8, "Circuit Wizard"],
  [12, "Engineer"],
  [16, "Inventor"],
  [20, "Robot Master"],
];

export function titleForLevel(level: number): string {
  let title = LEVEL_TITLES[0][1];
  for (const [min, t] of LEVEL_TITLES) {
    if (level >= min) title = t;
  }
  return title;
}

export function levelFromXp(xp: number): LevelInfo {
  let level = 1;
  let remaining = Math.max(0, xp);
  while (remaining >= xpForNextLevel(level)) {
    remaining -= xpForNextLevel(level);
    level += 1;
  }
  const needed = xpForNextLevel(level);
  return {
    level,
    title: titleForLevel(level),
    intoLevel: remaining,
    needed,
    percent: Math.round((remaining / needed) * 100),
  };
}

// ── Achievements ────────────────────────────────────────────────────────────
/** Counters the store maintains; achievement conditions read these. */
export interface PlayerCounters {
  xp: number;
  levelsCompleted: number;
  challengesCompleted: number;
  coursesCompleted: string[];
  runs: number;
  uploads: number;
  streakDays: number;
}

export interface AchievementDef {
  id: string;
  icon: string;
  title: string;
  description: string;
  /** Returns true once the achievement should unlock. */
  earned: (c: PlayerCounters) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first-steps",
    icon: "",
    title: "First Steps",
    description: "Complete your first build level",
    earned: (c) => c.levelsCompleted >= 1,
  },
  {
    id: "assembly-line",
    icon: "",
    title: "Assembly Line",
    description: "Complete 5 build levels",
    earned: (c) => c.levelsCompleted >= 5,
  },
  {
    id: "master-builder",
    icon: "",
    title: "Master Builder",
    description: "Complete 15 build levels",
    earned: (c) => c.levelsCompleted >= 15,
  },
  {
    id: "challenger",
    icon: "",
    title: "Challenger",
    description: "Finish your first challenge",
    earned: (c) => c.challengesCompleted >= 1,
  },
  {
    id: "challenge-hunter",
    icon: "",
    title: "Challenge Hunter",
    description: "Finish 5 challenges",
    earned: (c) => c.challengesCompleted >= 5,
  },
  {
    id: "course-champion",
    icon: "",
    title: "Course Champion",
    description: "Complete an entire course",
    earned: (c) => c.coursesCompleted.length >= 1,
  },
  {
    id: "robot-collector",
    icon: "",
    title: "Robot Collector",
    description: "Complete 3 courses",
    earned: (c) => c.coursesCompleted.length >= 3,
  },
  {
    id: "ignition",
    icon: "",
    title: "Ignition",
    description: "Run code on your robot for the first time",
    earned: (c) => c.runs >= 1,
  },
  {
    id: "test-pilot",
    icon: "",
    title: "Test Pilot",
    description: "Run code on your robot 25 times",
    earned: (c) => c.runs >= 25,
  },
  {
    id: "ship-it",
    icon: "",
    title: "Ship It",
    description: "Upload a program to your ESP32",
    earned: (c) => c.uploads >= 1,
  },
  {
    id: "on-a-roll",
    icon: "",
    title: "On a Roll",
    description: "Keep a 3-day building streak",
    earned: (c) => c.streakDays >= 3,
  },
  {
    id: "unstoppable",
    icon: "",
    title: "Unstoppable",
    description: "Keep a 7-day building streak",
    earned: (c) => c.streakDays >= 7,
  },
  {
    id: "rising-star",
    icon: "",
    title: "Rising Star",
    description: "Reach level 5",
    earned: (c) => levelFromXp(c.xp).level >= 5,
  },
  {
    id: "robot-master",
    icon: "",
    title: "Robot Master",
    description: "Reach level 20",
    earned: (c) => levelFromXp(c.xp).level >= 20,
  },
];
