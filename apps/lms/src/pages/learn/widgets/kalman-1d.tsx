import { useState } from "react";
import { Choice, Frame, Plot, Readouts, Slider, fmt } from "./kit";

/** 1-D Kalman filter on a noisy tank-level sensor (a9 worked example). Used in a9. */

type Model = "constant" | "velocity";

/** Seeded standard-normal sequence (mulberry32 + Box-Muller), so the noise is repeatable. */
// eslint-disable-next-line react-refresh/only-export-components -- pure maths exported for the self-check
export function gaussians(seed: number, n: number): number[] {
  let a = seed >>> 0;
  const rand = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return Array.from({ length: n }, () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand()));
}

/**
 * Runs the filter over measurements z. Constant model: F = 1, H = 1.
 * Constant-velocity model: state [level, rate per step], F = [[1,1],[0,1]],
 * H = [1, 0], Q = q·[[1/4, 1/2], [1/2, 1]] (white acceleration, Δt = 1 step).
 * Returns the level estimate, its variance, and the level gain after each update.
 */
// eslint-disable-next-line react-refresh/only-export-components -- pure maths exported for the self-check
export function kalman(z: number[], model: Model, q: number, r: number, x0: number, p0: number) {
  let x = x0, v = 0, P11 = p0, P12 = 0, P22 = model === "velocity" ? 1 : 0;
  const est: number[] = [], vars: number[] = [], gains: number[] = [];
  for (const zk of z) {
    // predict
    if (model === "constant") {
      P11 += q;
    } else {
      x += v;
      const n11 = P11 + 2 * P12 + P22 + q / 4, n12 = P12 + P22 + q / 2, n22 = P22 + q;
      P11 = n11; P12 = n12; P22 = n22;
    }
    // update (H = [1, 0])
    const S = P11 + r, K1 = P11 / S, K2 = P12 / S, y = zk - x;
    x += K1 * y; v += K2 * y;
    const m11 = (1 - K1) * P11, m12 = (1 - K1) * P12, m22 = P22 - K2 * P12;
    P11 = m11; P12 = m12; P22 = m22;
    est.push(x); vars.push(P11); gains.push(K1);
  }
  return { est, vars, gains };
}

const N = 50;

export default function Kalman1d() {
  const [model, setModel] = useState<Model>("constant");
  const [q, setQ] = useState(0.1);       // cm² per step
  const [r, setR] = useState(1.0);       // cm², what the filter assumes
  const [sigma, setSigma] = useState(1); // cm, what the sensor really does
  const [truth0, setTruth0] = useState(11);
  const [rate, setRate] = useState(0);   // cm per step
  const [seed, setSeed] = useState(1);

  const noise = gaussians(seed, N);
  const truth = noise.map((_, k) => truth0 + rate * (k + 1));
  const z = truth.map((t, k) => t + sigma * noise[k]);
  const { est, vars, gains } = kalman(z, model, q, r, 10, 4);

  const pts = (a: number[]): [number, number][] => a.map((v, k) => [k + 1, v]);
  const rmse = (a: number[]) => Math.sqrt(a.reduce((s, v, k) => s + (v - truth[k]) ** 2, 0) / N);
  const raw = rmse(z), filt = rmse(est);

  return (
    <Frame title="1-D Kalman filter on a tank level"
      note="Defaults are the lesson's tank: x̂ = 10 cm, P = 4 cm², Q = 0.1, R = 1. The first gain is 0.804 and it settles at 0.270, as in the worked steps. Now give the level a rate and watch the constant model lag until you raise Q or switch model.">
      <div className="flex flex-wrap items-center gap-4">
        <Choice label="Filter model" value={model} onChange={setModel}
          options={[{ value: "constant", label: "Constant level" }, { value: "velocity", label: "Constant rate" }]} />
        <button type="button" onClick={() => setSeed((s) => s + 1)}
          className="min-h-9 rounded-md border border-subtle px-3 text-[13px] font-semibold text-body hover:bg-hover">
          New noise (seed {seed})
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Slider label="Q (process)" value={Math.log10(q)} min={-4} max={1} step={0.05} onChange={(v) => setQ(+(10 ** v).toPrecision(3))} format={() => `${fmt(q)} cm²`} />
        <Slider label="R (filter assumes)" value={Math.log10(r)} min={-2} max={2} step={0.05} onChange={(v) => setR(+(10 ** v).toPrecision(3))} format={() => `${fmt(r)} cm²`} />
        <Slider label="Real sensor σ" value={sigma} min={0.1} max={3} step={0.1} onChange={setSigma} format={(v) => `${v.toFixed(1)} cm`} />
        <Slider label="True level at start" value={truth0} min={8} max={14} step={0.1} onChange={setTruth0} format={(v) => `${v.toFixed(1)} cm`} />
        <Slider label="True rate" value={rate} min={-0.1} max={0.1} step={0.01} onChange={setRate} format={(v) => `${v.toFixed(2)} cm/step`} />
      </div>
      <Plot x={[0, N]} y={[2, 20]} xLabel="step k" yLabel="level (cm)"
        series={[
          { label: "measurements z", points: pts(z), color: "var(--k-border-strong)" },
          { label: "truth", points: pts(truth), color: "var(--k-success)", dashed: true },
          { label: "estimate x̂", points: pts(est), color: "var(--k-primary)" },
          { label: "x̂ + 2σ", points: pts(est.map((e, k) => e + 2 * Math.sqrt(vars[k]))), color: "var(--k-warning)", dashed: true },
          { label: "x̂ - 2σ", points: pts(est.map((e, k) => e - 2 * Math.sqrt(vars[k]))), color: "var(--k-warning)", dashed: true },
        ]} />
      <Readouts items={[
        { label: "Gain after step 1", value: gains[0].toFixed(4) },
        { label: `Gain after step ${N}`, value: gains[N - 1].toFixed(4) },
        { label: "Final σ of estimate", value: `${Math.sqrt(vars[N - 1]).toFixed(3)} cm` },
        { label: "RMSE of raw readings", value: `${raw.toFixed(3)} cm` },
        { label: "RMSE of estimate", value: `${filt.toFixed(3)} cm`, tone: filt < raw ? "ok" : "bad" },
        { label: "Improvement", value: `${((1 - filt / raw) * 100).toFixed(0)} %`, tone: filt < raw ? "ok" : "bad" },
      ]} />
    </Frame>
  );
}
