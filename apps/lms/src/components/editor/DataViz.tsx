/**
 * DataViz — floating real-time data visualisation panels
 *
 * Parses ESP32 serial output lines (from the logs[] array) looking for:
 *   IMU:      "MPU6050,ax,ay,az,gx,gy,gz,pitch,roll"
 *   Sensor:   "SENSOR,type,label,value"   (type = analog|digital|angle|raw)
 *   Radar:    "RADAR,angle,distance"  or  "SERVO,angle,distance"
 *
 * Each panel is a standalone draggable card rendered via createPortal.
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Activity, Radio, Gauge } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────────
export type VizPanel = "imu" | "sensor" | "radar";

// ─── Helpers ───────────────────────────────────────────────────────────────────
/** Strip the "[HH:MM:SS] 📥 " prefix that addLog prepends */
function stripLogPrefix(line: string): string {
  return line.replace(/^\[.*?\]\s*📥\s*/, "").trim();
}

function useDrag(initialPos: { x: number; y: number }) {
  const [pos, setPos] = useState(initialPos);
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.preventDefault();
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setPos({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, []);

  return { pos, onMouseDown };
}

function PanelShell({
  title, icon, color, children, onClose, initialPos,
  width = 340,
}: {
  title: string; icon: React.ReactNode; color: string; children: React.ReactNode;
  onClose: () => void; initialPos: { x: number; y: number }; width?: number;
}) {
  const { pos, onMouseDown } = useDrag(initialPos);
  return createPortal(
    <div
      className="fixed z-[8888] overflow-hidden rounded-2xl border border-[#2a2a32] bg-[#09090b] shadow-2xl flex flex-col select-none"
      style={{ left: pos.x, top: pos.y, width }}
    >
      <div
        className="flex items-center justify-between px-3 py-2.5 cursor-move flex-shrink-0"
        style={{ background: `${color}18`, borderBottom: `1px solid ${color}25` }}
        onMouseDown={onMouseDown}
      >
        <div className="flex items-center gap-2">
          <span style={{ color }}>{icon}</span>
          <span className="text-xs font-bold text-white">{title}</span>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10 transition-all">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>,
    document.body
  );
}

// ─── Sparkline SVG ─────────────────────────────────────────────────────────────
function Sparkline({ data, color, min, max, height = 36 }: {
  data: number[]; color: string; min: number; max: number; height?: number;
}) {
  if (data.length < 2) return <div style={{ height }} className="flex items-center justify-center text-[9px] text-zinc-700">No data</div>;
  const W = 260, H = height;
  const range = max - min || 1;
  const pts = data.slice(-60).map((v, i, arr) => {
    const x = (i / (arr.length - 1)) * W;
    const y = H - ((v - min) / range) * H;
    return `${x},${y}`;
  }).join(" ");
  const last = data[data.length - 1];
  const lastX = W, lastY = H - ((last - min) / range) * H;
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="1.5" opacity="0.8" points={pts} />
      <circle cx={lastX} cy={lastY} r="2.5" fill={color} />
    </svg>
  );
}

// ─── IMU Visualizer ────────────────────────────────────────────────────────────
const IMU_MAX = 150;

interface IMUData {
  ax: number; ay: number; az: number;
  gx: number; gy: number; gz: number;
  pitch: number; roll: number;
}

// ─── 3D Cube (pure SVG, isometric projection) ─────────────────────────────────
function Cube3D({ pitch, roll }: { pitch: number; roll: number }) {
  const W = 160, H = 160, CX = 80, CY = 80, S = 36;

  // Convert degrees to radians
  const pr = (pitch * Math.PI) / 180;
  const rr = (roll  * Math.PI) / 180;
  // Yaw fixed at small decorative angle so the cube looks nice at rest
  const yr = 0.4;

  // Rotate a 3D point by pitch(X), roll(Z), then a small yaw(Y)
  const rot = (x: number, y: number, z: number): [number, number, number] => {
    // Roll around Z
    let x1 = x * Math.cos(rr) - y * Math.sin(rr);
    let y1 = x * Math.sin(rr) + y * Math.cos(rr);
    let z1 = z;
    // Pitch around X
    let y2 = y1 * Math.cos(pr) - z1 * Math.sin(pr);
    let z2 = y1 * Math.sin(pr) + z1 * Math.cos(pr);
    let x2 = x1;
    // Yaw around Y
    let x3 = x2 * Math.cos(yr) + z2 * Math.sin(yr);
    let z3 = -x2 * Math.sin(yr) + z2 * Math.cos(yr);
    let y3 = y2;
    return [x3, y3, z3];
  };

  // Project 3D → 2D (simple perspective)
  const proj = (x: number, y: number, z: number): [number, number] => {
    const fov = 3.5;
    const scale = fov / (fov + z / S);
    return [CX + x * scale, CY - y * scale];
  };

  // 8 corners of the cube
  const corners: [number,number,number][] = [
    [-S,-S,-S],[ S,-S,-S],[ S, S,-S],[-S, S,-S],
    [-S,-S, S],[ S,-S, S],[ S, S, S],[-S, S, S],
  ];
  const pts = corners.map(([x,y,z]) => { const [rx,ry,rz] = rot(x,y,z); return proj(rx,ry,rz); });

  // Face definitions [corner indices, base color, label]
  const faces: [number[], string, string][] = [
    [[0,1,2,3], "#1a0a2e", ""],      // back
    [[4,5,6,7], "#4c1d95", "TOP"],   // front (toward camera)
    [[0,1,5,4], "#2d1060", ""],      // bottom
    [[2,3,7,6], "#3b0f8c", ""],      // top
    [[0,3,7,4], "#1e0a4a", "X"],     // left
    [[1,2,6,5], "#311275", "Z"],     // right
  ];

  // Compute face normals to determine visibility & depth sort
  const faceMeta = faces.map(([idxs, color, label]) => {
    const [a,b,c] = idxs.map(i => { const [rx,ry,rz] = rot(...corners[i]); return [rx,ry,rz]; });
    // Compute only Z component of cross product (dot with camera direction)
    const ab = [b[0]-a[0], b[1]-a[1], b[2]-a[2]];
    const ac = [c[0]-a[0], c[1]-a[1], c[2]-a[2]];
    const nz = ab[0]*ac[1] - ab[1]*ac[0];
    const dot = nz;
    const depth = idxs.reduce((s, i) => { const [,,z] = rot(...corners[i]); return s + z; }, 0) / 4;
    return { idxs, color, label, visible: dot > 0, depth };
  });

  const sorted = [...faceMeta].sort((a, b) => a.depth - b.depth);

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {/* Background glow */}
      <defs>
        <radialGradient id="cubeglow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4c1d95" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <ellipse cx={CX} cy={CY+48} rx={44} ry={10} fill="url(#cubeglow)" opacity="0.5" />

      {sorted.map(({ idxs, visible, label }, fi) => {
        if (!visible) return null;
        const poly = idxs.map(i => pts[i].join(",")).join(" ");
        const center = idxs.reduce(([sx,sy],i) => [sx+pts[i][0]/4, sy+pts[i][1]/4], [0,0]);
        const isFront = label === "TOP";
        return (
          <g key={fi}>
            <polygon
              points={poly}
              fill={isFront ? "#2e1065" : "#130728"}
              stroke={isFront ? "#8b5cf6" : "#3b1f6e"}
              strokeWidth={isFront ? 1.5 : 0.8}
              opacity={0.95}
              style={isFront ? { filter: "drop-shadow(0 0 6px #8b5cf6)" } : undefined}
            />
            {/* Axis arrows on front face */}
            {isFront && (
              <>
                <text x={center[0]-2} y={center[1]+4} textAnchor="middle"
                  fill="#c4b5fd" fontSize="9" fontWeight="bold" fontFamily="monospace"
                  style={{ filter: "drop-shadow(0 0 3px #8b5cf6)" }}>IMU</text>
              </>
            )}
          </g>
        );
      })}

      {/* Axis lines at origin */}
      {([ ["#ef4444",[1,0,0]], ["#22c55e",[0,1,0]], ["#3b82f6",[0,0,1]] ] as [string,[number,number,number]][]).map(([col, dir], i) => {
        const [rx0,ry0,rz0] = rot(0,0,0);
        const [rx1,ry1,rz1] = rot(dir[0]*S*1.6, dir[1]*S*1.6, dir[2]*S*1.6);
        const [x0,y0] = proj(rx0,ry0,rz0);
        const [x1,y1] = proj(rx1,ry1,rz1);
        const labels = ["X","Y","Z"];
        return (
          <g key={i}>
            <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={col} strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
            <text x={x1} y={y1-3} textAnchor="middle" fill={col} fontSize="7" fontWeight="bold">{labels[i]}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Artificial Horizon ────────────────────────────────────────────────────────
function ArtificialHorizon({ pitch, roll }: { pitch: number; roll: number }) {
  const W = 160, H = 90, CX = W/2, CY = H/2, R = 40;
  const clampedPitch = Math.max(-60, Math.min(60, pitch));
  // Horizon line offset from center
  const horizonY = CY + (clampedPitch / 60) * R;

  // Sky / ground split via clipped rectangles rotated by roll
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ borderRadius: 8, overflow: "hidden" }}>
      <defs>
        <clipPath id="horizon-clip">
          <circle cx={CX} cy={CY} r={R} />
        </clipPath>
        <radialGradient id="sky-grad" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>
        <radialGradient id="ground-grad" cx="50%" cy="70%" r="70%">
          <stop offset="0%" stopColor="#7c2d12" />
          <stop offset="100%" stopColor="#431407" />
        </radialGradient>
      </defs>

      {/* Background circle */}
      <circle cx={CX} cy={CY} r={R} fill="#0f0f14" stroke="#2d2d3a" strokeWidth="1" />

      {/* Rotating ground/sky group */}
      <g clipPath="url(#horizon-clip)">
        <g style={{ transform: `rotate(${roll}deg)`, transformOrigin: `${CX}px ${CY}px` }}>
          {/* Sky */}
          <rect x={CX-R-4} y={CY-R-4} width={(R+4)*2} height={horizonY - (CY-R-4)} fill="url(#sky-grad)" />
          {/* Ground */}
          <rect x={CX-R-4} y={horizonY} width={(R+4)*2} height={(CY+R+4) - horizonY} fill="url(#ground-grad)" />
          {/* Horizon line */}
          <line x1={CX-R-4} y1={horizonY} x2={CX+R+4} y2={horizonY} stroke="#fbbf24" strokeWidth="1.5" opacity="0.9" />
          {/* Pitch ladder marks */}
          {[-20, -10, 10, 20].map(deg => {
            const lineY = horizonY + (deg / 60) * R;
            const lw = Math.abs(deg) === 20 ? 20 : 12;
            return (
              <g key={deg}>
                <line x1={CX-lw} y1={lineY} x2={CX+lw} y2={lineY} stroke="#fbbf24" strokeWidth="0.8" opacity="0.5" />
                <text x={CX-lw-4} y={lineY+3} textAnchor="end" fill="#fbbf24" fontSize="5" opacity="0.6">{deg > 0 ? "+":""}{deg}</text>
              </g>
            );
          })}
        </g>
      </g>

      {/* Fixed aircraft symbol */}
      <g>
        <line x1={CX-18} y1={CY} x2={CX-6} y2={CY} stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
        <line x1={CX+6}  y1={CY} x2={CX+18} y2={CY} stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
        <circle cx={CX} cy={CY} r="2.5" fill="#fbbf24" />
        <line x1={CX} y1={CY-4} x2={CX} y2={CY-10} stroke="#fbbf24" strokeWidth="1.5" />
      </g>

      {/* Roll arc indicator at top */}
      <g style={{ transform: `rotate(${-roll}deg)`, transformOrigin: `${CX}px ${CY}px` }}>
        <polygon points={`${CX},${CY-R+2} ${CX-3},${CY-R+8} ${CX+3},${CY-R+8}`} fill="#fbbf24" />
      </g>

      {/* Rim */}
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#3d3d4e" strokeWidth="1.5" />

      {/* Roll tick marks on rim */}
      {[-60,-30,-10, 10,30,60].map(deg => {
        const rad = (deg - 90) * Math.PI / 180;
        const inner = R - 4, outer = R;
        return (
          <line key={deg}
            x1={CX + inner*Math.cos(rad)} y1={CY + inner*Math.sin(rad)}
            x2={CX + outer*Math.cos(rad)} y2={CY + outer*Math.sin(rad)}
            stroke="#6b7280" strokeWidth="1" />
        );
      })}
    </svg>
  );
}

// ─── G-Force Ring ──────────────────────────────────────────────────────────────
function GForceRing({ ax, ay, az }: { ax: number; ay: number; az: number }) {
  const g = Math.sqrt(ax*ax + ay*ay + az*az);
  const pct = Math.min(1, g / 3);
  const R = 28, C = 36;
  const color = g < 1.3 ? "#22c55e" : g < 2 ? "#f97316" : "#ef4444";
  const toRad = (d: number) => (d - 90) * Math.PI / 180;
  const arc = (deg: number) => [C + R*Math.cos(toRad(deg)), C + R*Math.sin(toRad(deg))];
  const endDeg = pct * 360;
  const [ex, ey] = arc(endDeg);
  const [sx, sy] = arc(0);
  const large = endDeg > 180 ? 1 : 0;
  const pathD = endDeg >= 359.9
    ? `M ${sx} ${sy} A ${R} ${R} 0 1 1 ${sx - 0.01} ${sy}`
    : `M ${sx} ${sy} A ${R} ${R} 0 ${large} 1 ${ex} ${ey}`;
  return (
    <svg width={72} height={72} viewBox="0 0 72 72">
      <circle cx={C} cy={C} r={R} fill="none" stroke="#1a1a24" strokeWidth="5" />
      <path d={pathD} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
      <text x={C} y={C-3} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="monospace">{g.toFixed(2)}</text>
      <text x={C} y={C+8} textAnchor="middle" fill="#6b7280" fontSize="6" fontFamily="monospace">G-force</text>
    </svg>
  );
}

// ─── Motion Trail ──────────────────────────────────────────────────────────────
function MotionTrail({ history }: { history: IMUData[] }) {
  if (history.length < 2) return null;
  const W = 140, H = 80, CX = W/2, CY = H/2;
  const recent = history.slice(-40);
  const pts = recent.map((h, i) => {
    const x = CX + Math.max(-CX+4, Math.min(CX-4, h.roll * 0.8));
    const y = CY + Math.max(-CY+4, Math.min(CY-4, -h.pitch * 0.6));
    return { x, y, i, total: recent.length };
  });
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <rect width={W} height={H} fill="#080810" rx={6} />
      <line x1={CX} y1={4} x2={CX} y2={H-4} stroke="#1e1e2a" strokeWidth="0.5" />
      <line x1={4} y1={CY} x2={W-4} y2={CY} stroke="#1e1e2a" strokeWidth="0.5" />
      {/* Trail */}
      {pts.slice(0, -1).map((p, i) => {
        const next = pts[i+1];
        const alpha = (i / pts.length) * 0.8;
        return <line key={i} x1={p.x} y1={p.y} x2={next.x} y2={next.y}
          stroke="#8b5cf6" strokeWidth="1.5" opacity={alpha} strokeLinecap="round" />;
      })}
      {/* Current position dot */}
      {pts.length > 0 && (
        <>
          <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r={5} fill="#8b5cf6"
            style={{ filter: "drop-shadow(0 0 4px #8b5cf6)" }} />
          <circle cx={pts[pts.length-1].x} cy={pts[pts.length-1].y} r={9} fill="none"
            stroke="#8b5cf6" strokeWidth="1" opacity="0.3" />
        </>
      )}
    </svg>
  );
}

export function IMUVisualizerPanel({ logs, onClose }: { logs: string[]; onClose: () => void }) {
  const [history, setHistory] = useState<IMUData[]>([]);
  const [latest, setLatest] = useState<IMUData | null>(null);
  const [tab, setTab] = useState<"3d" | "horizon" | "graphs">("3d");

  // Demo animation when no real data
  const animRef = useRef<number>(0);
  const [demo, setDemo] = useState<IMUData>({ ax:0, ay:0, az:1, gx:0, gy:0, gz:0, pitch:0, roll:0 });
  const demoT = useRef(0);

  useEffect(() => {
    const last = [...logs].reverse().find(l => stripLogPrefix(l).startsWith("MPU6050,"));
    if (!last) return;
    const raw = stripLogPrefix(last);
    const parts = raw.split(",");
    if (parts.length < 9) return;
    const [, ax, ay, az, gx, gy, gz, pitch, roll] = parts.map((v, i) => i === 0 ? 0 : parseFloat(v));
    const entry: IMUData = { ax, ay, az, gx, gy, gz, pitch, roll };
    setLatest(entry);
    setHistory(prev => [...prev.slice(-(IMU_MAX - 1)), entry]);
  }, [logs]);

  // Gentle idle animation when no live data
  useEffect(() => {
    if (latest) return;
    const tick = () => {
      demoT.current += 0.012;
      const t = demoT.current;
      setDemo({
        ax: Math.sin(t * 0.7) * 0.3,
        ay: Math.cos(t * 0.5) * 0.2,
        az: 1 + Math.sin(t * 1.1) * 0.05,
        gx: Math.sin(t * 1.3) * 15,
        gy: Math.cos(t * 0.9) * 20,
        gz: Math.sin(t * 0.6) * 10,
        pitch: Math.sin(t * 0.4) * 18,
        roll:  Math.cos(t * 0.3) * 22,
      });
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [latest]);

  const data = latest ?? demo;
  const isLive = !!latest;

  const gTotal = Math.sqrt(data.ax**2 + data.ay**2 + data.az**2);
  const gyroTotal = Math.sqrt(data.gx**2 + data.gy**2 + data.gz**2);

  return (
    <PanelShell title="IMU Visualizer — MPU6050" icon={<Activity className="w-4 h-4" />}
      color="#8b5cf6" onClose={onClose} initialPos={{ x: 24, y: 80 }} width={400}>

      {/* Live / Demo badge */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#1a1a24]">
        <div className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-green-400 shadow-[0_0_4px_#22c55e]" : "bg-amber-500"} animate-pulse`} />
        <span className={`text-[9px] font-bold ${isLive ? "text-green-400" : "text-amber-500"}`}>
          {isLive ? "LIVE DATA" : "DEMO MODE"}
        </span>
        {!isLive && <span className="text-[9px] text-zinc-600">→ run MPU6050 code to see real data</span>}

        {/* Tab switcher */}
        <div className="ml-auto flex gap-1">
          {(["3d","horizon","graphs"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${
                tab === t ? "border-violet-500/60 bg-violet-500/15 text-violet-300" : "border-[#2d2d35] text-zinc-500 hover:text-zinc-300"
              }`}>
              {t === "3d" ? "3D" : t === "horizon" ? "AH" : "≈"}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 space-y-3">
        {tab === "3d" && (
          <>
            {/* 3D cube + horizon side by side */}
            <div className="flex gap-3 items-center justify-center">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">3D Orientation</span>
                <Cube3D pitch={data.pitch} roll={data.roll} />
              </div>
              <div className="flex flex-col gap-3">
                {/* G-force ring */}
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">G-Force</span>
                  <GForceRing ax={data.ax} ay={data.ay} az={data.az} />
                </div>
              </div>
            </div>

            {/* Motion trail */}
            <div className="rounded-xl border border-[#1e1e26] bg-[#080810] p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Motion Trail</span>
                <span className="text-[9px] font-mono text-zinc-600">{history.length} samples</span>
              </div>
              <div className="flex justify-center">
                <MotionTrail history={isLive ? history : [demo]} />
              </div>
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Pitch", value: data.pitch.toFixed(1)+"°", color: "#8b5cf6" },
                { label: "Roll",  value: data.roll.toFixed(1)+"°",  color: "#ec4899" },
                { label: "ω",     value: gyroTotal.toFixed(0)+"°/s", color: "#06b6d4" },
              ].map(s => (
                <div key={s.label} className="rounded-lg border border-[#1e1e26] bg-[#0c0c12] p-2 text-center">
                  <div className="text-[9px] text-zinc-500 uppercase tracking-wider">{s.label}</div>
                  <div className="text-sm font-bold font-mono mt-0.5" style={{ color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "horizon" && (
          <>
            <div className="flex gap-3 items-start justify-center">
              <div className="flex flex-col items-center gap-1">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Artificial Horizon</span>
                <ArtificialHorizon pitch={data.pitch} roll={data.roll} />
              </div>
              <div className="flex flex-col gap-2 flex-1">
                <GForceRing ax={data.ax} ay={data.ay} az={data.az} />
                {[
                  { label: "Pitch", val: data.pitch, max: 90, color: "#8b5cf6", unit: "°" },
                  { label: "Roll",  val: data.roll,  max: 90, color: "#ec4899", unit: "°" },
                ].map(s => (
                  <div key={s.label} className="rounded-lg border border-[#1e1e26] bg-[#0c0c12] p-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-[9px] text-zinc-500">{s.label}</span>
                      <span className="text-[10px] font-mono font-bold" style={{color:s.color}}>{s.val.toFixed(1)}{s.unit}</span>
                    </div>
                    <div className="relative h-1.5 rounded-full bg-[#1e1e26] overflow-hidden">
                      <div className="absolute top-0 bottom-0 rounded-full transition-all"
                        style={{
                          left: "50%",
                          width: `${Math.abs(s.val) / s.max * 50}%`,
                          transform: s.val < 0 ? "translateX(-100%)" : "none",
                          background: s.color,
                          boxShadow: `0 0 6px ${s.color}`,
                        }} />
                      <div className="absolute top-0 bottom-0 w-px bg-zinc-600" style={{ left: "50%" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === "graphs" && (
          <>
            {/* Accel */}
            <div className="rounded-xl border border-[#1e1e26] bg-[#0c0c10] p-2.5">
              <div className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold mb-2">Accelerometer (g)</div>
              {(["ax","ay","az"] as const).map((k, i) => {
                const colors = ["#ef4444","#22c55e","#3b82f6"];
                const vals = history.map(h => h[k]);
                return (
                  <div key={k} className="flex items-center gap-2 mb-1.5">
                    <span className="text-[9px] font-mono w-6 font-bold" style={{ color: colors[i] }}>{k.toUpperCase()}</span>
                    <div className="flex-1 relative h-8 bg-[#080810] rounded overflow-hidden">
                      <Sparkline data={vals.length ? vals : [data[k]]} color={colors[i]} min={-4} max={4} height={32} />
                      {/* zero line */}
                      <div className="absolute top-1/2 left-0 right-0 h-px bg-[#2d2d35]" />
                    </div>
                    <span className="text-[10px] font-mono font-bold w-12 text-right" style={{ color: colors[i] }}>
                      {data[k].toFixed(3)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Gyro */}
            <div className="rounded-xl border border-[#1e1e26] bg-[#0c0c10] p-2.5">
              <div className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold mb-2">Gyroscope (°/s)</div>
              {(["gx","gy","gz"] as const).map((k, i) => {
                const colors = ["#f97316","#eab308","#a855f7"];
                const vals = history.map(h => h[k]);
                return (
                  <div key={k} className="flex items-center gap-2 mb-1.5">
                    <span className="text-[9px] font-mono w-6 font-bold" style={{ color: colors[i] }}>{k.toUpperCase()}</span>
                    <div className="flex-1 relative h-8 bg-[#080810] rounded overflow-hidden">
                      <Sparkline data={vals.length ? vals : [data[k]]} color={colors[i]} min={-500} max={500} height={32} />
                      <div className="absolute top-1/2 left-0 right-0 h-px bg-[#2d2d35]" />
                    </div>
                    <span className="text-[10px] font-mono font-bold w-12 text-right" style={{ color: colors[i] }}>
                      {data[k].toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="text-center text-[9px] text-zinc-600 font-mono">
              Total G: <span className="text-violet-400">{gTotal.toFixed(3)}</span> &nbsp;|&nbsp;
              ω: <span className="text-cyan-400">{gyroTotal.toFixed(1)}°/s</span>
            </div>
          </>
        )}

        {!isLive && (
          <div className="text-center py-1 text-[9px] text-zinc-600 border border-dashed border-[#1e1e26] rounded-xl">
            Output: <code className="text-violet-400 font-mono">print(f"MPU6050,{"{ax},{ay},{az},{gx},{gy},{gz},{pitch},{roll}"}")</code>
          </div>
        )}
      </div>
    </PanelShell>
  );
}

// ─── Sensor Gauge Visualizer ───────────────────────────────────────────────────
const SENSOR_MAX = 200;

interface SensorChannel {
  label: string;
  type: string;
  values: number[];
  latest: number;
}

function ArcGauge({ value, min, max, color, label }: { value: number; min: number; max: number; color: string; label: string }) {
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const R = 28, C = 36, startAngle = 220, sweep = 280;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arc = (angle: number) => ({
    x: C + R * Math.cos(toRad(angle - 90)),
    y: C + R * Math.sin(toRad(angle - 90)),
  });
  const arcPath = (from: number, to: number) => {
    const s = arc(from), e = arc(to);
    const large = to - from > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${R} ${R} 0 ${large} 1 ${e.x} ${e.y}`;
  };
  const valAngle = startAngle + pct * sweep;
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <path d={arcPath(startAngle, startAngle + sweep)} fill="none" stroke="#1e1e26" strokeWidth="5" strokeLinecap="round" />
      <path d={arcPath(startAngle, valAngle)} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <text x="36" y="38" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="monospace">
        {value.toFixed(1)}
      </text>
      <text x="36" y="50" textAnchor="middle" fill="#6b7280" fontSize="6" fontFamily="monospace">
        {label.slice(0, 8)}
      </text>
    </svg>
  );
}

function DigitalTimeline({ values }: { values: number[] }) {
  const recent = values.slice(-40);
  return (
    <div className="flex items-center gap-px h-5">
      {recent.map((v, i) => (
        <div key={i} className="flex-1 h-full rounded-sm" style={{ background: v ? "#22c55e" : "#1a1a20" }} />
      ))}
    </div>
  );
}

export function SensorVizPanel({ logs, onClose }: { logs: string[]; onClose: () => void }) {
  const [channels, setChannels] = useState<Map<string, SensorChannel>>(new Map());

  useEffect(() => {
    const raw = logs.map(stripLogPrefix).filter((l) => l.startsWith("SENSOR,"));
    if (raw.length === 0) return;
    const last20 = raw.slice(-20);
    setChannels((prev) => {
      const updated = new Map(prev);
      for (const line of last20) {
        const [, type, label, valStr] = line.split(",");
        if (!type || !label || valStr === undefined) continue;
        const val = parseFloat(valStr);
        if (isNaN(val)) continue;
        const existing = updated.get(label);
        updated.set(label, {
          label,
          type: type.toLowerCase(),
          values: [...(existing?.values ?? []).slice(-(SENSOR_MAX - 1)), val],
          latest: val,
        });
      }
      return updated;
    });
  }, [logs]);

  const chans = Array.from(channels.values());

  const colorOf = (type: string) => {
    if (type === "digital") return "#22c55e";
    if (type === "angle") return "#f97316";
    if (type === "raw") return "#a855f7";
    return "#3b82f6";
  };

  return (
    <PanelShell title="Sensor Visualizer" icon={<Gauge className="w-4 h-4" />}
      color="#22c55e" onClose={onClose} initialPos={{ x: 24, y: 420 }} width={360}>
      <div className="p-3 space-y-2 max-h-[420px] overflow-y-auto">
        {chans.length === 0 ? (
          <div className="text-center py-4 text-[10px] text-zinc-600 space-y-1">
            <p>No sensor data yet.</p>
            <p className="text-zinc-700">Output format: <code className="text-green-500">SENSOR,analog,Temperature,23.5</code></p>
          </div>
        ) : (
          chans.map((ch) => {
            const color = colorOf(ch.type);
            const min = Math.min(...ch.values), max = Math.max(...ch.values);
            const avg = ch.values.reduce((a, b) => a + b, 0) / ch.values.length;
            return (
              <div key={ch.label} className="rounded-xl border border-[#1e1e26] bg-[#0c0c10] p-2.5">
                <div className="flex items-start gap-3">
                  {ch.type === "digital" ? (
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${ch.latest ? "bg-green-500/20" : "bg-zinc-800"}`}>
                      {ch.latest ? "🟢" : "⚫"}
                    </div>
                  ) : (
                    <ArcGauge value={ch.latest} min={min === max ? min - 1 : min} max={min === max ? max + 1 : max} color={color} label={ch.label} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs font-bold text-white truncate">{ch.label}</span>
                      <span className="text-[8px] px-1 py-0.5 rounded font-bold"
                        style={{ color, background: `${color}15`, border: `1px solid ${color}30` }}>
                        {ch.type}
                      </span>
                    </div>
                    {ch.type === "digital" ? (
                      <DigitalTimeline values={ch.values} />
                    ) : (
                      <Sparkline data={ch.values} color={color} min={min} max={max} height={28} />
                    )}
                    {ch.type !== "digital" && (
                      <div className="flex gap-3 mt-1 text-[9px] font-mono">
                        <span className="text-zinc-600">min <span style={{ color }}>{min.toFixed(1)}</span></span>
                        <span className="text-zinc-600">avg <span style={{ color }}>{avg.toFixed(1)}</span></span>
                        <span className="text-zinc-600">max <span style={{ color }}>{max.toFixed(1)}</span></span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </PanelShell>
  );
}

// ─── Ultrasonic Radar ──────────────────────────────────────────────────────────
interface RadarBlip { angle: number; distance: number; age: number; }
const RADAR_MAX_CM = 400;

export function RadarPanel({ logs, onClose }: { logs: string[]; onClose: () => void }) {
  const [blips, setBlips] = useState<RadarBlip[]>([]);
  const [sweepAngle, setSweepAngle] = useState(0);
  const [latest, setLatest] = useState<{ angle: number; distance: number } | null>(null);

  useEffect(() => {
    const raw = logs.map(stripLogPrefix).filter(
      (l) => l.startsWith("RADAR,") || l.startsWith("SERVO,")
    );
    if (raw.length === 0) return;
    const last = raw[raw.length - 1];
    const parts = last.split(",");
    if (parts.length < 3) return;
    const angle = parseFloat(parts[1]);
    const distance = parseFloat(parts[2]);
    if (isNaN(angle) || isNaN(distance)) return;
    setSweepAngle(angle);
    setLatest({ angle, distance });
    if (distance < RADAR_MAX_CM) {
      setBlips((prev) => [
        ...prev.map((b) => ({ ...b, age: b.age + 1 })).filter((b) => b.age < 80),
        { angle, distance, age: 0 },
      ]);
    } else {
      setBlips((prev) => prev.map((b) => ({ ...b, age: b.age + 1 })).filter((b) => b.age < 80));
    }
  }, [logs]);

  const CX = 160, CY = 160, R = 140;
  const toXY = (angleDeg: number, dist: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    const r = (Math.min(dist, RADAR_MAX_CM) / RADAR_MAX_CM) * R;
    return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
  };
  const sweepRad = ((sweepAngle - 90) * Math.PI) / 180;

  const zone = !latest ? "—"
    : latest.distance < 50 ? "🔴 CLOSE"
    : latest.distance < 150 ? "🟡 MID"
    : latest.distance < RADAR_MAX_CM ? "🟢 FAR"
    : "· No echo";

  return (
    <PanelShell title="Ultrasonic Radar" icon={<Radio className="w-4 h-4" />}
      color="#14b8a6" onClose={onClose} initialPos={{ x: 400, y: 80 }} width={340}>
      <div className="p-3">
        <svg width="320" height="200" viewBox={`0 ${CY - R - 10} ${CX * 2} ${R + 20}`} className="w-full">
          {/* Radar rings */}
          {[0.25, 0.5, 0.75, 1].map((f) => (
            <path key={f}
              d={`M ${CX - R * f} ${CY} A ${R * f} ${R * f} 0 0 1 ${CX + R * f} ${CY}`}
              fill="none" stroke="#1e2a1e" strokeWidth={f === 1 ? 1.5 : 0.8} />
          ))}
          {/* Angle lines */}
          {[0, 30, 60, 90, 120, 150, 180].map((a) => {
            const rad = ((a - 90) * Math.PI) / 180;
            return <line key={a} x1={CX} y1={CY} x2={CX + R * Math.cos(rad)} y2={CY + R * Math.sin(rad)} stroke="#1e2a1e" strokeWidth="0.8" />;
          })}
          {/* Ring labels */}
          {[100, 200, 300, 400].map((cm, i) => (
            <text key={cm} x={CX + 4} y={CY - R * ((i + 1) / 4) - 2} fill="#2a4a2a" fontSize="7" fontFamily="monospace">{cm}cm</text>
          ))}
          {/* Sweep line glow */}
          <line x1={CX} y1={CY}
            x2={CX + R * Math.cos(sweepRad)} y2={CY + R * Math.sin(sweepRad)}
            stroke="#14b8a6" strokeWidth="1.5" opacity="0.7"
            style={{ filter: "drop-shadow(0 0 4px #14b8a6)" }} />
          {/* Blips */}
          {blips.map((b, i) => {
            const { x, y } = toXY(b.angle, b.distance);
            const opacity = Math.max(0, 1 - b.age / 80);
            return (
              <circle key={i} cx={x} cy={y} r={3 + (1 - opacity) * 3}
                fill="#14b8a6" opacity={opacity * 0.9}
                style={{ filter: `drop-shadow(0 0 ${4 * opacity}px #14b8a6)` }} />
            );
          })}
          {/* Sweep dot */}
          <circle cx={CX + R * Math.cos(sweepRad)} cy={CY + R * Math.sin(sweepRad)} r="3"
            fill="#14b8a6" style={{ filter: "drop-shadow(0 0 6px #14b8a6)" }} />
        </svg>

        {/* Info bar */}
        <div className="flex items-center gap-3 mt-1">
          <div className="flex-1 px-2.5 py-2 rounded-xl bg-[#0c0c10] border border-[#1e1e26]">
            <div className="text-[9px] text-zinc-600 mb-0.5">Angle</div>
            <div className="text-sm font-mono font-bold text-cyan-400">{latest ? `${latest.angle.toFixed(0)}°` : "—"}</div>
          </div>
          <div className="flex-1 px-2.5 py-2 rounded-xl bg-[#0c0c10] border border-[#1e1e26]">
            <div className="text-[9px] text-zinc-600 mb-0.5">Distance</div>
            <div className="text-sm font-mono font-bold text-cyan-400">{latest ? `${latest.distance.toFixed(0)} cm` : "—"}</div>
          </div>
          <div className="flex-1 px-2.5 py-2 rounded-xl bg-[#0c0c10] border border-[#1e1e26] text-center">
            <div className="text-[9px] text-zinc-600 mb-0.5">Zone</div>
            <div className="text-[10px] font-bold">{zone}</div>
          </div>
        </div>

        {!latest && (
          <p className="text-center text-[9px] text-zinc-700 mt-2">
            Output: <code className="text-cyan-500">RADAR,angle,distance</code>
          </p>
        )}
      </div>
    </PanelShell>
  );
}
