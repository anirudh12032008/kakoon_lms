import { useMemo, useState } from "react";
import { Choice, Frame, Plot, Readouts, Slider, si } from "./kit";

/** Seeded test signal: a step from 0 to 1 at n = 50, Gaussian noise (sd 0.15), optional spikes. */
// eslint-disable-next-line react-refresh/only-export-components -- pure maths exported for the self-check
export function makeSignal(spikes: boolean, n = 200): number[] {
  let s = 12345; // mulberry32
  const rnd = () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const g = Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd()); // Box-Muller
    out.push((i >= 50 ? 1 : 0) + 0.15 * g);
  }
  if (spikes) for (const [i, v] of [[25, 1.6], [80, -1.1], [120, 2.0], [165, -0.9]]) out[i] += v;
  return out;
}

/** The three filters of the lesson, each started from the first sample as in the sketch. */
// eslint-disable-next-line react-refresh/only-export-components -- pure maths exported for the self-check
export function applyFilter(x: number[], kind: "ma" | "ema" | "median", n: number, alpha: number): number[] {
  if (kind === "ema") {
    let y = x[0];
    return x.map((v) => (y += alpha * (v - y)));
  }
  const buf = Array<number>(n).fill(x[0]);
  return x.map((v, i) => {
    buf[i % n] = v;
    if (kind === "ma") return buf.reduce((a, b) => a + b, 0) / n;
    return [...buf].sort((a, b) => a - b)[(n - 1) / 2];
  });
}

/** The lesson's EMA relations: τ ≈ Δt (1 - α) / α, fc = 1 / (2π τ). */
// eslint-disable-next-line react-refresh/only-export-components -- pure maths exported for the self-check
export function emaCutoff(alpha: number, fs: number): { tau: number; fc: number } {
  const tau = (1 - alpha) / alpha / fs;
  return { tau, fc: tau > 0 ? 1 / (2 * Math.PI * tau) : Infinity };
}

type Kind = "ma" | "ema" | "median";

export default function DigitalFilters() {
  const [kind, setKind] = useState<Kind>("ema");
  const [spikes, setSpikes] = useState<"off" | "on">("off");
  const [n, setN] = useState(8);
  const [nMed, setNMed] = useState(5);
  const [alpha, setAlpha] = useState(0.1);
  const [fs, setFs] = useState(100);

  const raw = useMemo(() => makeSignal(spikes === "on"), [spikes]);
  const len = kind === "median" ? nMed : n;
  const out = useMemo(() => applyFilter(raw, kind, len, alpha), [raw, kind, len, alpha]);
  const pts = (a: number[]) => a.map((v, i) => [i, v] as [number, number]);

  const dt = 1 / fs;
  const { tau, fc } = emaCutoff(alpha, fs);
  const lagSamples = kind === "ema" ? (1 - alpha) / alpha : (len - 1) / 2;
  const sd = (a: number[]) => { const t = a.slice(100); const m = t.reduce((p, q) => p + q, 0) / t.length; return Math.sqrt(t.reduce((p, q) => p + (q - m) ** 2, 0) / t.length); };

  const items = [
    { label: "Δt = 1 / fs", value: si(dt, "s") },
    ...(kind === "ema"
      ? [{ label: "τ ≈ Δt (1 - α) / α", value: si(tau, "s") }, { label: "Cut-off fc = 1 / (2π τ)", value: fc === Infinity ? "none (α = 1)" : si(fc, "Hz") }]
      : kind === "ma"
        ? [{ label: "First null fs / N", value: si(fs / n, "Hz") }]
        : [{ label: "Cut-off", value: "none (not linear)" }]),
    { label: kind === "ema" ? "Lag ≈ τ" : "Lag (N - 1) / 2 samples", value: `${+lagSamples.toFixed(2)} samples = ${si(lagSamples * dt, "s")}` },
    { label: "Noise sd (n ≥ 100), raw", value: sd(raw).toFixed(3) },
    { label: "Noise sd (n ≥ 100), filtered", value: sd(out).toFixed(3), tone: sd(out) < sd(raw) ? ("ok" as const) : ("warn" as const) },
  ];

  return (
    <Frame title="Moving average, EMA and median filters"
      note="Turn spikes on and compare the moving average with a median of 5: the average smears each spike, the median ignores it. Then lower α and watch the EMA get smoother but slower to follow the step.">
      <div className="space-y-3">
        <Choice label="Filter" value={kind} onChange={setKind}
          options={[{ value: "ma", label: "Moving average" }, { value: "ema", label: "Exponential (EMA)" }, { value: "median", label: "Median" }]} />
        <Choice label="Spikes" value={spikes} onChange={setSpikes} options={[{ value: "off", label: "Off" }, { value: "on", label: "On" }]} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {kind === "ema"
          ? <Slider label="α" value={alpha} min={0.01} max={1} step={0.01} onChange={setAlpha} format={(v) => v.toFixed(2)} />
          : kind === "ma"
            ? <Slider label="Window N" value={n} min={1} max={25} onChange={setN} format={(v) => `${v} samples`} />
            : <Slider label="Window N (odd)" value={nMed} min={1} max={25} step={2} onChange={setNMed} format={(v) => `${v} samples`} />}
        <Slider label="Sample rate fs" value={fs} min={10} max={1000} step={10} onChange={setFs} format={(v) => `${v} Hz`} />
      </div>
      <Plot x={[0, 199]} y={[-1, 3]} xLabel="sample number n" yLabel="value"
        series={[
          { label: "raw", points: pts(raw), color: "var(--k-border-strong)" },
          { label: "filtered", points: pts(out), color: "var(--k-primary)" },
          { label: "true step", points: [[0, 0], [50, 0], [50, 1], [199, 1]], dashed: true, color: "var(--k-success)" },
        ]} />
      <Readouts items={items} />
    </Frame>
  );
}
