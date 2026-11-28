import { useState } from "react";
import { Choice, Frame, Plot, Readouts, Slider, fmt } from "./kit";

/**
 * Discrete PID on a DC motor (first-order speed model from a8, position = ∫ speed).
 * Used in a8 (PID design) and i12 (feedback and PID).
 */

type Mode = "speed" | "position";

export interface PidParams {
  mode: Mode; Km: number; tm: number;
  Kp: number; Ki: number; Kd: number;
  r: number; umax: number; Ts: number; antiWindup: boolean; T: number;
}

export interface PidResult {
  y: [number, number][]; u: [number, number][];
  overshoot: number; rise: number | null; settle: number | null; sse: number; final: number;
}

/**
 * Plant integrated with RK4 in substeps of at most 0.5 ms, input held between samples (ZOH).
 * Controller runs once per Ts: P on error, D on measurement (no kick), and
 * back-calculation anti-windup with Kaw = Ki/Kp (= 1/Ti), capped at 1/Ts.
 */
// eslint-disable-next-line react-refresh/only-export-components -- pure maths exported for the self-check
export function simulatePid(p: PidParams): PidResult {
  const n = Math.max(1, Math.ceil(p.Ts / 0.0005)), h = p.Ts / n;
  const steps = Math.round(p.T / p.Ts);
  const kaw = Math.min(p.Kp > 0 ? p.Ki / p.Kp : Infinity, 1 / p.Ts);
  let w = 0, th = 0, I = 0, yPrev = 0, t = 0;
  const y: [number, number][] = [[0, 0]], u: [number, number][] = [];
  const out = () => (p.mode === "speed" ? w : th);
  for (let k = 0; k < steps; k++) {
    const yk = out(), e = p.r - yk;
    const D = k > 0 ? -p.Kd * (yk - yPrev) / p.Ts : 0;
    yPrev = yk;
    const uu = p.Kp * e + I + D;
    const uk = Math.max(-p.umax, Math.min(p.umax, uu));
    I += p.Ts * (p.Ki * e + (p.antiWindup ? kaw * (uk - uu) : 0));
    u.push([t, uk]);
    for (let j = 0; j < n; j++) {
      // state (w, th): w' = (Km·u - w)/tm, th' = w
      const f = (ww: number) => (p.Km * uk - ww) / p.tm;
      const k1 = f(w), k2 = f(w + (h / 2) * k1), k3 = f(w + (h / 2) * k2), k4 = f(w + h * k3);
      th += (h / 6) * (w + 2 * (w + (h / 2) * k1) + 2 * (w + (h / 2) * k2) + (w + h * k3));
      w += (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
      t += h;
      y.push([t, out()]);
    }
    u.push([t, uk]);
  }
  const r = p.r, peak = Math.max(...y.map(([, v]) => v));
  const cross = (f: number) => y.find(([, v]) => v >= f * r)?.[0];
  const t10 = cross(0.1), t90 = cross(0.9);
  let lastOut = -1;
  y.forEach(([tt, v], i) => { if (Math.abs(v - r) > 0.02 * Math.abs(r)) lastOut = i === y.length - 1 ? Infinity : tt; });
  const final = y[y.length - 1][1];
  return {
    y, u, final,
    overshoot: Math.max(0, (100 * (peak - r)) / r),
    rise: t10 !== undefined && t90 !== undefined ? t90 - t10 : null,
    settle: lastOut === Infinity ? null : Math.max(0, lastOut),
    sse: r - final,
  };
}

// Defaults are the a8 worked designs: PI by zero cancellation (τcl = 30 ms) and PD by pole placement (ζ = 0.7, ωn = 30 rad/s).
const PRESET = {
  speed: { Kp: 0.0667, Ki: 0.7, Kd: 0, r: 100, T: 0.4, kp: [0, 0.5, 0.001], ki: [0, 10, 0.01], kd: [0, 0.005, 0.0001], rr: [10, 200, 5], y: [0, 250], unit: "rad/s" },
  position: { Kp: 1.8, Ki: 0, Kd: 0.063, r: 3, T: 0.6, kp: [0, 10, 0.05], ki: [0, 20, 0.1], kd: [0, 0.3, 0.001], rr: [0.5, 10, 0.5], y: [0, 15], unit: "rad" },
} as const;

export default function PidTuner() {
  const [mode, setMode] = useState<Mode>("speed");
  const [Kp, setKp] = useState<number>(PRESET.speed.Kp);
  const [Ki, setKi] = useState<number>(PRESET.speed.Ki);
  const [Kd, setKd] = useState<number>(PRESET.speed.Kd);
  const [r, setR] = useState<number>(PRESET.speed.r);
  const [umax, setUmax] = useState(6);
  const [TsMs, setTsMs] = useState(5);
  const [aw, setAw] = useState<"on" | "off">("on");
  const pr = PRESET[mode];

  const pick = (m: Mode) => {
    setMode(m);
    const q = PRESET[m];
    setKp(q.Kp); setKi(q.Ki); setKd(q.Kd); setR(q.r);
  };

  const res = simulatePid({ mode, Km: 47.6, tm: 0.0952, Kp, Ki, Kd, r, umax, Ts: TsMs / 1000, antiWindup: aw === "on", T: pr.T });
  const ms = (s: number | null) => (s === null ? "not reached" : `${(s * 1000).toFixed(0)} ms`);
  const saturated = res.u.some(([, v]) => Math.abs(v) >= umax - 1e-9);

  return (
    <Frame title="PID tuner on a DC motor"
      note="The defaults are the lesson's designs (motor Km = 47.6 (rad/s)/V, τm = 95.2 ms). Raise the step until the output hits the voltage limit, then switch anti-windup off and compare the overshoot; also try a longer sample time.">
      <div className="flex flex-wrap gap-4">
        <Choice label="Loop" value={mode} onChange={pick}
          options={[{ value: "speed", label: "Speed" }, { value: "position", label: "Position" }]} />
        <Choice label="Anti-windup" value={aw} onChange={setAw}
          options={[{ value: "on", label: "On" }, { value: "off", label: "Off" }]} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Slider label="Kp" value={Kp} min={pr.kp[0]} max={pr.kp[1]} step={pr.kp[2]} onChange={setKp} format={(v) => fmt(v)} />
        <Slider label="Ki" value={Ki} min={pr.ki[0]} max={pr.ki[1]} step={pr.ki[2]} onChange={setKi} format={(v) => fmt(v)} />
        <Slider label="Kd" value={Kd} min={pr.kd[0]} max={pr.kd[1]} step={pr.kd[2]} onChange={setKd} format={(v) => fmt(v)} />
        <Slider label="Setpoint step" value={r} min={pr.rr[0]} max={pr.rr[1]} step={pr.rr[2]} onChange={setR} format={(v) => `${fmt(v)} ${pr.unit}`} />
        <Slider label="Output limit" value={umax} min={1} max={12} step={0.5} onChange={setUmax} format={(v) => `±${v} V`} />
        <Slider label="Sample time Ts" value={TsMs} min={1} max={40} step={1} onChange={setTsMs} format={(v) => `${v} ms`} />
      </div>
      <Plot x={[0, pr.T]} y={[pr.y[0], pr.y[1]]} xLabel="time (s)" yLabel={mode === "speed" ? "speed (rad/s)" : "angle (rad)"}
        series={[
          { label: "setpoint", points: [[0, r], [pr.T, r]], dashed: true, color: "var(--k-success)" },
          { label: mode === "speed" ? "motor speed ω" : "shaft angle θ", points: res.y },
        ]} />
      <Plot x={[0, pr.T]} y={[-12, 12]} height={160} xLabel="time (s)" yLabel="effort u (V)"
        series={[{ label: "controller output", points: res.u, color: "var(--k-warning)" }]}
        markers={[{ y: umax, label: "+limit" }, { y: -umax, label: "-limit" }]} />
      <Readouts items={[
        { label: "Overshoot", value: `${res.overshoot.toFixed(1)} %`, tone: res.overshoot > 20 ? "bad" : res.overshoot > 5 ? "warn" : "ok" },
        { label: "Rise time (10 to 90 %)", value: ms(res.rise) },
        { label: "Settling time (2 %)", value: ms(res.settle), tone: res.settle === null ? "bad" : undefined },
        { label: "Steady-state error", value: `${fmt(res.sse)} ${pr.unit}`, tone: Math.abs(res.sse) > 0.02 * r ? "warn" : undefined },
        { label: "Output saturated?", value: saturated ? "yes, at limit" : "no", tone: saturated ? "warn" : undefined },
        { label: "Sample rate", value: `${fmt(1000 / TsMs)} Hz` },
      ]} />
    </Frame>
  );
}
