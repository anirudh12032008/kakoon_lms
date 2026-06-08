/**
 * DataViz — floating real-time data visualisation panels
 *
 * Parses ESP32 serial output lines (from the logs[] array) looking for:
 *   IMU:      "IMU,ax,ay,az,gx,gy,gz,pitch,roll"
 *   Sensor:   "SENSOR,type,label,value"   (type = analog|digital|angle|raw)
 *   Radar:    "RADAR,angle,distance"  or  "SERVO,angle,distance"
 *
 * Each panel is a standalone draggable card rendered via createPortal.
 */

import { useEffect, useId, useRef, useState } from "react";
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
      className="fixed z-[8888] overflow-hidden rounded-2xl border border-[var(--k-border)] bg-[#09090b] shadow-2xl flex flex-col select-none"
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

function parseImuSample(line: string): IMUData | null {
  const raw = stripLogPrefix(line);
  // Accept "IMU,..." or legacy "MPU6050,..."
  const match = raw.match(/(?:IMU|MPU6050|LSM6DS3),(.+)/);
  if (!match) return null;
  const parts = match[1].split(",");
  if (parts.length < 8) return null;
  const values = parts.slice(0, 8).map(Number);
  if (values.some(isNaN)) return null;
  const [ax, ay, az, gx, gy, gz, pitch, roll] = values;
  return { ax, ay, az, gx, gy, gz, pitch, roll };
}

// ─── 3D Cube (pure SVG, isometric projection) ─────────────────────────────────
function Cube3D({ pitch, roll }: { pitch: number; roll: number }) {
  const uid = useId();
  const glowId = `${uid}-cubeglow`;
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
        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4c1d95" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx={CX} cy={CY+48} rx={44} ry={10} fill={`url(#${glowId})`} opacity="0.5" />

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
  const uid = useId();
  const clipId = `${uid}-horizon-clip`;
  const skyId = `${uid}-sky-grad`;
  const groundId = `${uid}-ground-grad`;
  const W = 160, H = 90, CX = W/2, CY = H/2, R = 40;
  const clampedPitch = Math.max(-60, Math.min(60, pitch));
  // Horizon line offset from center
  const horizonY = CY + (clampedPitch / 60) * R;

  // Sky / ground split via clipped rectangles rotated by roll
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ borderRadius: 8, overflow: "hidden" }}>
      <defs>
        <clipPath id={clipId}>
          <circle cx={CX} cy={CY} r={R} />
        </clipPath>
        <radialGradient id={skyId} cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>
        <radialGradient id={groundId} cx="50%" cy="70%" r="70%">
          <stop offset="0%" stopColor="#7c2d12" />
          <stop offset="100%" stopColor="#431407" />
        </radialGradient>
      </defs>

      {/* Background circle */}
      <circle cx={CX} cy={CY} r={R} fill="#0f0f14" stroke="#2d2d3a" strokeWidth="1" />

      {/* Rotating ground/sky group */}
      <g clipPath={`url(#${clipId})`}>
        <g style={{ transform: `rotate(${roll}deg)`, transformOrigin: `${CX}px ${CY}px` }}>
          {/* Sky */}
          <rect x={CX-R-4} y={CY-R-4} width={(R+4)*2} height={horizonY - (CY-R-4)} fill={`url(#${skyId})`} />
          {/* Ground */}
          <rect x={CX-R-4} y={horizonY} width={(R+4)*2} height={(CY+R+4) - horizonY} fill={`url(#${groundId})`} />
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
  const prevLenRef = useRef(0);

  useEffect(() => {
    const prev = prevLenRef.current;
    const cur  = logs.length;
    prevLenRef.current = cur;

    // Which lines are actually new?
    // • cur > prev  → normal growth, slice from prev
    // • cur === prev && cur > 0 → cap (100) hit: array shifted, last entry is new
    // • cur < prev  → logs were cleared, nothing to do
    const toProcess: string[] =
      cur > prev  ? logs.slice(prev) :
      cur === prev && cur > 0 ? [logs[cur - 1]] :
      [];

    for (const line of toProcess) {
      const entry = parseImuSample(line);
      if (!entry) continue;
      setLatest(entry);
      setHistory(h => [...h.slice(-(IMU_MAX - 1)), entry]);
    }
  }, [logs]);

  const clearHistory = () => { setHistory([]); setLatest(null); };

  const placeholder: IMUData = { ax: 0, ay: 0, az: 1, gx: 0, gy: 0, gz: 0, pitch: 0, roll: 0 };
  const data = latest ?? placeholder;
  const isLive = !!latest;

  const gTotal = Math.sqrt(data.ax**2 + data.ay**2 + data.az**2);
  const gyroTotal = Math.sqrt(data.gx**2 + data.gy**2 + data.gz**2);

  return (
    <PanelShell title="IMU — LSM6DS3 Onboard" icon={<Activity className="w-4 h-4" />}
      color="#8b5cf6" onClose={onClose} initialPos={{ x: 24, y: 80 }} width={400}>

      {/* Toolbar: live badge + tabs + refresh */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#1a1a24]">
        <div className={`w-1.5 h-1.5 rounded-full ${isLive ? "bg-green-400 shadow-[0_0_4px_#22c55e]" : "bg-amber-500"} animate-pulse flex-shrink-0`} />
        {isLive
          ? <span className="text-[9px] font-bold text-green-400">LIVE  ·  {history.length} pts</span>
          : <span className="text-[9px] text-zinc-600">Waiting for LSM6DS3 telemetry…</span>
        }

        {/* Tab switcher */}
        <div className="ml-auto flex gap-1">
          {(["3d","horizon","graphs"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${
                tab === t ? "border-violet-500/60 bg-violet-500/15 text-violet-300" : "border-[var(--k-border)] text-zinc-500 hover:text-[var(--k-text)]"
              }`}>
              {t === "3d" ? "3D" : t === "horizon" ? "AH" : "≈"}
            </button>
          ))}
        </div>

        {/* Refresh / clear button */}
        <button
          onClick={clearHistory}
          title="Clear history"
          className="ml-1 px-2 py-0.5 rounded border border-[var(--k-border)] text-[9px] font-bold text-zinc-500 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 transition-all"
        >↺</button>
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
            <div className="rounded-xl border border-[var(--k-base-400)] bg-[#080810] p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Motion Trail</span>
                <span className="text-[9px] font-mono text-zinc-600">{history.length} samples</span>
              </div>
              <div className="flex justify-center">
                <MotionTrail history={history} />
              </div>
            </div>

            {/* Quick stats row */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Pitch", value: data.pitch.toFixed(1)+"°", color: "#8b5cf6" },
                { label: "Roll",  value: data.roll.toFixed(1)+"°",  color: "#ec4899" },
                { label: "ω",     value: gyroTotal.toFixed(0)+"°/s", color: "#06b6d4" },
              ].map(s => (
                <div key={s.label} className="rounded-lg border border-[var(--k-base-400)] bg-[#0c0c12] p-2 text-center">
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
                  <div key={s.label} className="rounded-lg border border-[var(--k-base-400)] bg-[#0c0c12] p-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-[9px] text-zinc-500">{s.label}</span>
                      <span className="text-[10px] font-mono font-bold" style={{color:s.color}}>{s.val.toFixed(1)}{s.unit}</span>
                    </div>
                    <div className="relative h-1.5 rounded-full bg-[var(--k-base-400)] overflow-hidden">
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
            <div className="rounded-xl border border-[var(--k-base-400)] bg-[var(--k-base-100)] p-2.5">
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
                      <div className="absolute top-1/2 left-0 right-0 h-px bg-[var(--k-border)]" />
                    </div>
                    <span className="text-[10px] font-mono font-bold w-12 text-right" style={{ color: colors[i] }}>
                      {data[k].toFixed(3)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Gyro */}
            <div className="rounded-xl border border-[var(--k-base-400)] bg-[var(--k-base-100)] p-2.5">
              <div className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold mb-2">Gyroscope (°/s)</div>
              {(["gx","gy","gz"] as const).map((k, i) => {
                const colors = ["#f97316","#eab308","#a855f7"];
                const vals = history.map(h => h[k]);
                return (
                  <div key={k} className="flex items-center gap-2 mb-1.5">
                    <span className="text-[9px] font-mono w-6 font-bold" style={{ color: colors[i] }}>{k.toUpperCase()}</span>
                    <div className="flex-1 relative h-8 bg-[#080810] rounded overflow-hidden">
                      <Sparkline data={vals.length ? vals : [data[k]]} color={colors[i]} min={-500} max={500} height={32} />
                      <div className="absolute top-1/2 left-0 right-0 h-px bg-[var(--k-border)]" />
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
          <div className="text-center py-2 text-[9px] text-zinc-600 border border-dashed border-[var(--k-base-400)] rounded-xl space-y-1">
            <p>Add an <span className="text-violet-400 font-bold">IMU Sensor</span> node inside a Forever Loop and run it.</p>
            <p className="font-mono text-[8px] text-zinc-700">Expected: <span className="text-violet-400">IMU,ax,ay,az,gx,gy,gz,pitch,roll</span></p>
          </div>
        )}
      </div>
    </PanelShell>
  );
}

// ─── Sensor Visualizer ────────────────────────────────────────────────────────
const SENSOR_MAX = 200;
const VIZ_STALE  = 3000;

interface SensorChannel { label: string; type: string; values: number[]; latest: number; ts: number; }

type SensorKind = "pir" | "ir-beam" | "ir-remote" | "digital" | "analog" | "angle";
function inferKind(label: string, type: string): SensorKind {
  const l = label.toLowerCase();
  if (l.includes("pir") || l.includes("motion")) return "pir";
  if ((l.includes("ir") || l.includes("infrared")) && type === "raw") return "ir-remote";
  if (l.includes("ir") || l.includes("infrared")) return "ir-beam";
  if (type === "angle")   return "angle";
  if (type === "digital") return "digital";
  return "analog";
}

function ChannelHeader({ label, badge, color, live }: { label: string; badge: string; color: string; live: boolean }) {
  return (
    <div className="flex items-center gap-1.5 mb-2">
      <span className="text-xs font-bold text-white truncate">{label}</span>
      <span className="text-[8px] px-1 py-0.5 rounded font-bold"
        style={{ color, background: `${color}15`, border: `1px solid ${color}30` }}>{badge}</span>
      <div className="ml-auto flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full"
          style={{ background: live ? color : "var(--k-base-400)", animation: live ? "pulse 2s ease-in-out infinite" : "none" }} />
        <span className="text-[8px] text-zinc-600 font-mono">{live ? "LIVE" : "stale"}</span>
      </div>
    </div>
  );
}

function DigitalTimeline({ values, color }: { values: number[]; color: string }) {
  return (
    <div className="flex items-end gap-px h-5 mt-1">
      {values.slice(-50).map((v, i) => (
        <div key={i} className="flex-1 rounded-sm transition-all"
          style={{ height: v ? "100%" : "28%", background: v ? color : "var(--k-base-400)" }} />
      ))}
    </div>
  );
}

function ArcGauge({ value, min, max, color }: { value: number; min: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const R = 26, C = 34, startAngle = 220, sweep = 280;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const pt = (a: number) => ({ x: C + R * Math.cos(toRad(a - 90)), y: C + R * Math.sin(toRad(a - 90)) });
  const arc = (from: number, to: number) => {
    const s = pt(from), e = pt(to);
    return `M ${s.x} ${s.y} A ${R} ${R} 0 ${to - from > 180 ? 1 : 0} 1 ${e.x} ${e.y}`;
  };
  return (
    <svg width="68" height="60" viewBox="0 0 68 60" className="flex-shrink-0">
      <path d={arc(startAngle, startAngle + sweep)} fill="none" stroke="var(--k-base-400)" strokeWidth="5" strokeLinecap="round" />
      <path d={arc(startAngle, startAngle + pct * sweep)} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <text x="34" y="36" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="monospace">
        {value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}
      </text>
    </svg>
  );
}

function PIRCard({ ch, live }: { ch: SensorChannel; live: boolean }) {
  const detected = live && ch.latest === 1;
  const color    = detected ? "#22c55e" : "#52525b";
  return (
    <div className="rounded-2xl border bg-[var(--k-base-100)] p-3 transition-all duration-300"
      style={{ borderColor: detected ? "#22c55e50" : "var(--k-base-400)", boxShadow: detected ? "0 0 20px #22c55e22" : "none" }}>
      <ChannelHeader label={ch.label} badge="PIR" color="#22c55e" live={live} />
      <div className="flex items-center gap-3">
        <svg width="52" height="40" viewBox="0 0 56 44" className="flex-shrink-0">
          {[18, 26, 34].map((r, i) => (
            <path key={r} d={`M ${28 - r} 38 A ${r} ${r} 0 0 1 ${28 + r} 38`}
              fill="none" stroke="#22c55e" strokeWidth="1.2"
              opacity={detected ? 0.25 + i * 0.2 : 0.06 + i * 0.04} />
          ))}
          {detected && [10, 20].map((r, i) => (
            <circle key={r} cx="28" cy="38" r={r} fill="none" stroke="#22c55e" strokeWidth="0.8"
              opacity={0} style={{ animation: `pirBurst 1.2s ease-out ${i * 0.4}s infinite` }} />
          ))}
          <line x1="28" y1="38" x2="28" y2="6" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"
            opacity={live ? 0.7 : 0.2}
            style={{ transformOrigin: "28px 38px", animation: live ? "pirSweep 2s linear infinite" : "none" }} />
          <circle cx="28" cy="38" r="2.5" fill="#22c55e" opacity={live ? 0.9 : 0.3}
            style={{ filter: detected ? "drop-shadow(0 0 5px #22c55e)" : "none" }} />
        </svg>
        <div className="flex-1">
          <span className="text-[15px] font-bold block mb-1.5 transition-colors duration-300" style={{ color }}>
            {!live ? "🔌 Waiting..." : detected ? "🏃 Motion!" : "😴 All Clear"}
          </span>
          <DigitalTimeline values={ch.values} color="#22c55e" />
        </div>
      </div>
    </div>
  );
}

function IRBeamCard({ ch, live }: { ch: SensorChannel; live: boolean }) {
  const blocked = live && ch.latest === 0;
  const beamClr = blocked ? "#ef4444" : "#22c55e";
  return (
    <div className="rounded-2xl border bg-[var(--k-base-100)] p-3 transition-all duration-300"
      style={{ borderColor: !live ? "var(--k-base-400)" : blocked ? "#ef444440" : "#22c55e40",
        boxShadow: !live ? "none" : blocked ? "0 0 16px #ef444418" : "0 0 14px #22c55e18" }}>
      <ChannelHeader label={ch.label} badge="IR Sensor" color="#f97316" live={live} />
      <div className="flex items-center gap-3 my-2">
        <div className="w-9 h-10 rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 flex-shrink-0 transition-all"
          style={{ borderColor: beamClr, background: `${beamClr}15` }}>
          <span className="text-sm leading-none">📡</span>
          <span className="text-[7px] font-bold" style={{ color: beamClr }}>TX</span>
        </div>
        <div className="flex-1 flex items-center">
          {blocked ? (
            <>
              <div className="flex-1 h-0.5 bg-red-500 opacity-30 rounded-full" />
              <div className="w-7 h-7 rounded-full bg-red-500/20 border-2 border-red-500/60 flex items-center justify-center mx-1 flex-shrink-0"
                style={{ animation: "pulse 0.7s ease-in-out infinite" }}>
                <span className="text-base">🚫</span>
              </div>
              <div className="flex-1 h-0.5 bg-red-500 opacity-30 rounded-full" />
            </>
          ) : (
            <div className="flex-1 h-0.5 rounded-full transition-all duration-500"
              style={{ background: beamClr, opacity: live ? 1 : 0.15,
                boxShadow: live ? `0 0 8px ${beamClr}, 0 0 16px ${beamClr}44` : "none" }} />
          )}
        </div>
        <div className="w-9 h-10 rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 flex-shrink-0 transition-all"
          style={{ borderColor: beamClr, background: `${beamClr}15` }}>
          <span className="text-sm leading-none">👁️</span>
          <span className="text-[7px] font-bold" style={{ color: beamClr }}>RX</span>
        </div>
      </div>
      <span className="text-[13px] font-bold block mb-1.5 transition-colors duration-300" style={{ color: beamClr }}>
        {!live ? "🔌 Waiting..." : blocked ? "🚫 Something's There!" : "✅ Path Clear!"}
      </span>
      <DigitalTimeline values={ch.values} color={beamClr} />
    </div>
  );
}

function IRRemoteCard({ ch, live }: { ch: SensorChannel; live: boolean }) {
  const hex    = live ? `0x${ch.latest.toString(16).toUpperCase().padStart(4, "0")}` : "——";
  const recent = [...new Set(ch.values.slice(-10))].slice(0, 6);
  return (
    <div className="rounded-2xl border border-[var(--k-base-400)] bg-[var(--k-base-100)] p-3">
      <ChannelHeader label={ch.label} badge="IR Remote" color="#f97316" live={live} />
      <p className="text-[9px] text-zinc-600 mb-2">📱 Point your remote at the receiver</p>
      <div className="flex items-center justify-center py-3 px-3 mb-2 rounded-xl bg-[var(--k-base-200)] border border-[var(--k-border)]">
        <span className="text-2xl font-mono font-bold tracking-widest"
          style={{ color: live ? "#f97316" : "var(--k-base-400)",
            textShadow: live ? "0 0 20px #f9731655" : "none" }}>{hex}</span>
      </div>
      {recent.length > 0 && (
        <>
          <p className="text-[8px] text-zinc-600 mb-1">Recent buttons:</p>
          <div className="flex flex-wrap gap-1">
            {recent.reverse().map((v, i) => (
              <span key={i} className="text-[9px] font-mono px-2 py-0.5 rounded-lg bg-orange-500/10 border border-orange-500/25 text-orange-400">
                {`0x${v.toString(16).toUpperCase().padStart(4, "0")}`}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DigitalCard({ ch, live }: { ch: SensorChannel; live: boolean }) {
  const on    = live && ch.latest !== 0;
  const emoji = !live ? "❓" : on ? "🟢" : "⚫";
  const label = !live ? "Waiting..." : on ? "It's ON!" : "It's OFF";
  const color = on ? "#22c55e" : "#52525b";
  return (
    <div className="rounded-2xl border bg-[var(--k-base-100)] p-3 transition-all"
      style={{ borderColor: on ? "#22c55e35" : "var(--k-base-400)", boxShadow: on ? "0 0 14px #22c55e15" : "none" }}>
      <ChannelHeader label={ch.label} badge="digital" color="#22c55e" live={live} />
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl transition-all"
          style={{ background: on ? "#22c55e18" : "var(--k-border)", border: `2px solid ${on ? "#22c55e40" : "var(--k-border)"}`,
            boxShadow: on ? "0 0 12px #22c55e22" : "none" }}>
          {emoji}
        </div>
        <span className="text-[15px] font-bold transition-all duration-300" style={{ color }}>{label}</span>
      </div>
      <DigitalTimeline values={ch.values} color="#22c55e" />
    </div>
  );
}

function AngleCard({ ch, live }: { ch: SensorChannel; live: boolean }) {
  const color = "#f97316";
  const angle = Math.max(0, Math.min(180, ch.latest));
  const rad   = (angle * Math.PI) / 180;
  const cx = 50, cy = 50, r = 36;
  const ex = cx + r * Math.cos(Math.PI - rad), ey = cy - r * Math.sin(Math.PI - rad);
  return (
    <div className="rounded-xl border border-[var(--k-base-400)] bg-[var(--k-base-100)] p-2.5">
      <ChannelHeader label={ch.label} badge="angle" color={color} live={live} />
      <div className="flex items-center gap-3">
        <svg width="72" height="48" viewBox="0 0 100 60" className="flex-shrink-0">
          <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none" stroke="var(--k-base-400)" strokeWidth="4" strokeLinecap="round" />
          <path d={`M ${cx} ${cy} L ${cx + r} ${cy} A ${r} ${r} 0 ${angle > 90 ? 1 : 0} 0 ${ex} ${ey} Z`}
            fill={`${color}15`} />
          <line x1={cx} y1={cy} x2={ex} y2={ey} stroke={color} strokeWidth="2.5" strokeLinecap="round"
            style={{ filter: live ? `drop-shadow(0 0 3px ${color})` : "none" }} />
          <circle cx={cx} cy={cy} r="3" fill={color} />
          <text x={cx} y={cy + 14} textAnchor="middle" fill={color} fontSize="11" fontWeight="bold" fontFamily="monospace">
            {angle.toFixed(0)}°
          </text>
        </svg>
        <div className="flex-1">
          <Sparkline data={ch.values} color={color} min={0} max={180} height={36} />
        </div>
      </div>
    </div>
  );
}

function AnalogCard({ ch, live, color }: { ch: SensorChannel; live: boolean; color: string }) {
  const min = Math.min(...ch.values), max = Math.max(...ch.values);
  const avg = ch.values.reduce((a, b) => a + b, 0) / ch.values.length;
  return (
    <div className="rounded-xl border border-[var(--k-base-400)] bg-[var(--k-base-100)] p-2.5">
      <ChannelHeader label={ch.label} badge={ch.type} color={color} live={live} />
      <div className="flex items-start gap-3">
        <ArcGauge value={ch.latest} min={min === max ? min - 1 : min} max={min === max ? max + 1 : max} color={color} />
        <div className="flex-1 min-w-0">
          <Sparkline data={ch.values} color={color} min={min === max ? min - 1 : min} max={min === max ? max + 1 : max} height={36} />
          <div className="flex gap-3 mt-1 text-[9px] font-mono">
            <span className="text-zinc-600">min <span style={{ color }}>{min.toFixed(1)}</span></span>
            <span className="text-zinc-600">avg <span style={{ color }}>{avg.toFixed(1)}</span></span>
            <span className="text-zinc-600">max <span style={{ color }}>{max.toFixed(1)}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SensorVizPanel({ logs, onClose }: { logs: string[]; onClose: () => void }) {
  const [channels, setChannels] = useState<Map<string, SensorChannel>>(new Map());

  useEffect(() => {
    const raw = logs.map(stripLogPrefix).filter((l) => l.startsWith("SENSOR,"));
    if (raw.length === 0) return;
    setChannels((prev) => {
      const updated = new Map(prev);
      for (const line of raw.slice(-20)) {
        const [, type, label, valStr] = line.split(",");
        if (!type || !label || valStr === undefined) continue;
        const val = parseFloat(valStr);
        if (isNaN(val)) continue;
        const existing = updated.get(label);
        updated.set(label, {
          label, type: type.toLowerCase(),
          values: [...(existing?.values ?? []).slice(-(SENSOR_MAX - 1)), val],
          latest: val, ts: Date.now(),
        });
      }
      return updated;
    });
  }, [logs]);

  const chans = Array.from(channels.values());
  const colorOf = (type: string) =>
    type === "digital" ? "#22c55e" : type === "angle" ? "#f97316" : type === "raw" ? "#a855f7" : "#3b82f6";

  return (
    <PanelShell title="Sensor Visualizer" icon={<Gauge className="w-4 h-4" />}
      color="#22c55e" onClose={onClose} initialPos={{ x: 24, y: 420 }} width={360}>
      <div className="p-3 space-y-2 max-h-[500px] overflow-y-auto">
        {chans.length === 0 ? (
          <div className="text-center py-6 space-y-1.5">
            <p className="text-zinc-500 text-[11px] font-medium">No sensor data yet</p>
            <p className="text-zinc-700 text-[10px]">Run code with "Send to Viz" enabled on any sensor node</p>
            <p className="font-mono text-[9px] text-zinc-700 mt-2 leading-relaxed">
              SENSOR,digital,motion,1<br />SENSOR,analog,Temperature,23.5
            </p>
          </div>
        ) : chans.map((ch) => {
          const live  = (Date.now() - ch.ts) < VIZ_STALE;
          const kind  = inferKind(ch.label, ch.type);
          const color = colorOf(ch.type);
          if (kind === "pir")       return <PIRCard       key={ch.label} ch={ch} live={live} />;
          if (kind === "ir-beam")   return <IRBeamCard    key={ch.label} ch={ch} live={live} />;
          if (kind === "ir-remote") return <IRRemoteCard  key={ch.label} ch={ch} live={live} />;
          if (kind === "digital")   return <DigitalCard   key={ch.label} ch={ch} live={live} />;
          if (kind === "angle")     return <AngleCard     key={ch.label} ch={ch} live={live} />;
          return                           <AnalogCard    key={ch.label} ch={ch} live={live} color={color} />;
        })}
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
          <div className="flex-1 px-2.5 py-2 rounded-xl bg-[var(--k-base-100)] border border-[var(--k-base-400)]">
            <div className="text-[9px] text-zinc-600 mb-0.5">Angle</div>
            <div className="text-sm font-mono font-bold text-cyan-400">{latest ? `${latest.angle.toFixed(0)}°` : "—"}</div>
          </div>
          <div className="flex-1 px-2.5 py-2 rounded-xl bg-[var(--k-base-100)] border border-[var(--k-base-400)]">
            <div className="text-[9px] text-zinc-600 mb-0.5">Distance</div>
            <div className="text-sm font-mono font-bold text-cyan-400">{latest ? `${latest.distance.toFixed(0)} cm` : "—"}</div>
          </div>
          <div className="flex-1 px-2.5 py-2 rounded-xl bg-[var(--k-base-100)] border border-[var(--k-base-400)] text-center">
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
