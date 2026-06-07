/**
 * Theme model. A theme = a light/dark "neutral" set (surfaces + text) plus an
 * "accent" set (primary/secondary/accent brand colors). Both are applied by
 * overriding the --k-* CSS variables defined in theme.css at runtime.
 */

export type ThemeMode = "dark" | "light";

/** Neutral surface + text palette per mode. */
export interface Neutrals {
  "base-100": string;
  "base-200": string;
  "base-300": string;
  "base-400": string;
  border: string;
  text: string;
  muted: string;
  dim: string;
}

export const NEUTRALS: Record<ThemeMode, Neutrals> = {
  dark: {
    "base-100": "#09090b",
    "base-200": "#0e0e12",
    "base-300": "#14141a",
    "base-400": "#1e1e26",
    border: "#25252e",
    text: "#e8e8ed",
    muted: "#9898a8",
    dim: "#4a4a58",
  },
  light: {
    "base-100": "#ffffff",
    "base-200": "#f6f6fa",
    "base-300": "#eeeef3",
    "base-400": "#e3e3ea",
    border: "#d9d9e2",
    text: "#1b1b22",
    muted: "#56566a",
    dim: "#9a9aab",
  },
};

/** Brand accent palette — what most "preset" choices change. */
export interface Accent {
  primary: string;
  secondary: string;
  accent: string;
}

export interface AccentPreset extends Accent {
  id: string;
  label: string;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { id: "violet", label: "Violet", primary: "#7c3aed", secondary: "#d946ef", accent: "#06b6d4" },
  { id: "ocean", label: "Ocean", primary: "#2563eb", secondary: "#06b6d4", accent: "#14b8a6" },
  { id: "emerald", label: "Emerald", primary: "#10b981", secondary: "#14b8a6", accent: "#84cc16" },
  { id: "sunset", label: "Sunset", primary: "#f97316", secondary: "#ef4444", accent: "#f59e0b" },
  { id: "rose", label: "Rose", primary: "#e11d48", secondary: "#d946ef", accent: "#fb7185" },
  { id: "slate", label: "Slate", primary: "#475569", secondary: "#64748b", accent: "#38bdf8" },
];

/** Semantic status colors — constant across themes (legible on light & dark). */
const SEMANTIC = {
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
};

export interface ThemeState {
  mode: ThemeMode;
  /** Accent preset id, or "custom" when using customAccent. */
  accentId: string;
  customAccent: Accent;
}

export const DEFAULT_THEME: ThemeState = {
  mode: "dark",
  accentId: "violet",
  customAccent: { primary: "#7c3aed", secondary: "#d946ef", accent: "#06b6d4" },
};

export function resolveAccent(state: ThemeState): Accent {
  if (state.accentId === "custom") return state.customAccent;
  return ACCENT_PRESETS.find((p) => p.id === state.accentId) ?? ACCENT_PRESETS[0];
}

/** Writes a theme to the document by overriding the --k-* variables. */
export function applyTheme(state: ThemeState) {
  const root = document.documentElement;
  const neutrals = NEUTRALS[state.mode];
  const accent = resolveAccent(state);

  const vars: Record<string, string> = {
    "--k-base-100": neutrals["base-100"],
    "--k-base-200": neutrals["base-200"],
    "--k-base-300": neutrals["base-300"],
    "--k-base-400": neutrals["base-400"],
    "--k-border": neutrals.border,
    "--k-text": neutrals.text,
    "--k-muted": neutrals.muted,
    "--k-dim": neutrals.dim,
    "--k-primary": accent.primary,
    "--k-secondary": accent.secondary,
    "--k-accent": accent.accent,
    "--k-success": SEMANTIC.success,
    "--k-warning": SEMANTIC.warning,
    "--k-error": SEMANTIC.error,
    "--k-info": SEMANTIC.info,
  };

  for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v);
  // Native controls (scrollbars, inputs, date pickers) follow the mode.
  root.style.colorScheme = state.mode;
}

const STORAGE_KEY = "kokoon-theme";

export function loadTheme(): ThemeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_THEME;
    const parsed = JSON.parse(raw) as Partial<ThemeState>;
    return {
      mode: parsed.mode === "light" ? "light" : "dark",
      accentId: parsed.accentId ?? DEFAULT_THEME.accentId,
      customAccent: parsed.customAccent ?? DEFAULT_THEME.customAccent,
    };
  } catch {
    return DEFAULT_THEME;
  }
}

export function saveTheme(state: ThemeState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}
