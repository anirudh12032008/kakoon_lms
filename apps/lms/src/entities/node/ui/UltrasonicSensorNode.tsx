import { Handle, Position } from "@xyflow/react";
import {
  BaseNode,
  NodeField,
  TextInput,
  SelectInput,
  useNodeField,
  makeHandleStyle,
  AdvancedSection,
  COLORS,
} from "./BaseNode";
import { SensorIcon, PORT_OPTIONS, PortPinBadge } from "./_shared";
import { useSensorStore } from "@/shared/lib/sensorStore";

const outHS = { ...makeHandleStyle(COLORS.green), top: "50%", transform: "translateY(-50%)" };
const STALE_MS = 3000;

// ─── Echo Timing Pulse Visualiser ─────────────────────────────────────────────
// Animated timing diagram driven by LIVE serial data only. When no live reading
// is present the diagram is frozen/dim and shows "waiting…". When live, TRIG fires
// a pulse, the sound travels to the detected object and bounces back, and the ECHO
// high-time + object position scale with the measured distance.
function EchoPulseDisplay({ live, distanceCm }: { live: boolean; distanceCm: number | null }) {
  const DUR = "2.4s";
  // Map distance (0–200cm) → fraction of the lane the object sits at, and the
  // echo pulse width. Farther object = later/longer echo.
  const frac = distanceCm != null ? Math.max(0.12, Math.min(1, distanceCm / 200)) : 0.6;
  const objLeft = `${8 + frac * 78}%`;       // sensor at 8%, object up to ~86%
  const echoW = Math.round(4 + frac * 36);    // echo bar width 4–40px
  const anim = (name: string, delay = 0) =>
    live ? `${name} ${DUR} ${name === "usWaveRing" || name === "usPing" ? "ease-in-out" : "steps(1)"} ${delay}s infinite` : "none";

  return (
    <div className={`w-full rounded-lg border border-[var(--k-border)] bg-[var(--k-base-100)] overflow-hidden px-2.5 py-2 flex flex-col gap-1.5 transition-opacity ${live ? "" : "opacity-50"}`}>
      {/* Status row */}
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full"
          style={{ background: live ? "#22d3ee" : "var(--k-base-400)", animation: live ? "pulse 2s ease-in-out infinite" : "none" }} />
        <span className="text-[9px] text-[var(--k-muted)] font-mono">{live ? "LIVE" : "waiting…"}</span>
        {live && distanceCm != null && (
          <span className="text-[9px] text-cyan-400 font-mono ml-auto">{distanceCm.toFixed(1)} cm</span>
        )}
      </div>

      {/* Travel lane: sensor → object with a pinging wave */}
      <div className="relative h-6">
        {/* sensor (left) */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-4 rounded-sm bg-purple-500/80" />
        {/* object — positioned by measured distance */}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-1.5 h-5 rounded-sm bg-[var(--k-base-400)] border border-[var(--k-border)] transition-all duration-300"
          style={{ left: live ? objLeft : "86%" }} />
        {/* dashed path */}
        <div className="absolute left-4 right-3 top-1/2 -translate-y-1/2 h-px"
          style={{ backgroundImage: "repeating-linear-gradient(90deg,var(--k-border) 0 4px,transparent 4px 8px)" }} />
        {/* expanding wave rings emitted from sensor */}
        {[0, 0.12].map((delay, i) => (
          <div key={i}
            className="absolute top-1/2 left-4 w-4 h-4 -translate-y-1/2 rounded-full border-2 border-cyan-400"
            style={{ animation: anim("usWaveRing", delay), opacity: live ? undefined : 0 }} />
        ))}
        {/* traveling ping dot */}
        <div className="absolute top-1/2 w-1.5 h-1.5 -translate-y-1/2 -translate-x-1/2 rounded-full bg-cyan-300 shadow-[0_0_6px_2px_rgba(34,211,238,0.6)]"
          style={{ animation: anim("usPing"), opacity: live ? undefined : 0 }} />
      </div>

      {/* TRIG waveform */}
      <div className="flex items-center gap-1.5">
        <span className="text-[8px] text-purple-400 font-mono w-7 flex-shrink-0">TRIG</span>
        <div className="flex-1 flex items-end h-3">
          <div className="h-[2px] w-3 bg-[var(--k-border)]" />
          <div className="w-1 self-stretch rounded-sm bg-purple-500"
            style={{ animation: anim("usTrigPulse"), opacity: live ? undefined : 0.3 }} />
          <div className="h-[2px] flex-1 bg-[var(--k-border)]" />
        </div>
      </div>

      {/* ECHO waveform — high for the round-trip time (width scales with distance) */}
      <div className="flex items-center gap-1.5">
        <span className="text-[8px] text-cyan-400 font-mono w-7 flex-shrink-0">ECHO</span>
        <div className="flex-1 flex items-end h-3">
          <div className="h-[2px] flex-1 bg-[var(--k-border)]" />
          <div className="flex items-end h-full" style={{ animation: anim("usEchoPulse"), opacity: live ? undefined : 0.3 }}>
            <div className="h-[2px] w-px bg-cyan-500" />
            <div className="self-stretch border-t-2 border-l-2 border-r-2 border-cyan-500 rounded-t-sm transition-all duration-300"
              style={{ width: live ? echoW : 24 }} />
          </div>
          <div className="h-[2px] flex-1 bg-[var(--k-border)]" />
        </div>
      </div>
    </div>
  );
}

// ─── Proximity Zone Designer ──────────────────────────────────────────────────
function ZoneRow({ label, color, dist, setDist, nodeColor, onColorChange }: {
  label: string; color: string; dist: number; setDist: (v: number) => void;
  nodeColor: string; onColorChange: (c: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-0.5">
      <div className="w-2 h-2 rounded-full flex-shrink-0 cursor-pointer relative"
        style={{ background: color, border: "1.5px solid var(--k-base-400)" }}>
        <input type="color" value={color} onChange={e => onColorChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer nodrag" />
      </div>
      <span className="text-[9px] font-bold uppercase tracking-wider flex-shrink-0" style={{ color: nodeColor, width: 22 }}>{label}</span>
      <span className="text-[9px] text-[var(--k-dim)] flex-shrink-0">&lt;</span>
      <input type="number" value={dist} onChange={e => setDist(Number(e.target.value))}
        className="nodrag w-11 rounded bg-[var(--k-base-300)] border border-[var(--k-border)] text-[10px] text-center text-[var(--k-text)] font-mono outline-none px-1 py-0.5" />
      <span className="text-[9px] text-[var(--k-dim)]">cm</span>
    </div>
  );
}

// ─── Ultrasonic Sensor ────────────────────────────────────────────────────────
export function UltrasonicSensorNode() {
  const [port, setPort] = useNodeField<string>("port", "1");
  const [varName, setVarName] = useNodeField<string>("varName", "distance");
  const [alertVar, setAlertVar] = useNodeField<string>("alertVar", "in_zone");
  const [nearDist, setNearDist] = useNodeField<number>("nearDist", 10);
  const [midDist, setMidDist] = useNodeField<number>("midDist", 50);
  const [farDist, setFarDist] = useNodeField<number>("farDist", 150);
  const [nearColor, setNearColor] = useNodeField<string>("nearColor", "#ef4444");
  const [midColor, setMidColor] = useNodeField<string>("midColor", "#f97316");
  const [farColor, setFarColor] = useNodeField<string>("farColor", "#22c55e");

  // Live distance piped from the ESP32 serial stream (label == varName).
  const reading = useSensorStore(s => s.readings[varName]);
  const live = !!reading && (Date.now() - reading.ts) < STALE_MS;
  const distanceCm = live && reading.value >= 0 ? reading.value : null;
  const distanceIn = distanceCm != null ? distanceCm / 2.54 : null;

  return (
    <BaseNode title="Ultrasonic Sensor" color={COLORS.purple} icon={<SensorIcon />} width="260px">
      <NodeField label="Sensor Port">
        <SelectInput value={port} onChange={setPort} options={PORT_OPTIONS} compact />
      </NodeField>

      <AdvancedSection>
        <PortPinBadge port={port} mode="ultrasonic" />
        {/* Echo pulse visualiser */}
        <div className="px-3 pt-1 pb-0.5">
          <EchoPulseDisplay live={live} distanceCm={distanceCm} />
        </div>
      </AdvancedSection>

      {/* Distance display */}
      <div className="px-3 py-1 flex items-center gap-2 bg-[var(--k-base-300)] mx-3 rounded-lg border border-[var(--k-border)]">
        <div className="flex-1 text-center">
          <div className="text-[9px] text-[var(--k-muted)] uppercase">cm</div>
          <div className="text-sm font-mono font-bold text-purple-400">{distanceCm != null ? distanceCm.toFixed(1) : "—.-"}</div>
        </div>
        <div className="w-px h-6 bg-[var(--k-border)]" />
        <div className="flex-1 text-center">
          <div className="text-[9px] text-[var(--k-muted)] uppercase">in</div>
          <div className="text-sm font-mono font-bold text-cyan-400">{distanceIn != null ? distanceIn.toFixed(1) : "—.-"}</div>
        </div>
      </div>

      <AdvancedSection>
        {/* Proximity zone designer */}
        <div className="px-3 pt-2 pb-0.5">
          <span className="text-[9px] uppercase tracking-wider text-[var(--k-muted)] font-bold px-0">Proximity Zones</span>
        </div>
        <ZoneRow label="Near" color={nearColor} dist={nearDist} setDist={setNearDist} nodeColor={nearColor} onColorChange={setNearColor} />
        <ZoneRow label="Mid" color={midColor} dist={midDist} setDist={setMidDist} nodeColor={midColor} onColorChange={setMidColor} />
        <ZoneRow label="Far" color={farColor} dist={farDist} setDist={setFarDist} nodeColor={farColor} onColorChange={setFarColor} />
        {/* Zone bar preview */}
        <div className="px-3 pb-1 pt-0.5">
          <div className="flex w-full h-2 rounded-full overflow-hidden gap-px">
            <div className="rounded-l-full" style={{ flex: nearDist, background: nearColor, opacity: 0.8 }} />
            <div style={{ flex: midDist - nearDist, background: midColor, opacity: 0.8 }} />
            <div className="rounded-r-full" style={{ flex: Math.max(1, farDist - midDist), background: farColor, opacity: 0.8 }} />
          </div>
        </div>
      </AdvancedSection>

      {/* Outputs */}
      <NodeField label="distance">
        <TextInput value={varName} onChange={setVarName} green />
        <Handle type="source" position={Position.Right} id="distance" style={{ ...outHS, right: -6 }} />
      </NodeField>
      <NodeField label="alert →">
        <TextInput value={alertVar} onChange={setAlertVar} green />
        <Handle type="source" position={Position.Right} id="alert"
          style={{ ...outHS, right: -6, border: "2.5px solid #f97316" }} />
      </NodeField>
    </BaseNode>
  );
}
