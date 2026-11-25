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
        aria-label="Theme"
        aria-haspopup="dialog"
        aria-expanded={open}
        className={
          compact
            ? "btn btn-ghost btn-sm gap-1.5 text-sub"
            : "flex min-h-10 min-w-10 items-center justify-center gap-1.5 rounded-md border border-subtle px-2.5 text-sm font-semibold text-sub transition-colors hover:bg-hover hover:text-body"
        }
      >
        <Palette className="h-4 w-4" aria-hidden="true" />
        {!compact && <span className="hidden xl:inline">Theme</span>}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Theme settings"
          className="anim-pop-in absolute right-0 top-full z-[9999] mt-2 w-64 rounded-lg border border-subtle bg-panel p-3 shadow-xl"
        >
          {/* Mode toggle */}
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-sub">Appearance</p>
          <div className="mb-3 grid grid-cols-2 gap-1.5">
            {([
              { id: "light", label: "Light", icon: <Sun className="h-4 w-4" aria-hidden="true" /> },
              { id: "dark", label: "Dark", icon: <Moon className="h-4 w-4" aria-hidden="true" /> },
            ] as const).map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                aria-pressed={theme.mode === m.id}
                className={`flex min-h-10 items-center justify-center gap-1.5 rounded-md border px-3 text-sm font-semibold transition-colors ${
                  theme.mode === m.id
                    ? "border-primary-tint bg-primary-tint text-primary-c"
                    : "border-subtle text-sub hover:bg-hover"
                }`}
              >
                {m.icon}
                {m.label}
              </button>
            ))}
          </div>

          {/* Accent presets */}
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-sub">Accent</p>
          <div className="mb-3 grid grid-cols-3 gap-1.5">
            {ACCENT_PRESETS.map((p) => {
              const selected = theme.accentId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setAccentPreset(p.id)}
                  title={p.label}
                  aria-label={`${p.label} accent`}
                  aria-pressed={selected}
                  className={`flex h-10 items-center justify-center rounded-md border border-subtle ${
                    selected ? "ring-2 ring-[var(--k-text)] ring-offset-2 ring-offset-[var(--k-base-200)]" : ""
                  }`}
                  style={{ background: p.primary }}
                >
                  {selected && <Check className="h-4 w-4 text-white" aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          {/* Custom */}
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-sub">Custom</p>
          <div className="flex items-center gap-2 rounded-md border border-subtle p-2">
            <label className="flex flex-1 items-center gap-1.5">
              <span className="text-xs text-sub">Primary</span>
              <input
                type="color"
                value={current.primary}
                onChange={(e) =>
                  setCustomAccent({ ...current, primary: e.target.value })
                }
                className="h-7 w-9 cursor-pointer rounded border border-strong bg-transparent"
              />
            </label>
            <label className="flex flex-1 items-center gap-1.5">
              <span className="text-xs text-sub">Second</span>
              <input
                type="color"
                value={current.secondary}
                onChange={(e) =>
                  setCustomAccent({ ...current, secondary: e.target.value })
                }
                className="h-7 w-9 cursor-pointer rounded border border-strong bg-transparent"
              />
            </label>
            {theme.accentId === "custom" && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-tint" title="Custom accent in use">
                <Check className="h-3 w-3 text-primary-c" aria-hidden="true" />
                <span className="sr-only">Custom accent in use</span>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
