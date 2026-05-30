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

export function IMUVisualizerPanel({ logs, onClose }: { logs: string[]; onClose: () => void }) {
  const [history, setHistory] = useState<IMUData[]>([]);
  const [latest, setLatest] = useState<IMUData | null>(null);

  useEffect(() => {
    const last = [...logs].reverse().find((l) => {
      const raw = stripLogPrefix(l);
      return raw.startsWith("MPU6050,");
    });
    if (!last) return;
    const raw = stripLogPrefix(last);
    const parts = raw.split(",");
    if (parts.length < 9) return;
    const [, ax, ay, az, gx, gy, gz, pitch, roll] = parts.map((v, i) => i === 0 ? 0 : parseFloat(v));
    const entry: IMUData = { ax, ay, az, gx, gy, gz, pitch, roll };
    setLatest(entry);
    setHistory((prev) => [...prev.slice(-(IMU_MAX - 1)), entry]);
  }, [logs]);

  const dir = (() => {
    if (!latest) return { label: "—", pct: 0 };
    const { pitch, roll } = latest;
    if (Math.abs(pitch) < 10 && Math.abs(roll) < 10) return { label: "FLAT", pct: 0 };
    if (Math.abs(pitch) > Math.abs(roll)) {
      return pitch > 0
        ? { label: "FORWARD ▲", pct: Math.min(100, Math.abs(pitch)) }
        : { label: "BACKWARD ▼", pct: Math.min(100, Math.abs(pitch)) };
    }
    return roll > 0
      ? { label: "RIGHT ▶", pct: Math.min(100, Math.abs(roll)) }
      : { label: "LEFT ◀", pct: Math.min(100, Math.abs(roll)) };
  })();

  const accelData = (key: keyof IMUData) => history.map((h) => h[key]);

  return (
    <PanelShell title="IMU Visualizer — MPU6050" icon={<Activity className="w-4 h-4" />}
      color="#8b5cf6" onClose={onClose} initialPos={{ x: 24, y: 80 }} width={360}>
      <div className="p-3 space-y-3">
        {/* Orientation ball */}
        <div className="flex items-center gap-3">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg viewBox="-40 -40 80 80" width="80" height="80">
              <circle cx="0" cy="0" r="36" fill="#111118" stroke="#2a2a32" strokeWidth="1" />
              {/* rings */}
              {[24, 16, 8].map((r) => <circle key={r} cx="0" cy="0" r={r} fill="none" stroke="#2a2a32" strokeWidth="0.5" />)}
              <line x1="-36" y1="0" x2="36" y2="0" stroke="#2a2a32" strokeWidth="0.5" />
              <line x1="0" y1="-36" x2="0" y2="36" stroke="#2a2a32" strokeWidth="0.5" />
              {/* pitch/roll dot */}
              {latest && (
                <circle
                  cx={Math.max(-30, Math.min(30, latest.roll * 0.4))}
                  cy={Math.max(-30, Math.min(30, -latest.pitch * 0.4))}
                  r="5" fill="#8b5cf6" opacity="0.9"
                  style={{ filter: "drop-shadow(0 0 4px #8b5cf6)" }}
                />
              )}
            </svg>
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-[9px] text-zinc-500">
              <span>Pitch</span><span className="text-violet-400 font-mono">{latest ? latest.pitch.toFixed(1) : "—"}°</span>
            </div>
            <div className="flex justify-between text-[9px] text-zinc-500">
              <span>Roll</span><span className="text-fuchsia-400 font-mono">{latest ? latest.roll.toFixed(1) : "—"}°</span>
            </div>
            <div className="mt-1 px-2 py-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-center">
              <span className="text-[10px] font-bold text-violet-300">{dir.label}</span>
              {dir.pct > 0 && <span className="text-[9px] text-zinc-500 ml-1">{dir.pct.toFixed(0)}%</span>}
            </div>
          </div>
        </div>

        {/* Accel chart */}
        <div className="rounded-xl border border-[#1e1e26] bg-[#0c0c10] p-2.5">
          <div className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold mb-1.5">Accelerometer (g)</div>
          {(["ax","ay","az"] as const).map((k, i) => {
            const colors = ["#ef4444","#22c55e","#3b82f6"];
            const vals = accelData(k);
            return (
              <div key={k} className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-mono w-5" style={{ color: colors[i] }}>{k.toUpperCase()}</span>
                <div className="flex-1"><Sparkline data={vals} color={colors[i]} min={-4} max={4} height={24} /></div>
                <span className="text-[9px] font-mono w-10 text-right" style={{ color: colors[i] }}>
                  {latest ? latest[k].toFixed(2) : "—"}
                </span>
              </div>
            );
          })}
        </div>

        {/* Gyro chart */}
        <div className="rounded-xl border border-[#1e1e26] bg-[#0c0c10] p-2.5">
          <div className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold mb-1.5">Gyroscope (°/s)</div>
          {(["gx","gy","gz"] as const).map((k, i) => {
            const colors = ["#f97316","#eab308","#a855f7"];
            const vals = accelData(k);
            return (
              <div key={k} className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-mono w-5" style={{ color: colors[i] }}>{k.toUpperCase()}</span>
                <div className="flex-1"><Sparkline data={vals} color={colors[i]} min={-500} max={500} height={24} /></div>
                <span className="text-[9px] font-mono w-10 text-right" style={{ color: colors[i] }}>
                  {latest ? latest[k].toFixed(1) : "—"}
                </span>
              </div>
            );
          })}
        </div>

        {history.length === 0 && (
          <div className="text-center py-2 text-[10px] text-zinc-600">
            Run code that outputs: <code className="text-violet-400">MPU6050,ax,ay,az,gx,gy,gz,pitch,roll</code>
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
