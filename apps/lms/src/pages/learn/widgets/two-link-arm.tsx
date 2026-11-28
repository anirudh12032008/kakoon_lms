import { useRef, useState, type PointerEvent } from "react";
import { Choice, Frame, Readouts, Slider } from "./kit";

const D = Math.PI / 180;

/** Planar 2R forward kinematics: elbow and tip positions. */
// eslint-disable-next-line react-refresh/only-export-components -- pure maths exported for the self-check
export function fk(t1: number, t2: number, l1: number, l2: number) {
  const ex = l1 * Math.cos(t1), ey = l1 * Math.sin(t1);
  return { ex, ey, x: ex + l2 * Math.cos(t1 + t2), y: ey + l2 * Math.sin(t1 + t2) };
}

/**
 * a10's closed-form 2R IK. Elbow up takes the negative root (θ2 < 0), elbow down the positive.
 * Returns null when cos θ2 is outside [-1, 1].
 */
// eslint-disable-next-line react-refresh/only-export-components -- pure maths exported for the self-check
export function ik(x: number, y: number, l1: number, l2: number, elbowUp: boolean) {
  const c2 = (x * x + y * y - l1 * l1 - l2 * l2) / (2 * l1 * l2);
  if (Math.abs(c2) > 1) return null;
  const s2 = (elbowUp ? -1 : 1) * Math.sqrt(1 - c2 * c2);
  const t2 = Math.atan2(s2, c2);
  return { t1: Math.atan2(y, x) - Math.atan2(l2 * s2, l1 + l2 * c2), t2, c2 };
}

const R = 0.75;          // m, fixed half-width of the drawing
const S = 200 / R;       // svg units per metre
const sx = (x: number) => 200 + x * S, sy = (y: number) => 200 - y * S;
const deg = (r: number) => `${(r / D).toFixed(2)}°`;
const wrap = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

export default function TwoLinkArm() {
  const [l1, setL1] = useState(0.3);
  const [l2, setL2] = useState(0.2);
  const [mode, setMode] = useState<"ik" | "fk">("ik");
  const [branch, setBranch] = useState<"up" | "down">("up");
  const [tx, setTx] = useState(0.35);
  const [ty, setTy] = useState(0.25);
  const [a1, setA1] = useState(59.95);
  const [a2, setA2] = useState(-62.72);
  const svg = useRef<SVGSVGElement>(null);

  const sol = ik(tx, ty, l1, l2, branch === "up");
  const other = ik(tx, ty, l1, l2, branch !== "up");
  // Unreachable: show the nearest pose, fully stretched (too far) or fully folded (too close).
  const r = Math.hypot(tx, ty);
  const [t1, t2] = mode === "fk" ? [a1 * D, a2 * D]
    : sol ? [sol.t1, sol.t2] : [Math.atan2(ty, tx), r > l1 + l2 ? 0 : Math.PI];
  const p = fk(t1, t2, l1, l2);
  const reachable = mode === "fk" || sol !== null;

  const switchMode = (m: "ik" | "fk") => {
    if (m === "fk") { setA1(+(wrap(t1) / D).toFixed(2)); setA2(+(wrap(t2) / D).toFixed(2)); }
    else { setTx(+p.x.toFixed(3)); setTy(+p.y.toFixed(3)); }
    setMode(m);
  };

  const drag = (e: PointerEvent<SVGSVGElement>) => {
    if (mode !== "ik" || !svg.current || (e.type === "pointermove" && !e.currentTarget.hasPointerCapture(e.pointerId))) return;
    if (e.type === "pointerdown") e.currentTarget.setPointerCapture(e.pointerId);
    const m = svg.current.getScreenCTM();
    if (!m) return;
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    const clamp = (v: number) => Math.max(-0.7, Math.min(0.7, v));
    setTx(+clamp((pt.x - 200) / S).toFixed(3));
    setTy(+clamp((200 - pt.y) / S).toFixed(3));
  };

  const outer = (l1 + l2) * S, inner = Math.abs(l1 - l2) * S;
  const ring = (rad: number) => `M ${200 - rad} 200 a ${rad} ${rad} 0 1 0 ${2 * rad} 0 a ${rad} ${rad} 0 1 0 ${-2 * rad} 0 Z`;
  const label = `Two-link arm. Shoulder at the origin, elbow at (${p.ex.toFixed(3)}, ${p.ey.toFixed(3)}) m, tip at (${p.x.toFixed(3)}, ${p.y.toFixed(3)}) m.`
    + (mode === "ik" ? ` Target (${tx}, ${ty}) m, ${reachable ? "reached" : "unreachable"}.` : "");

  return (
    <Frame title="Two-link arm: inverse and forward kinematics"
      note="Drag the target (or use the x and y sliders) and flip between elbow up and elbow down: both reach the same point. Push the target outside the shaded ring, or inside its hole, to see where no solution exists.">
      <div className="space-y-3">
        <Choice label="Mode" value={mode} onChange={switchMode}
          options={[{ value: "ik", label: "Inverse (set target)" }, { value: "fk", label: "Forward (set angles)" }]} />
        {mode === "ik" && <Choice label="Branch" value={branch} onChange={setBranch}
          options={[{ value: "up", label: "Elbow up (θ2 < 0)" }, { value: "down", label: "Elbow down (θ2 > 0)" }]} />}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Slider label="L1" value={l1} min={0.1} max={0.4} step={0.01} onChange={setL1} format={(v) => `${v.toFixed(2)} m`} />
        <Slider label="L2" value={l2} min={0.05} max={0.3} step={0.01} onChange={setL2} format={(v) => `${v.toFixed(2)} m`} />
        {mode === "ik" ? <>
          <Slider label="Target x" value={tx} min={-0.7} max={0.7} step={0.005} onChange={setTx} format={(v) => `${v.toFixed(3)} m`} />
          <Slider label="Target y" value={ty} min={-0.7} max={0.7} step={0.005} onChange={setTy} format={(v) => `${v.toFixed(3)} m`} />
        </> : <>
          <Slider label="θ1" value={a1} min={-180} max={180} step={0.5} onChange={setA1} format={(v) => `${v.toFixed(2)}°`} />
          <Slider label="θ2" value={a2} min={-180} max={180} step={0.5} onChange={setA2} format={(v) => `${v.toFixed(2)}°`} />
        </>}
      </div>
      <svg ref={svg} viewBox="0 0 400 400" role="img" aria-label={label}
        className={`mx-auto w-full max-w-[420px] select-none text-sub ${mode === "ik" ? "cursor-crosshair touch-none" : ""}`}
        onPointerDown={drag} onPointerMove={drag}>
        <path d={ring(outer) + ring(inner)} fillRule="evenodd" fill="var(--k-primary)" fillOpacity={0.1} stroke="var(--k-primary)" strokeDasharray="4 4" />
        <line x1={0} x2={400} y1={200} y2={200} stroke="var(--k-border)" />
        <line x1={200} x2={200} y1={0} y2={400} stroke="var(--k-border)" />
        <g fontSize="12" fill="currentColor">
          <text x={392} y={194} textAnchor="end">x</text>
          <text x={206} y={14}>y</text>
          <text x={8} y={392}>shaded ring: reachable workspace</text>
        </g>
        <polyline points={`${sx(0)},${sy(0)} ${sx(p.ex)},${sy(p.ey)} ${sx(p.x)},${sy(p.y)}`} fill="none"
          stroke={reachable ? "var(--k-primary)" : "var(--k-border-strong)"} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={reachable ? undefined : "2 12"} />
        {[[0, 0], [p.ex, p.ey]].map(([x, y], i) => <circle key={i} cx={sx(x)} cy={sy(y)} r={6} fill="var(--k-base-300)" stroke="currentColor" strokeWidth={2} />)}
        {mode === "ik" && <g>
          <line x1={sx(tx) - 9} x2={sx(tx) + 9} y1={sy(ty)} y2={sy(ty)} stroke={reachable ? "var(--k-success)" : "var(--k-error)"} strokeWidth={2.5} />
          <line x1={sx(tx)} x2={sx(tx)} y1={sy(ty) - 9} y2={sy(ty) + 9} stroke={reachable ? "var(--k-success)" : "var(--k-error)"} strokeWidth={2.5} />
          <circle cx={sx(tx)} cy={sy(ty)} r={13} fill="transparent" stroke={reachable ? "var(--k-success)" : "var(--k-error)"} strokeWidth={1.5} />
          {!reachable && <text x={sx(tx)} y={sy(ty) < 40 ? sy(ty) + 28 : sy(ty) - 18}
            textAnchor={sx(tx) > 320 ? "end" : sx(tx) < 80 ? "start" : "middle"} fontSize="13" fontWeight="600" fill="var(--k-error)">unreachable</text>}
        </g>}
      </svg>
      <Readouts items={mode === "ik" ? [
        { label: "θ1", value: sol ? deg(sol.t1) : "none" , tone: sol ? undefined : "bad" },
        { label: "θ2", value: sol ? deg(sol.t2) : "none", tone: sol ? undefined : "bad" },
        { label: "cos θ2", value: (sol?.c2 ?? (r * r - l1 * l1 - l2 * l2) / (2 * l1 * l2)).toFixed(4), tone: sol ? "ok" : "bad" },
        { label: "Reach r = √(x² + y²)", value: `${r.toFixed(3)} m` },
        { label: "Workspace", value: `${Math.abs(l1 - l2).toFixed(2)} to ${(l1 + l2).toFixed(2)} m` },
        { label: `Other branch (${branch === "up" ? "down" : "up"})`, value: other ? `${deg(other.t1)}, ${deg(other.t2)}` : "none" },
      ] : [
        { label: "Tip x", value: `${p.x.toFixed(3)} m` },
        { label: "Tip y", value: `${p.y.toFixed(3)} m` },
        { label: "θ1 + θ2", value: deg(wrap(t1 + t2)) },
        { label: "Elbow", value: Math.abs(wrap(t2)) < 1e-9 || Math.abs(Math.abs(wrap(t2)) - Math.PI) < 1e-9 ? "straight (singular)" : wrap(t2) < 0 ? "up (θ2 < 0)" : "down (θ2 > 0)" },
      ]} />
    </Frame>
  );
}
