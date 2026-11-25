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
  /** Input outlines: at least 3:1 against every surface. */
  "border-strong": string;
  text: string;
  muted: string;
  dim: string;
}

// Every text colour here holds 4.5:1 on all four surfaces of its mode.
export const NEUTRALS: Record<ThemeMode, Neutrals> = {
  dark: {
    "base-100": "#0f1115",
    "base-200": "#14171c",
    "base-300": "#1a1e24",
    "base-400": "#242932",
    border: "#2e343e",
    "border-strong": "#6b7280",
    text: "#e6e8ec",
    muted: "#a9afba",
    dim: "#8e95a1",
  },
  light: {
    "base-100": "#ffffff",
    "base-200": "#f7f8fa",
    "base-300": "#f0f2f5",
    "base-400": "#e4e7ec",
    border: "#d5d9e0",
    "border-strong": "#7c8291",
    text: "#16191f",
    muted: "#475060",
    dim: "#5d6472",
  },
};

/** Brand accent palette - what most "preset" choices change. */
export interface Accent {
  primary: string;
  secondary: string;
  accent: string;
}

export interface AccentPreset extends Accent {
  id: string;
  label: string;
}

// Primaries are dark enough for white text (4.5:1 or better).
export const ACCENT_PRESETS: AccentPreset[] = [
  { id: "classic", label: "Classic blue", primary: "#3157d5", secondary: "#5b6b8c", accent: "#0e7490" },
  { id: "violet", label: "Violet", primary: "#6d3fd9", secondary: "#a21caf", accent: "#0e7490" },
  { id: "ocean", label: "Ocean", primary: "#0b6bcb", secondary: "#0e7490", accent: "#0f766e" },
  { id: "emerald", label: "Emerald", primary: "#047857", secondary: "#0f766e", accent: "#4d7c0f" },
  { id: "sunset", label: "Sunset", primary: "#c2410c", secondary: "#b91c1c", accent: "#b45309" },
  { id: "rose", label: "Rose", primary: "#c81e4a", secondary: "#a21caf", accent: "#be185d" },
  { id: "slate", label: "Slate", primary: "#475569", secondary: "#64748b", accent: "#0369a1" },
];

/** Semantic status fills, constant across themes. As text, use the
 *  `text-*-c` classes, which mix these toward the text colour. */
const SEMANTIC = {
  success: "#16a34a",
  warning: "#d97706",
  error: "#dc2626",
  info: "#2563eb",
};

export interface ThemeState {
  mode: ThemeMode;
  /** Accent preset id, or "custom" when using customAccent. */
  accentId: string;
  customAccent: Accent;
}

const CLASSIC = ACCENT_PRESETS[0];

export const DEFAULT_THEME: ThemeState = {
  mode: "dark",
  accentId: CLASSIC.id,
  customAccent: { primary: CLASSIC.primary, secondary: CLASSIC.secondary, accent: CLASSIC.accent },
};

/** First visit follows the operating system's light/dark preference. */
function defaultTheme(): ThemeState {
  const prefersLight =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: light)").matches;
  return { ...DEFAULT_THEME, mode: prefersLight ? "light" : "dark" };
}

/** White or ink, whichever reads better on `hex` (WCAG relative luminance). */
function readableOn(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // White wins while it still gives 4.5:1, i.e. (1.05 / (lum + 0.05)) >= 4.5.
  return lum <= 0.1833 ? "#ffffff" : "#111318";
}

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
    "--k-border-strong": neutrals["border-strong"],
    "--k-text": neutrals.text,
    "--k-muted": neutrals.muted,
    "--k-dim": neutrals.dim,
    "--k-primary": accent.primary,
    "--k-on-primary": readableOn(accent.primary),
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

// Key bumped with the classic palette so saved pre-redesign themes do not pin the old look.
const STORAGE_KEY = "codelab-theme";

export function loadTheme(): ThemeState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultTheme();
    const parsed = JSON.parse(raw) as Partial<ThemeState>;
    return {
      mode: parsed.mode === "light" ? "light" : "dark",
      accentId: parsed.accentId ?? DEFAULT_THEME.accentId,
      customAccent: parsed.customAccent ?? DEFAULT_THEME.customAccent,
    };
  } catch {
    return defaultTheme();
  }
}

export function saveTheme(state: ThemeState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}
