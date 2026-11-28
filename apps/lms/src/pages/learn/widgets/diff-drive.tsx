import { useState } from "react";
import { Frame, Readouts, Slider, fmt } from "./kit";

/** Differential-drive forward kinematics: v, ω, turning radius, ICR and the arc driven. Used in i12. */

// eslint-disable-next-line react-refresh/only-export-components -- pure maths exported for the self-check
export function diffDrive(wL: number, wR: number, r: number, L: number) {
  const vL = r * wL, vR = r * wR;
  const v = (vR + vL) / 2, w = (vR - vL) / L;
  const R = w === 0 ? Infinity : v / w; // > 0: ICR to the left
  return { vL, vR, v, w, R };
}

/** Pose at time t starting from (0, 0) heading straight up the page (θ0 = 90°), constant v and ω. */
// eslint-disable-next-line react-refresh/only-export-components -- pure maths exported for the self-check
export function poseAt(v: number, w: number, t: number) {
  const th0 = Math.PI / 2, th = th0 + w * t;
  if (Math.abs(w) < 1e-9) return { x: v * t * Math.cos(th0), y: v * t * Math.sin(th0), th };
  return { x: (v / w) * (Math.sin(th) - Math.sin(th0)), y: -(v / w) * (Math.cos(th) - Math.cos(th0)), th };
}

const TMAX = 10;                 // s of path drawn
const VIEW = 1.75;               // m either side of the start, so 3.5 m across
const S = 400 / (2 * VIEW);      // px per metre

export default function DiffDrive() {
  const [wL, setWL] = useState(10);
  const [wR, setWR] = useState(12);
  const [rMm, setRMm] = useState(32.5);
  const [Lmm, setLmm] = useState(150);
  const [t, setT] = useState(5);
  const r = rMm / 1000, L = Lmm / 1000;
  const k = diffDrive(wL, wR, r, L);

  // world (m, y up) to SVG (px, y down); start pose sits low in the view
  const px = (x: number) => 200 + x * S, py = (y: number) => 300 - y * S;
  const path = Array.from({ length: 201 }, (_, i) => poseAt(k.v, k.w, (TMAX * i) / 200))
    .map((p) => `${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`).join(" ");
  const p = poseAt(k.v, k.w, t);
  const deg = 90 - (p.th * 180) / Math.PI;     // SVG rotation: robot drawn pointing up at θ = 90°
  const straight = !Number.isFinite(k.R);
  const icr = straight ? null : { x: -k.R, y: 0 }; // ICR is fixed in the world while speeds are constant
  const side = (R: number) => (R > 0 ? "left" : R < 0 ? "right" : "on the axle midpoint");
  const wpx = r * S, hw = (L / 2) * S;

  return (
    <Frame title="Differential drive: wheel speeds to motion"
      note="Defaults are the lesson's robot: r = 32.5 mm, L = 150 mm, 10 and 12 rad/s give R = 0.825 m. Try equal speeds (straight), equal and opposite (spin on the spot) and one wheel at zero (pivot about it).">
      <div className="grid gap-4 sm:grid-cols-3">
        <Slider label="Left wheel ωL" value={wL} min={-20} max={20} step={0.5} onChange={setWL} format={(v) => `${v} rad/s`} />
        <Slider label="Right wheel ωR" value={wR} min={-20} max={20} step={0.5} onChange={setWR} format={(v) => `${v} rad/s`} />
        <Slider label="Time shown t" value={t} min={0} max={TMAX} step={0.1} onChange={setT} format={(v) => `${v.toFixed(1)} s`} />
        <Slider label="Wheel radius r" value={rMm} min={15} max={50} step={0.5} onChange={setRMm} format={(v) => `${v} mm`} />
        <Slider label="Track width L" value={Lmm} min={80} max={300} step={5} onChange={setLmm} format={(v) => `${v} mm`} />
      </div>
      <svg viewBox="0 0 400 400" className="w-full max-w-[480px] text-sub" role="img"
        aria-label={`Top view. Robot starts at the bottom centre heading up. v ${fmt(k.v)} m/s, ω ${fmt(k.w)} rad/s, ${straight ? "straight line" : `turning radius ${fmt(Math.abs(k.R))} m to the ${side(k.R)}`}. Shown at t = ${t.toFixed(1)} s.`}>
        <g>
          {Array.from({ length: 8 }, (_, i) => -VIEW + 0.25 + i * 0.5).map((g) => (
            <g key={g} stroke="var(--k-border)">
              <line x1={px(g)} x2={px(g)} y1={0} y2={400} />
              <line x1={0} x2={400} y1={py(g + 1)} y2={py(g + 1)} />
            </g>
          ))}
          <polyline points={path} fill="none" stroke="var(--k-primary)" strokeWidth={2} strokeDasharray="6 4" />
          {icr && (
            <g>
              <line x1={px(p.x)} y1={py(p.y)} x2={px(icr.x)} y2={py(icr.y)} stroke="currentColor" strokeDasharray="3 3" />
              <circle cx={px(icr.x)} cy={py(icr.y)} r={4} fill="var(--k-error)" />
              <text x={px(icr.x) + 6} y={py(icr.y) - 6} fontSize="12" fill="currentColor">ICR</text>
            </g>
          )}
          <g transform={`translate(${px(p.x)} ${py(p.y)}) rotate(${deg})`}>
            <rect x={-hw} y={-hw * 0.9} width={2 * hw} height={hw * 1.8} rx={3} fill="var(--k-primary)" fillOpacity={0.2} stroke="var(--k-primary)" />
            <rect x={-hw - 3} y={-wpx} width={6} height={2 * wpx} fill="currentColor" />
            <rect x={hw - 3} y={-wpx} width={6} height={2 * wpx} fill="currentColor" />
            <path d={`M 0 ${-hw * 0.9 - 8} l -5 8 h 10 z`} fill="var(--k-success)" />
          </g>
          <text x={8} y={392} fontSize="11" fill="currentColor">grid 0.5 m · dashed: path over {TMAX} s</text>
        </g>
      </svg>
      <Readouts items={[
        { label: "vL, vR", value: `${k.vL.toFixed(3)}, ${k.vR.toFixed(3)} m/s` },
        { label: "v = (vR + vL)/2", value: `${k.v.toFixed(4)} m/s` },
        { label: "ω = (vR - vL)/L", value: `${k.w.toFixed(3)} rad/s (${((k.w * 180) / Math.PI).toFixed(1)} °/s)` },
        { label: "Turning radius R = v/ω", value: straight ? "∞ (straight)" : `${k.R.toFixed(3)} m` },
        { label: "ICR", value: straight ? "at infinity" : k.R === 0 ? "on the axle midpoint" : `${Math.abs(k.R).toFixed(3)} m to the ${side(k.R)}` },
        { label: `Heading change after ${t.toFixed(1)} s`, value: `${((k.w * t * 180) / Math.PI).toFixed(0)}°` },
      ]} />
    </Frame>
  );
}
