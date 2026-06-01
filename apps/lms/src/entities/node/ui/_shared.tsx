// ─── Shared helpers used by 2+ node files ────────────────────────────────────
import { useRef, useEffect } from "react";
import { COLORS } from "./BaseNode";
import { SENSOR_PORTS } from "@/entities/board";

// ─── Re-alias board constants ─────────────────────────────────────────────────
const SENSOR_PORT_PINS = SENSOR_PORTS;

// ─── Shared Icon Components ───────────────────────────────────────────────────

export function ChipIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
      <rect x="9" y="9" width="6" height="6"/>
      <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
      <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
      <line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/>
      <line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
    </svg>
  );
}

export function SensorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
      <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
      <line x1="12" y1="20" x2="12.01" y2="20"/>
    </svg>
  );
}

export function DisplayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  );
}

export function MotorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  );
}

// ─── PORT_OPTIONS (sensor-port style, used by SensorNodes) ───────────────────
export const PORT_OPTIONS = [
  { label: "Sensor Port 1 (GPIO 4 / 5)", value: "1" },
  { label: "Sensor Port 2 (GPIO 1 / 2)", value: "2" },
];

// ─── ROTATE_OPTIONS ───────────────────────────────────────────────────────────
export const ROTATE_OPTIONS = [
  { value: "0",   label: "0°"   },
  { value: "90",  label: "90°"  },
  { value: "180", label: "180°" },
  { value: "270", label: "270°" },
];

// ─── PortPinBadge — used by Ultrasonic, Touch, SoilMoisture, ButtonDigitalInput ─
export function PortPinBadge({ port, mode }: { port: string; mode: "i2c" | "ultrasonic" }) {
  const p = SENSOR_PORT_PINS[port as keyof typeof SENSOR_PORT_PINS] ?? SENSOR_PORT_PINS["1"];
  return (
    <div className="mx-3 mb-1 px-2.5 py-1.5 rounded-lg border border-[#2d2d35] bg-[#111116]">
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Fixed GPIO — Port {port}</span>
        <span className="text-[9px] font-mono text-purple-400">locked</span>
      </div>
      <div className="flex gap-3 mt-0.5">
        {mode === "i2c" ? (
          <>
            <span className="text-[10px] text-zinc-500">SCL <span className="text-zinc-300 font-mono">{p.scl}</span></span>
            <span className="text-[10px] text-zinc-500">SDA <span className="text-zinc-300 font-mono">{p.sda}</span></span>
          </>
        ) : (
          <>
            <span className="text-[10px] text-zinc-500">TRIG <span className="text-zinc-300 font-mono">{p.trig}</span></span>
            <span className="text-[10px] text-zinc-500">ECHO <span className="text-zinc-300 font-mono">{p.echo}</span></span>
          </>
        )}
      </div>
    </div>
  );
}

// ─── AngleDial — used by ServoMotorNode, ServoMotorAdvanceNode, ServoControllerNode ─
export function AngleDial({ angle, onChange, min = 0, max = 180, color = COLORS.orange }: {
  angle: number; onChange: (v: number) => void; min?: number; max?: number; color?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef(false);

  const CX = 44, CY = 44, R = 34;
  const START_DEG = 225, TOTAL_DEG = 270;
  const pct = (angle - min) / (max - min);
  const angleDeg = START_DEG + pct * TOTAL_DEG;
  const rad = (angleDeg * Math.PI) / 180;
  const knobX = CX + R * Math.cos(rad), knobY = CY + R * Math.sin(rad);

  const polarToValue = (clientX: number, clientY: number) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = clientX - rect.left - CX, y = clientY - rect.top - CY;
    let deg = (Math.atan2(y, x) * 180) / Math.PI;
    if (deg < 0) deg += 360;
    let rel = deg - START_DEG;
    if (rel < 0) rel += 360;
    if (rel > TOTAL_DEG) rel = rel > TOTAL_DEG + (360 - TOTAL_DEG) / 2 ? 0 : TOTAL_DEG;
    const v = Math.round(min + (rel / TOTAL_DEG) * (max - min));
    onChange(Math.max(min, Math.min(max, v)));
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (dragging.current) polarToValue(e.clientX, e.clientY); };
    const onUp   = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup",   onUp);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max]);

  const arcPath = (fromPct: number, toPct: number, c: string, w = 4) => {
    const a1 = ((START_DEG + fromPct * TOTAL_DEG) * Math.PI) / 180;
    const a2 = ((START_DEG + toPct * TOTAL_DEG) * Math.PI) / 180;
    const x1 = CX + R * Math.cos(a1), y1 = CY + R * Math.sin(a1);
    const x2 = CX + R * Math.cos(a2), y2 = CY + R * Math.sin(a2);
    const largeArc = (toPct - fromPct) * TOTAL_DEG > 180 ? 1 : 0;
    return <path d={`M${x1},${y1} A${R},${R},0,${largeArc},1,${x2},${y2}`} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" />;
  };

  return (
    <div className="nodrag flex flex-col items-center gap-1 py-1">
      <svg ref={svgRef} width={88} height={88} style={{ cursor: "crosshair", userSelect: "none", touchAction: "none" }}
        onMouseDown={e => { e.stopPropagation(); e.preventDefault(); dragging.current = true; polarToValue(e.clientX, e.clientY); }}
      >
        {arcPath(0, 1, "#2d2d35", 5)}
        {arcPath(0, pct, color, 5)}
        <circle cx={knobX} cy={knobY} r={6} fill={color} />
        <circle cx={knobX} cy={knobY} r={3} fill="#0f0f12" />
        <text x={CX} y={CY - 4} textAnchor="middle" fill="white" fontSize={14} fontWeight="bold" fontFamily="monospace">{angle}</text>
        <text x={CX} y={CY + 9} textAnchor="middle" fill="#6b7280" fontSize={8}>degrees</text>
      </svg>
      <div className="flex justify-between w-[88px] px-1">
        <span className="text-[8px] text-zinc-600">{min}°</span>
        <span className="text-[8px] text-zinc-600">{max}°</span>
      </div>
    </div>
  );
}
