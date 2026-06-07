import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  applyTheme, loadTheme, saveTheme,
  type ThemeState, type ThemeMode, type Accent,
} from "./themes";

interface ThemeContextValue {
  theme: ThemeState;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  setAccentPreset: (id: string) => void;
  setCustomAccent: (accent: Accent) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeState>(() => {
    const initial = loadTheme();
    // Apply immediately on first render so there's no flash of the wrong theme.
    if (typeof document !== "undefined") applyTheme(initial);
    return initial;
  });

  useEffect(() => {
    applyTheme(theme);
    saveTheme(theme);
  }, [theme]);

  const setMode = useCallback((mode: ThemeMode) => setTheme((t) => ({ ...t, mode })), []);
  const toggleMode = useCallback(
    () => setTheme((t) => ({ ...t, mode: t.mode === "dark" ? "light" : "dark" })),
    []
  );
  const setAccentPreset = useCallback((id: string) => setTheme((t) => ({ ...t, accentId: id })), []);
  const setCustomAccent = useCallback(
    (customAccent: Accent) => setTheme((t) => ({ ...t, accentId: "custom", customAccent })),
    []
  );

  const value = useMemo(
    () => ({ theme, setMode, toggleMode, setAccentPreset, setCustomAccent }),
    [theme, setMode, toggleMode, setAccentPreset, setCustomAccent]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
