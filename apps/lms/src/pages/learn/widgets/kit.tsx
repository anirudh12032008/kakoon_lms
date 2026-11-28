import { useId, type ReactNode } from "react";

/**
 * Shared parts for lesson widgets. Every widget is a default-exported component
 * in this folder (file name = widget id), built from these pieces so they all
 * look and behave alike. No chart library: plots are plain SVG.
 */

export function Frame({ title, children, note }: { title: string; children: ReactNode; note?: ReactNode }) {
  return (
    <section aria-label={title} className="rounded-md border border-[var(--k-border-strong)] bg-panel">
      <header className="flex items-center gap-2 border-b border-subtle px-4 py-2">
        <span className="rounded bg-primary-tint px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary-c">Try it</span>
        <h3 className="text-sm font-semibold text-body">{title}</h3>
      </header>
      <div className="space-y-4 p-4 text-sm text-body">{children}</div>
      {note && <p className="border-t border-subtle px-4 py-2 text-[13px] text-sub">{note}</p>}
    </section>
  );
}

/** A labelled slider with its value shown. `format` turns the number into display text. */
export function Slider({ label, value, min, max, step = 1, onChange, format = String }: {
  label: string; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; format?: (v: number) => string;
}) {
  const id = useId();
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="font-semibold">{label}</label>
        <output htmlFor={id} className="font-mono text-[13px]">{format(value)}</output>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="range range-xs range-primary mt-2 w-full" />
    </div>
  );
}

/** A small set of choices (radio buttons styled as a segmented control). */
export function Choice<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap items-center gap-2">
      <span className="font-semibold">{label}</span>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} onClick={() => onChange(o.value)}
          className={`min-h-9 rounded-md border px-3 text-[13px] font-semibold ${value === o.value ? "border-[var(--k-primary-text)] bg-primary-tint text-body" : "border-subtle text-sub hover:bg-hover"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Computed results in a row of labelled boxes. `tone` flags a value that is unsafe or out of range. */
export function Readouts({ items }: { items: { label: string; value: string; tone?: "ok" | "warn" | "bad" }[] }) {
  const tone = { ok: "text-success-c", warn: "text-warning-c", bad: "text-error-c" } as const;
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map((r) => (
        <div key={r.label} className="rounded-md border border-subtle bg-raised px-3 py-2">
          <dt className="text-[12px] text-sub">{r.label}</dt>
          <dd className={`font-mono text-[15px] font-semibold ${r.tone ? tone[r.tone] : ""}`}>{r.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export interface Series { label: string; points: [number, number][]; dashed?: boolean; color?: string }

const PALETTE = ["var(--k-primary)", "var(--k-error)", "var(--k-success)", "var(--k-warning)"];

/**
 * Line plot in SVG. Axes are linear unless `logX` is set (for Bode plots).
 * Give explicit ranges so the axes stay still while sliders move.
 */
export function Plot({ series, x, y, xLabel, yLabel, logX, height = 220, markers = [] }: {
  series: Series[]; x: [number, number]; y: [number, number]; xLabel: string; yLabel: string;
  logX?: boolean; height?: number; markers?: { x?: number; y?: number; label: string }[];
}) {
  const W = 560, H = height, L = 52, R = 12, T = 12, B = 36;
  const fx = (v: number) => {
    const t = logX ? (Math.log10(v) - Math.log10(x[0])) / (Math.log10(x[1]) - Math.log10(x[0])) : (v - x[0]) / (x[1] - x[0]);
    return L + t * (W - L - R);
  };
  const fy = (v: number) => T + (1 - (v - y[0]) / (y[1] - y[0])) * (H - T - B);
  const clampY = (v: number) => Math.min(y[1], Math.max(y[0], v));
  const ticks = (a: number, b: number, log?: boolean) => {
    const out: number[] = [];
    if (log) { for (let e = Math.ceil(Math.log10(a)); e <= Math.floor(Math.log10(b)); e++) out.push(10 ** e); return out; }
    const step = niceStep((b - a) / 5);
    for (let v = Math.ceil(a / step) * step; v <= b + 1e-9; v += step) out.push(+v.toFixed(10));
    return out;
  };
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full text-sub" role="img" aria-label={`${yLabel} against ${xLabel}: ${series.map((s) => s.label).join(", ")}`}>
        <g fontSize="11" fill="currentColor">
          {ticks(x[0], x[1], logX).map((v) => (
            <g key={`x${v}`}>
              <line x1={fx(v)} x2={fx(v)} y1={T} y2={H - B} stroke="var(--k-border)" />
              <text x={fx(v)} y={H - B + 14} textAnchor="middle">{fmt(v)}</text>
            </g>
          ))}
          {ticks(y[0], y[1]).map((v) => (
            <g key={`y${v}`}>
              <line x1={L} x2={W - R} y1={fy(v)} y2={fy(v)} stroke="var(--k-border)" />
              <text x={L - 6} y={fy(v) + 4} textAnchor="end">{fmt(v)}</text>
            </g>
          ))}
          <text x={(L + W - R) / 2} y={H - 4} textAnchor="middle">{xLabel}</text>
          <text x={12} y={(T + H - B) / 2} textAnchor="middle" transform={`rotate(-90 12 ${(T + H - B) / 2})`}>{yLabel}</text>
          {markers.map((m, i) => m.x !== undefined
            ? <g key={i}><line x1={fx(m.x)} x2={fx(m.x)} y1={T} y2={H - B} stroke="currentColor" strokeDasharray="3 3" /><text x={fx(m.x) + 4} y={T + 12}>{m.label}</text></g>
            : <g key={i}><line x1={L} x2={W - R} y1={fy(m.y!)} y2={fy(m.y!)} stroke="currentColor" strokeDasharray="3 3" /><text x={W - R - 4} y={fy(m.y!) - 4} textAnchor="end">{m.label}</text></g>)}
        </g>
        {series.map((s, i) => (
          <polyline key={s.label} fill="none" strokeWidth={2} stroke={s.color ?? PALETTE[i % PALETTE.length]} strokeDasharray={s.dashed ? "6 4" : undefined}
            points={s.points.filter(([px]) => px >= x[0] && px <= x[1]).map(([px, py]) => `${fx(px).toFixed(1)},${fy(clampY(py)).toFixed(1)}`).join(" ")} />
        ))}
      </svg>
      {series.length > 1 && (
        <figcaption className="mt-1 flex flex-wrap gap-4 text-[12px] text-sub">
          {series.map((s, i) => (
            <span key={s.label} className="inline-flex items-center gap-1.5">
              <svg width="18" height="6" aria-hidden="true"><line x1="0" y1="3" x2="18" y2="3" strokeWidth="2" stroke={s.color ?? PALETTE[i % PALETTE.length]} strokeDasharray={s.dashed ? "4 3" : undefined} /></svg>
              {s.label}
            </span>
          ))}
        </figcaption>
      )}
    </figure>
  );
}

function niceStep(raw: number) {
  const p = 10 ** Math.floor(Math.log10(raw)); const n = raw / p;
  return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * p;
}

/** Engineering-style number: 4.7k, 220, 0.015, 1.2M. */
// eslint-disable-next-line react-refresh/only-export-components -- tiny formatting helper shared by widgets
export function fmt(v: number, digits = 3): string {
  if (v === 0) return "0";
  const a = Math.abs(v);
  if (a >= 1e6) return `${+(v / 1e6).toPrecision(digits)}M`;
  if (a >= 1e3) return `${+(v / 1e3).toPrecision(digits)}k`;
  return String(+v.toPrecision(digits));
}

/** Value with a unit and SI prefix: si(0.0047, "F") is "4.7 mF". */
// eslint-disable-next-line react-refresh/only-export-components -- tiny formatting helper shared by widgets
export function si(v: number, unit: string, digits = 3): string {
  if (v === 0) return `0 ${unit}`;
  const prefixes: [number, string][] = [[1e9, "G"], [1e6, "M"], [1e3, "k"], [1, ""], [1e-3, "m"], [1e-6, "µ"], [1e-9, "n"], [1e-12, "p"]];
  const [scale, p] = prefixes.find(([s]) => Math.abs(v) >= s) ?? prefixes[prefixes.length - 1];
  return `${+(v / scale).toPrecision(digits)} ${p}${unit}`;
}
