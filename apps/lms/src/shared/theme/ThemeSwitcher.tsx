import { useEffect, useRef, useState } from "react";
import { Palette, Sun, Moon, Check } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { ACCENT_PRESETS, resolveAccent } from "./themes";

export function ThemeSwitcher({ compact = false }: { compact?: boolean }) {
  const { theme, setMode, setAccentPreset, setCustomAccent } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = resolveAccent(theme);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Theme"
        className={
          compact
            ? "btn btn-ghost btn-sm gap-1.5 text-sub"
            : "flex items-center gap-1.5 rounded-lg border border-subtle px-3 py-2 text-sm font-semibold text-sub transition-colors hover:bg-hover hover:text-body"
        }
      >
        <Palette className="h-4 w-4" />
        {!compact && <span className="hidden sm:inline">Theme</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[9999] mt-2 w-64 rounded-2xl border border-subtle bg-panel p-3 shadow-2xl">
          {/* Mode toggle */}
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-hint">Appearance</p>
          <div className="mb-3 grid grid-cols-2 gap-1.5">
            {([
              { id: "light", label: "Light", icon: <Sun className="h-4 w-4" /> },
              { id: "dark", label: "Dark", icon: <Moon className="h-4 w-4" /> },
            ] as const).map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                  theme.mode === m.id
                    ? "border-primary/50 bg-primary-tint text-primary-c"
                    : "border-subtle text-sub hover:bg-hover"
                }`}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>

          {/* Accent presets */}
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-hint">Accent</p>
          <div className="mb-3 grid grid-cols-3 gap-1.5">
            {ACCENT_PRESETS.map((p) => {
              const selected = theme.accentId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setAccentPreset(p.id)}
                  title={p.label}
                  className={`group relative flex h-11 items-center justify-center rounded-lg border transition-all ${
                    selected ? "border-body" : "border-subtle hover:border-body/40"
                  }`}
                  style={{ background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})` }}
                >
                  {selected && <Check className="h-4 w-4 text-white drop-shadow" />}
                </button>
              );
            })}
          </div>

          {/* Custom */}
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-widest text-hint">Custom</p>
          <div className="flex items-center gap-2 rounded-lg border border-subtle p-2">
            <label className="flex flex-1 items-center gap-1.5">
              <span className="text-[11px] text-sub">Primary</span>
              <input
                type="color"
                value={current.primary}
                onChange={(e) =>
                  setCustomAccent({ ...current, primary: e.target.value })
                }
                className="h-6 w-8 cursor-pointer rounded border border-subtle bg-transparent"
              />
            </label>
            <label className="flex flex-1 items-center gap-1.5">
              <span className="text-[11px] text-sub">Second</span>
              <input
                type="color"
                value={current.secondary}
                onChange={(e) =>
                  setCustomAccent({ ...current, secondary: e.target.value })
                }
                className="h-6 w-8 cursor-pointer rounded border border-subtle bg-transparent"
              />
            </label>
            {theme.accentId === "custom" && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-tint">
                <Check className="h-3 w-3 text-primary-c" />
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
