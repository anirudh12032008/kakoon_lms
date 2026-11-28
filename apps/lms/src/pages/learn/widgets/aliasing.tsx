import { useState } from "react";
import { Frame, Plot, Readouts, Slider } from "./kit";

/**
 * Fold f into [0, fs/2]. `sign` is -1 when the samples of sin(2πft) lie on -sin(2π f_alias t),
 * which happens when f sits just below a multiple of fs. Used in i8.
 */
// eslint-disable-next-line react-refresh/only-export-components -- pure maths exported for the self-check
export function alias(f: number, fs: number): { fa: number; k: number; sign: 1 | -1 } {
  const k = Math.round(f / fs);
  const d = f - k * fs;
  return { fa: Math.abs(d), k, sign: d < 0 ? -1 : 1 };
}

const T_END = 0.2; // s, fixed window so the axis stays still

export default function Aliasing() {
  const [f, setF] = useState(100);   // Hz, worked example 1: lamp flicker
  const [fs, setFs] = useState(60);  // Hz, light sensor sample rate
  const { fa, k, sign } = alias(f, fs);
  const nyq = fs / 2;

  const n = 1200;
  const signal: [number, number][] = [], apparent: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = (T_END * i) / n;
    signal.push([t, Math.sin(2 * Math.PI * f * t)]);
    apparent.push([t, sign * Math.sin(2 * Math.PI * fa * t)]);
  }
  // Samples drawn as stems: up from the axis to the sample value and back down.
  const stems: [number, number][] = [];
  for (let m = 0; m / fs <= T_END + 1e-12; m++) {
    const t = m / fs, v = Math.sin(2 * Math.PI * f * t);
    stems.push([t, 0], [t, v], [t, 0]);
  }
  const aliased = f >= nyq;

  return (
    <Frame title="Aliasing: what the samples show"
      note="Start at the lamp example (100 Hz sampled at 60 Hz) and confirm the 20 Hz ghost. Then raise fs above 200 Hz and watch the apparent frequency return to the true one.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Slider label="Signal frequency f" value={f} min={1} max={200} onChange={setF} format={(v) => `${v} Hz`} />
        <Slider label="Sample rate fs" value={fs} min={10} max={250} onChange={setFs} format={(v) => `${v} Hz`} />
      </div>
      <Plot x={[0, T_END]} y={[-1.2, 1.2]} xLabel="time (s)" yLabel="signal"
        series={[
          { label: `true sine, ${f} Hz`, points: signal, color: "var(--k-border-strong)" },
          { label: "samples (stems)", points: stems, color: "var(--k-primary)" },
          { label: `apparent sine, ${+fa.toFixed(2)} Hz`, points: apparent, dashed: true, color: "var(--k-error)" },
        ]} />
      <Readouts items={[
        { label: "Nyquist fs / 2", value: `${+nyq.toFixed(2)} Hz` },
        { label: `Apparent |f - ${k} × fs|`, value: `${+fa.toFixed(2)} Hz`, tone: aliased ? "bad" : "ok" },
        { label: "Status", value: aliased ? (fa === nyq ? "at Nyquist" : "aliased") : "faithful", tone: aliased ? "bad" : "ok" },
      ]} />
    </Frame>
  );
}
