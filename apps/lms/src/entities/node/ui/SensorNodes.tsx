import { Handle, Position } from "@xyflow/react";
import {
  BaseNode,
  NodeField,
  TextInput,
  NumberInput,
  SelectInput,
  ToggleInput,
  useNodeField,
  makeHandleStyle,
  COLORS,
} from "./BaseNode";
import { useSensorStore } from "@/shared/lib/sensorStore";
import { ONBOARD_IMU, SENSOR_PORTS, PIR_SENSOR, IR_SENSOR } from "@/entities/board";

function SensorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M1.42 9a16 16 0 0 1 21.16 0"/>
      <path d="M5 12.55a11 11 0 0 1 14.08 0"/>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
      <line x1="12" y1="20" x2="12.01" y2="20"/>
    </svg>
  );
}

const outHS = { ...makeHandleStyle(COLORS.green), top: "50%", transform: "translateY(-50%)" };

// Re-alias board constants to the names used throughout this file
const ONBOARD_IMU_PINS = ONBOARD_IMU;
const SENSOR_PORT_PINS = SENSOR_PORTS;

const PORT_OPTIONS = [
  { label: "Sensor Port 1 (GPIO 4 / 5)", value: "1" },
  { label: "Sensor Port 2 (GPIO 1 / 2)", value: "2" },
];

function PortPinBadge({ port, mode }: { port: string; mode: "i2c" | "ultrasonic" }) {
  const p = SENSOR_PORT_PINS[port] ?? SENSOR_PORT_PINS["1"];
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

// ─── Scrolling Waveform ───────────────────────────────────────────────────────
function WaveformDisplay({ color = "#8b5cf6" }: { color?: string }) {
  const pts =
    "0,20 8,15 14,8 20,14 28,30 34,34 42,28 50,20 58,13 65,7 72,13 80,26 88,32 96,26 104,20 112,15 118,8 124,14 132,30 138,34 146,28 154,20 162,13 169,7 176,13 184,26 192,32 200,26 208,20 216,15 222,8";
  return (
    <div className="w-full h-10 rounded-lg border border-[#2d2d35] bg-[#0a0a0d] overflow-hidden relative">
      <svg className="absolute inset-0 w-[200%] h-full" viewBox="0 0 440 40" preserveAspectRatio="none">
        <polyline points={pts + " " + pts.split(" ").map(p => {
          const [x, y] = p.split(",");
          return `${Number(x) + 222},${y}`;
        }).join(" ")}
          fill="none" stroke={color} strokeWidth="1.5" opacity="0.85"
          style={{ animation: "scrollWave 2.4s linear infinite" }}
        />
      </svg>
      <div className="absolute top-1 right-1.5 flex items-center gap-1">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-[9px] text-zinc-500 font-mono">LIVE</span>
      </div>
    </div>
  );
}

// ─── Value Gauge Bar ──────────────────────────────────────────────────────────
function GaugeBar({ pct = 0, color = "#8b5cf6" }: { pct?: number; color?: string }) {
  return (
    <div className="w-full h-1.5 bg-[#1c1c20] rounded-full border border-[#2d2d35] overflow-hidden">
      <div className="h-full rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, pct)}%`, background: color }} />
    </div>
  );
}

// ─── Stat Chip ────────────────────────────────────────────────────────────────
function StatChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col items-center flex-1 bg-[#111116] rounded-md py-1 border border-[#2a2a30]">
      <span className="text-[8px] uppercase tracking-wider font-bold" style={{ color }}>{label}</span>
      <span className="text-[11px] font-mono text-white mt-0.5">{value}</span>
    </div>
  );
}

// ─── Analog Sensor ────────────────────────────────────────────────────────────
export function AnalogSensorNode() {
  const [pin, setPin] = useNodeField<number>("pin", 34);
  const [varName, setVarName] = useNodeField<string>("varName", "analog_val");
  const [sampleRate, setSampleRate] = useNodeField<number>("sampleRate", 100);
  const [threshold, setThreshold] = useNodeField<number>("threshold", 2048);
  const [threshVar, setThreshVar] = useNodeField<string>("threshVar", "thresh_hit");

  return (
    <BaseNode title="Analog Sensor" color={COLORS.purple} icon={<SensorIcon />} width="260px">
      <NodeField label="ADC Pin"><NumberInput value={pin} onChange={setPin} /></NodeField>
      <NodeField label="Sample (ms)"><NumberInput value={sampleRate} onChange={setSampleRate} /></NodeField>

      {/* Live scrolling waveform */}
      <div className="px-3 pt-1 pb-0.5">
        <WaveformDisplay color={COLORS.purple} />
      </div>

      {/* Gauge */}
      <div className="px-3 pt-1 pb-0.5">
        <GaugeBar pct={50} color={COLORS.purple} />
        <div className="flex justify-between mt-0.5">
          <span className="text-[9px] text-zinc-600 font-mono">0 raw</span>
          <span className="text-[9px] text-zinc-600 font-mono">4095 / 3.3V</span>
        </div>
      </div>

      {/* Min / Max / Avg */}
      <div className="px-3 py-1 flex gap-1.5">
        <StatChip label="Min" value="—" color="#60a5fa" />
        <StatChip label="Max" value="—" color="#f87171" />
        <StatChip label="Avg" value="—" color="#34d399" />
      </div>

      {/* Threshold */}
      <NodeField label="Threshold"><NumberInput value={threshold} onChange={setThreshold} /></NodeField>

      {/* Value output */}
      <NodeField label="value">
        <TextInput value={varName} onChange={setVarName} green />
        <Handle type="source" position={Position.Right} id="value" style={{ ...outHS, right: -6 }} />
      </NodeField>

      {/* Threshold trigger output */}
      <NodeField label="thresh →">
        <TextInput value={threshVar} onChange={setThreshVar} green />
        <Handle type="source" position={Position.Right} id="threshold"
          style={{ ...outHS, right: -6, border: "2.5px solid #f97316" }} />
      </NodeField>
    </BaseNode>
  );
}

// ─── Echo Timing Pulse Visualiser ─────────────────────────────────────────────
function EchoPulseDisplay() {
  return (
    <div className="w-full h-10 rounded-lg border border-[#2d2d35] bg-[#0a0a0d] overflow-hidden px-3 flex flex-col justify-center gap-0.5">
      <div className="flex items-center gap-1">
        <span className="text-[8px] text-purple-400 font-mono w-7">TRIG</span>
        <div className="flex-1 flex items-center h-3">
          <div className="h-[2px] flex-1 bg-[#2d2d35]" />
          <div className="h-3 w-4 border-t-2 border-l-2 border-r-2 border-purple-500 rounded-t-sm mx-0.5"
            style={{ animation: "trigPulse 1.6s ease-in-out infinite" }} />
          <div className="h-[2px] flex-1 bg-[#2d2d35]" />
        </div>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[8px] text-cyan-400 font-mono w-7">ECHO</span>
        <div className="flex-1 flex items-center h-3">
          <div className="h-[2px] w-5 bg-[#2d2d35]" />
          <div className="h-3 border-t-2 border-l-2 border-r-2 border-cyan-500 rounded-t-sm mx-0.5"
            style={{ width: 24, animation: "trigPulse 1.6s ease-in-out 0.3s infinite" }} />
          <div className="h-[2px] flex-1 bg-[#2d2d35]" />
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
        style={{ background: color, border: "1.5px solid #3f3f46" }}>
        <input type="color" value={color} onChange={e => onColorChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer nodrag" />
      </div>
      <span className="text-[9px] font-bold uppercase tracking-wider flex-shrink-0" style={{ color: nodeColor, width: 22 }}>{label}</span>
      <span className="text-[9px] text-zinc-600 flex-shrink-0">&lt;</span>
      <input type="number" value={dist} onChange={e => setDist(Number(e.target.value))}
        className="nodrag w-11 rounded bg-[#1c1c20] border border-[#2d2d35] text-[10px] text-center text-zinc-300 font-mono outline-none px-1 py-0.5" />
      <span className="text-[9px] text-zinc-600">cm</span>
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

  return (
    <BaseNode title="Ultrasonic Sensor" color={COLORS.purple} icon={<SensorIcon />} width="260px">
      <NodeField label="Sensor Port">
        <SelectInput value={port} onChange={setPort} options={PORT_OPTIONS} compact />
      </NodeField>
      <PortPinBadge port={port} mode="ultrasonic" />

      {/* Echo pulse visualiser */}
      <div className="px-3 pt-1 pb-0.5">
        <EchoPulseDisplay />
      </div>

      {/* Distance display */}
      <div className="px-3 py-1 flex items-center gap-2 bg-[#0d0d10] mx-3 rounded-lg border border-[#2a2a30]">
        <div className="flex-1 text-center">
          <div className="text-[9px] text-zinc-500 uppercase">cm</div>
          <div className="text-sm font-mono font-bold text-purple-400">—.-</div>
        </div>
        <div className="w-px h-6 bg-[#2d2d35]" />
        <div className="flex-1 text-center">
          <div className="text-[9px] text-zinc-500 uppercase">in</div>
          <div className="text-sm font-mono font-bold text-cyan-400">—.-</div>
        </div>
      </div>

      {/* Proximity zone designer */}
      <div className="px-3 pt-2 pb-0.5">
        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold px-0">Proximity Zones</span>
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

// ─── Touch Sensor ─────────────────────────────────────────────────────────────
export function TouchSensorNode() {
  const [port, setPort] = useNodeField<string>("port", "1");
  const [varName, setVarName] = useNodeField<string>("varName", "touch_value");
  return (
    <BaseNode title="Touch Sensor" color={COLORS.red} icon={<SensorIcon />} width="240px">
      <NodeField label="Sensor Port">
        <SelectInput value={port} onChange={setPort} options={PORT_OPTIONS} compact />
      </NodeField>
      <PortPinBadge port={port} mode="i2c" />
      <NodeField label="Touch Value">
        <TextInput value={varName} onChange={setVarName} green />
        <Handle type="source" position={Position.Right} id="touch" style={{ ...outHS, right: -6 }} />
      </NodeField>
    </BaseNode>
  );
}

// ─── Soil Moisture Sensor ─────────────────────────────────────────────────────
export function SoilMoistureSensorNode() {
  const [port, setPort] = useNodeField<string>("port", "1");
  const [varName, setVarName] = useNodeField<string>("varName", "value");
  return (
    <BaseNode title="Soil Moisture Sensor" color={COLORS.orange} icon={<SensorIcon />} width="240px">
      <NodeField label="Sensor Port">
        <SelectInput value={port} onChange={setPort} options={PORT_OPTIONS} compact />
      </NodeField>
      <PortPinBadge port={port} mode="i2c" />
      <NodeField label="Value">
        <TextInput value={varName} onChange={setVarName} green />
        <Handle type="source" position={Position.Right} id="value" style={{ ...outHS, right: -6 }} />
      </NodeField>
    </BaseNode>
  );
}

// ─── IR shared helpers ────────────────────────────────────────────────────────
const IR_STALE_MS = 3000;

// ─── IR Sensor — obstacle detection (digital beam) ───────────────────────────

function IRBeamDisplay({ blocked, live }: { blocked: boolean; live: boolean }) {
  const beamColor  = blocked ? "#ef4444" : "#22c55e";
  const stateLabel = !live ? "🔌 Waiting..." : blocked ? "🚫 Blocked!" : "✅ All Clear!";
  const stateColor = !live ? "#52525b"       : blocked ? "#ef4444"   : "#22c55e";

  return (
    <div
      className="mx-3 mb-1 px-3 py-2.5 rounded-xl border bg-[#0a0a0d] transition-all duration-300"
      style={{
        borderColor: !live ? "#2d2d35" : blocked ? "#ef444440" : "#22c55e40",
        boxShadow:   !live ? "none"    : blocked ? "0 0 12px #ef444420" : "0 0 10px #22c55e18",
      }}
    >
      {/* Beam diagram */}
      <div className="flex items-center gap-3 mb-3">
        {/* TX emitter */}
        <div className="w-8 h-9 rounded-lg border-2 flex flex-col items-center justify-center gap-0.5 flex-shrink-0 transition-all duration-300"
          style={{ borderColor: beamColor, background: `${beamColor}15` }}>
          <span className="text-[8px] font-bold leading-none" style={{ color: beamColor }}>📡</span>
          <span className="text-[7px] font-bold" style={{ color: beamColor }}>TX</span>
        </div>

        {/* Beam */}
        <div className="flex-1 relative h-3 flex items-center">
          {blocked ? (
            <>
              <div className="flex-1 h-0.5 bg-red-500 opacity-30 rounded-full" />
              <div className="w-6 h-6 flex items-center justify-center rounded-full bg-red-500/20 border-2 border-red-500/60 flex-shrink-0 mx-1"
                style={{ animation: "pulse 0.7s ease-in-out infinite" }}>
                <span className="text-[10px]">🚫</span>
              </div>
              <div className="flex-1 h-0.5 bg-red-500 opacity-30 rounded-full" />
            </>
          ) : (
            <div className="flex-1 h-0.5 rounded-full transition-all duration-500"
              style={{ background: beamColor, opacity: live ? 1 : 0.15,
                boxShadow: live ? `0 0 6px ${beamColor}, 0 0 12px ${beamColor}55` : "none" }} />
          )}
        </div>

        {/* RX receiver */}
        <div className="w-8 h-9 rounded-lg border-2 flex flex-col items-center justify-center gap-0.5 flex-shrink-0 transition-all duration-300"
          style={{ borderColor: beamColor, background: `${beamColor}15` }}>
          <span className="text-[8px] font-bold leading-none" style={{ color: beamColor }}>👁️</span>
          <span className="text-[7px] font-bold" style={{ color: beamColor }}>RX</span>
        </div>
      </div>

      {/* Status row */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold transition-all duration-300" style={{ color: stateColor }}>
          {stateLabel}
        </span>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full"
            style={{ background: live ? beamColor : "#3f3f46",
              animation: live ? "pulse 2s ease-in-out infinite" : "none" }} />
          <span className="text-[8px] text-zinc-600">{live ? "Live" : "Connect to see data"}</span>
        </div>
      </div>
    </div>
  );
}

export function IRSensorNode() {
  const [pin, setPin]             = useNodeField<number>("pin", IR_SENSOR.pin);
  const [varName, setVarName]     = useNodeField<string>("varName", "ir_value");
  const [invert, setInvert]       = useNodeField<boolean>("invert", false);
  const [sendToViz, setSendToViz] = useNodeField<boolean>("sendToViz", true);

  const reading = useSensorStore(s => s.readings[varName]);
  const live    = !!reading && (Date.now() - reading.ts) < IR_STALE_MS;
  // IR obstacle sensors: 0 = blocked by default; invert flips this
  const blocked = live && (invert ? reading.value === 1 : reading.value === 0);

  return (
    <BaseNode title="IR Sensor" color={COLORS.orange} icon={<SensorIcon />} width="250px">
      <NodeField label="GPIO Pin"><NumberInput value={pin} onChange={setPin} /></NodeField>
      <NodeField label="Invert">
        <ToggleInput value={invert} onChange={setInvert} leftLabel="LOW=blocked" rightLabel="HIGH=blocked" />
      </NodeField>

      <IRBeamDisplay blocked={blocked} live={live} />

      <NodeField label="Send to Viz">
        <ToggleInput value={sendToViz} onChange={setSendToViz} leftLabel="Off" rightLabel="On" />
      </NodeField>
      <NodeField label="IR Value">
        <TextInput value={varName} onChange={setVarName} green />
        <Handle type="source" position={Position.Right} id="ir" style={{ ...outHS, right: -6 }} />
      </NodeField>
    </BaseNode>
  );
}

// ─── IR Receiver — remote control codes ───────────────────────────────────────

function IRCodeDisplay({ code, live }: { code: number | null; live: boolean }) {
  const hex = code !== null ? `0x${code.toString(16).toUpperCase().padStart(4, "0")}` : "——";
  return (
    <div className="mx-3 mb-1 px-3 py-2 rounded-lg border border-[#2d2d35] bg-[#0a0a0d]">
      {/* Code display */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[8px] uppercase tracking-wider text-zinc-600 font-bold">Last Code</span>
        <div className="flex items-center gap-1">
          <span className="w-1 h-1 rounded-full"
            style={{ background: live ? "#f97316" : "#3f3f46", animation: live ? "pulse 2s ease-in-out infinite" : "none" }} />
          <span className="text-[8px] text-zinc-600 font-mono">{live ? "LIVE" : "no signal"}</span>
        </div>
      </div>

      <div className="flex items-center justify-center py-1 px-3 rounded-md bg-[#111116] border border-[#2a2a30]">
        <span className="text-base font-mono font-bold tracking-widest"
          style={{ color: live ? "#f97316" : "#3f3f46" }}>
          {hex}
        </span>
      </div>

      <p className="text-[8px] text-zinc-600 mt-1.5 text-center">📱 Point your remote at the receiver!</p>
    </div>
  );
}

export function IRReceiverNode() {
  const [pin, setPin]             = useNodeField<number>("pin", IR_SENSOR.pin);
  const [varName, setVarName]     = useNodeField<string>("varName", "ir_cmd");
  const [sendToViz, setSendToViz] = useNodeField<boolean>("sendToViz", true);

  const reading = useSensorStore(s => s.readings[varName]);
  const live    = !!reading && (Date.now() - reading.ts) < IR_STALE_MS;
  const code    = live ? reading.value : null;

  return (
    <BaseNode title="IR Receiver" color={COLORS.orange} icon={<SensorIcon />} width="250px">
      <NodeField label="GPIO Pin"><NumberInput value={pin} onChange={setPin} /></NodeField>

      <IRCodeDisplay code={code} live={live} />

      <NodeField label="Send to Viz">
        <ToggleInput value={sendToViz} onChange={setSendToViz} leftLabel="Off" rightLabel="On" />
      </NodeField>
      <NodeField label="Button Code">
        <TextInput value={varName} onChange={setVarName} green />
        <Handle type="source" position={Position.Right} id="cmd" style={{ ...outHS, right: -6 }} />
      </NodeField>
    </BaseNode>
  );
}

// ─── Button / Digital Input ───────────────────────────────────────────────────
export function ButtonDigitalInputNode() {
  const [port, setPort] = useNodeField<string>("port", "1");
  const [pin, setPin] = useNodeField<number>("pin", 0);
  const [pullup, setPullup] = useNodeField<boolean>("pullup", true);
  const [debounce, setDebounce] = useNodeField<number>("debounce", 50);
  const [holdDuration, setHoldDuration] = useNodeField<number>("holdDuration", 500);
  const [pressVar, setPressVar] = useNodeField<string>("pressVar", "btn_press");
  const [holdVar, setHoldVar] = useNodeField<string>("holdVar", "btn_hold");
  const [releaseVar, setReleaseVar] = useNodeField<string>("releaseVar", "btn_release");

  const pressHS = { ...outHS, border: "2.5px solid #22c55e" };
  const holdHS = { ...outHS, border: "2.5px solid #f59e0b" };
  const releaseHS = { ...outHS, border: "2.5px solid #3b82f6" };

  return (
    <BaseNode title="Button / Digital Input" color={COLORS.blue} icon={<SensorIcon />} width="260px">
      <NodeField label="Port"><SelectInput value={port} onChange={setPort} options={PORT_OPTIONS} compact /></NodeField>
      <NodeField label="Pin"><NumberInput value={pin} onChange={setPin} /></NodeField>
      <NodeField label="Pull-up"><ToggleInput value={pullup} onChange={setPullup} leftLabel="↓ Down" rightLabel="↑ Up" /></NodeField>

      {/* Debounce slider */}
      <div className="px-3 py-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[#9ca3af] font-medium">Debounce</span>
          <span className="text-[10px] font-mono text-blue-400">{debounce} ms</span>
        </div>
        <input type="range" min={0} max={200} step={5} value={debounce}
          onChange={e => setDebounce(Number(e.target.value))}
          className="nodrag w-full h-1 accent-blue-500 cursor-pointer"
          style={{ accentColor: COLORS.blue }}
        />
        <div className="flex justify-between mt-0.5">
          <span className="text-[8px] text-zinc-600">0 ms</span>
          <span className="text-[8px] text-zinc-600">200 ms</span>
        </div>
      </div>

      <NodeField label="Hold (ms)"><NumberInput value={holdDuration} onChange={setHoldDuration} /></NodeField>

      {/* Three output events */}
      <div className="px-3 pt-1 pb-0.5">
        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Output Events</span>
      </div>
      <NodeField label="Press">
        <TextInput value={pressVar} onChange={setPressVar} green />
        <Handle type="source" position={Position.Right} id="press" style={{ ...pressHS, right: -6 }} />
      </NodeField>
      <NodeField label="Hold">
        <TextInput value={holdVar} onChange={setHoldVar} green />
        <Handle type="source" position={Position.Right} id="hold"
          style={{ ...holdHS, right: -6, border: "2.5px solid #f59e0b" }} />
      </NodeField>
      <NodeField label="Release">
        <TextInput value={releaseVar} onChange={setReleaseVar} green />
        <Handle type="source" position={Position.Right} id="release"
          style={{ ...releaseHS, right: -6, border: "2.5px solid #3b82f6" }} />
      </NodeField>
    </BaseNode>
  );
}

// ─── 4-Channel Touch Sensor ───────────────────────────────────────────────────
export function FourChannelTouchNode() {
  const [port, setPort] = useNodeField<string>("port", "1");
  const [pin1, setPin1] = useNodeField<number>("pin1", 4);
  const [pin2, setPin2] = useNodeField<number>("pin2", 5);
  const [pin3, setPin3] = useNodeField<number>("pin3", 6);
  const [pin4, setPin4] = useNodeField<number>("pin4", 7);
  const [t1, setT1] = useNodeField<string>("t1", "touch1");
  const [t2, setT2] = useNodeField<string>("t2", "touch2");
  const [t3, setT3] = useNodeField<string>("t3", "touch3");
  const [t4, setT4] = useNodeField<string>("t4", "touch4");

  const outputs = [
    { label: "touch1", val: t1, set: setT1, id: "t1" },
    { label: "touch2", val: t2, set: setT2, id: "t2" },
    { label: "touch3", val: t3, set: setT3, id: "t3" },
    { label: "touch4", val: t4, set: setT4, id: "t4" },
  ];

  return (
    <BaseNode title="4-Channel Touch Sensor" color={COLORS.cyan} icon={<SensorIcon />} width="260px">
      <NodeField label="Port"><SelectInput value={port} onChange={setPort} options={PORT_OPTIONS} compact /></NodeField>
      <NodeField label="Touch Pin 1"><NumberInput value={pin1} onChange={setPin1} /></NodeField>
      <NodeField label="Touch Pin 2"><NumberInput value={pin2} onChange={setPin2} /></NodeField>
      <NodeField label="Touch Pin 3"><NumberInput value={pin3} onChange={setPin3} /></NodeField>
      <NodeField label="Touch Pin 4"><NumberInput value={pin4} onChange={setPin4} /></NodeField>
      {outputs.map((row) => (
        <NodeField key={row.id} label={row.label}>
          <TextInput value={row.val} onChange={row.set} green />
          <Handle type="source" position={Position.Right} id={row.id} style={{ ...outHS, right: -6 }} />
        </NodeField>
      ))}
    </BaseNode>
  );
}

// ─── Onboard IMU — SCL=42, SDA=41 ────────────────────────────────────────────
export function IMUSensorNode() {
  const [varName, setVarName] = useNodeField<string>("varName", "imu");
  const [outputMode, setOutputMode] = useNodeField<string>("outputMode", "print");
  const [loopDelay, setLoopDelay]   = useNodeField<number>("loopDelay", 100);

  return (
    <BaseNode title="Onboard IMU" color={COLORS.purple} icon={<SensorIcon />} width="260px">
      {/* Fixed I2C pin info */}
      <div className="mx-3 mb-2 px-2.5 py-1.5 rounded-lg border border-[#2d2d35] bg-[#111116]">
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Onboard SoftI2C — fixed GPIO</span>
          <span className="text-[9px] font-mono text-purple-400">locked</span>
        </div>
        <div className="flex gap-4 mt-0.5">
          <span className="text-[10px] text-zinc-500">SCL <span className="text-zinc-300 font-mono">{ONBOARD_IMU_PINS.scl}</span></span>
          <span className="text-[10px] text-zinc-500">SDA <span className="text-zinc-300 font-mono">{ONBOARD_IMU_PINS.sda}</span></span>
          <span className="text-[10px] text-zinc-500">Addr <span className="text-zinc-300 font-mono">{ONBOARD_IMU_PINS.address}</span></span>
        </div>
      </div>

      <NodeField label="Variable Name">
        <TextInput value={varName} onChange={setVarName} />
      </NodeField>

      <NodeField label="Output Mode">
        <SelectInput value={outputMode} onChange={setOutputMode} compact options={[
          { label: "Print (for IMU Visualizer)", value: "print" },
          { label: "Store in variables",         value: "store"  },
          { label: "Both",                       value: "both"   },
        ]} />
      </NodeField>

      <NodeField label="Loop Delay (ms)">
        <NumberInput value={loopDelay} onChange={setLoopDelay} />
      </NodeField>

      {/* Format hint */}
      <div className="mx-3 mb-2 px-2 py-1.5 rounded-lg border border-purple-500/20 bg-purple-500/5">
        <p className="text-[9px] text-purple-400/80 font-mono">
          IMU,ax,ay,az,gx,gy,gz,pitch,roll
        </p>
        <p className="text-[8px] text-zinc-600 mt-0.5">→ open IMU Visualizer to see live onboard data</p>
      </div>
    </BaseNode>
  );
}

// ─── PIR Motion Sensor ────────────────────────────────────────────────────────

const STALE_MS = 3000; // reading older than this → treat as no signal

function PIRRadarDisplay({ detected, live }: { detected: boolean; live: boolean }) {
  const sweepColor  = detected ? "#22c55e" : "#3b82f6";
  const statusColor = detected ? "#22c55e" : "#52525b";
  const glowColor   = detected ? "#22c55e44" : "transparent";

  return (
    <div
      className="mx-3 mb-1 flex items-center gap-3 px-2.5 py-2 rounded-lg border bg-[#0a0a0d] transition-all duration-300"
      style={{
        borderColor: detected ? "#22c55e40" : "#2d2d35",
        boxShadow:   detected ? `0 0 12px ${glowColor}` : "none",
      }}
    >
      {/* Radar arc SVG */}
      <svg width="56" height="44" viewBox="0 0 56 44" style={{ flexShrink: 0 }}>
        {/* Arcs — brighten when detected */}
        {[18, 26, 34].map((r, i) => (
          <path
            key={r}
            d={`M ${28 - r} 38 A ${r} ${r} 0 0 1 ${28 + r} 38`}
            fill="none"
            stroke={sweepColor}
            strokeWidth="1"
            opacity={detected ? 0.25 + i * 0.2 : 0.1 + i * 0.06}
            style={{ transition: "opacity 0.3s, stroke 0.3s" }}
          />
        ))}

        {/* Motion detection "burst" rings — only visible when detected */}
        {detected && [10, 20].map((r, i) => (
          <circle key={r} cx="28" cy="38" r={r}
            fill="none" stroke="#22c55e" strokeWidth="0.8"
            opacity={0}
            style={{ animation: `pirBurst 1.2s ease-out ${i * 0.4}s infinite` }}
          />
        ))}

        {/* Sweep line */}
        <line
          x1="28" y1="38" x2="28" y2="6"
          stroke={sweepColor} strokeWidth="1.5" strokeLinecap="round"
          opacity={live ? 0.7 : 0.3}
          style={{
            transformOrigin: "28px 38px",
            animation: live ? "pirSweep 2s linear infinite" : "none",
            stroke: sweepColor,
            transition: "stroke 0.3s",
          }}
        />

        {/* Centre dot */}
        <circle cx="28" cy="38" r="2.5"
          fill={sweepColor}
          opacity="0.9"
          style={{ filter: detected ? "drop-shadow(0 0 4px #22c55e)" : "none", transition: "all 0.3s" }}
        />

        <style>{`
          @keyframes pirSweep  { from { transform: rotate(-90deg); } to { transform: rotate(90deg); } }
          @keyframes pirBurst  { 0% { r: 4; opacity: 0.7; } 100% { r: 36; opacity: 0; } }
        `}</style>
      </svg>

      {/* Status */}
      <div className="flex-1 space-y-1.5">
        <span className="text-[13px] font-bold block transition-colors duration-300" style={{ color: statusColor }}>
          {!live ? "🔌 Waiting..." : detected ? "🏃 Motion!" : "😴 All Clear"}
        </span>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full inline-block"
            style={{ background: live ? "#22c55e" : "#3f3f46", animation: live ? "pulse 2s ease-in-out infinite" : "none" }} />
          <span className="text-[8px] text-zinc-600">{live ? "Live" : "Connect to see data"}</span>
        </div>
      </div>
    </div>
  );
}

export function PIRSensorNode() {
  const [pin, setPin]             = useNodeField<number>("pin", PIR_SENSOR.pin);
  const [pullup, setPullup]       = useNodeField<boolean>("pullup", false);
  const [varName, setVarName]     = useNodeField<string>("varName", "motion");
  const [sendToViz, setSendToViz] = useNodeField<boolean>("sendToViz", true);
  const [debounce, setDebounce]   = useNodeField<number>("debounce", 50);

  // Live data from the serial store — keyed by the variable name the node outputs
  const reading  = useSensorStore(s => s.readings[varName]);
  const live     = !!reading && (Date.now() - reading.ts) < STALE_MS;
  const detected = live && reading.value === 1;

  return (
    <BaseNode title="PIR Motion Sensor" color={COLORS.green} icon={<SensorIcon />} width="260px">
      <NodeField label="GPIO Pin"><NumberInput value={pin} onChange={setPin} /></NodeField>
      <NodeField label="Pull-up">
        <ToggleInput value={pullup} onChange={setPullup} leftLabel="None" rightLabel="↑ Up" />
      </NodeField>

      {/* Live radar display */}
      <PIRRadarDisplay detected={detected} live={live} />

      {/* Debounce */}
      <div className="px-3 py-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[#9ca3af] font-medium">Debounce</span>
          <span className="text-[10px] font-mono text-green-400">{debounce} ms</span>
        </div>
        <input
          type="range" min={0} max={500} step={10} value={debounce}
          onChange={e => setDebounce(Number(e.target.value))}
          className="nodrag w-full h-1 cursor-pointer"
          style={{ accentColor: COLORS.green }}
        />
      </div>

      <NodeField label="Send to Viz">
        <ToggleInput value={sendToViz} onChange={setSendToViz} leftLabel="Off" rightLabel="On" />
      </NodeField>

      {/* Output handle */}
      <NodeField label="detected">
        <TextInput value={varName} onChange={setVarName} green />
        <Handle type="source" position={Position.Right} id="motion" style={{ ...outHS, right: -6 }} />
      </NodeField>

      {/* Format hint */}
      {sendToViz && (
        <div className="mx-3 mb-2 px-2 py-1.5 rounded-lg border border-green-500/20 bg-green-500/5">
          <p className="text-[9px] text-green-400/80 font-mono">SENSOR,digital,{varName},1</p>
          <p className="text-[8px] text-zinc-600 mt-0.5">→ open Sensor Visualizer to see live</p>
        </div>
      )}
    </BaseNode>
  );
}

// ─── Analog Sensor (legacy alias for old nodes type) ─────────────────────────
export { AnalogSensorNode as AnalogSensor };
