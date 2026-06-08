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
  AdvancedSection,
  COLORS,
} from "./BaseNode";
import { SensorIcon } from "./_shared";
import { useSensorStore } from "@/shared/lib/sensorStore";
import { ONBOARD_IMU, PIR_SENSOR } from "@/entities/board";

const outHS = { ...makeHandleStyle(COLORS.green), top: "50%", transform: "translateY(-50%)" };

// Re-alias board constants
const ONBOARD_IMU_PINS = ONBOARD_IMU;

const STALE_MS = 3000;

// ─── PIR Radar Display ────────────────────────────────────────────────────────
function PIRRadarDisplay({ detected, live }: { detected: boolean; live: boolean }) {
  const sweepColor  = detected ? "#22c55e" : "#3b82f6";
  const statusColor = detected ? "#22c55e" : "#52525b";
  const glowColor   = detected ? "#22c55e44" : "transparent";

  return (
    <div
      className="mx-3 mb-1 flex items-center gap-3 px-2.5 py-2 rounded-lg border bg-[var(--k-base-100)] transition-all duration-300"
      style={{
        borderColor: detected ? "#22c55e40" : "var(--k-border)",
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
            style={{ background: live ? "#22c55e" : "var(--k-base-400)", animation: live ? "pulse 2s ease-in-out infinite" : "none" }} />
          <span className="text-[8px] text-zinc-600">{live ? "Live" : "Connect to see data"}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Onboard IMU — SCL=42, SDA=41 ────────────────────────────────────────────
export function IMUSensorNode() {
  const [varName, setVarName] = useNodeField<string>("varName", "imu");
  const [outputMode, setOutputMode] = useNodeField<string>("outputMode", "print");
  const [loopDelay, setLoopDelay]   = useNodeField<number>("loopDelay", 100);

  return (
    <BaseNode title="Onboard IMU" color={COLORS.purple} icon={<SensorIcon />} width="260px">
      <AdvancedSection>
        {/* Fixed I2C pin info */}
        <div className="mx-3 mb-2 px-2.5 py-1.5 rounded-lg border border-[var(--k-border)] bg-[var(--k-base-200)]">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Onboard SoftI2C — fixed GPIO</span>
            <span className="text-[9px] font-mono text-purple-400">locked</span>
          </div>
          <div className="flex gap-4 mt-0.5">
            <span className="text-[10px] text-zinc-500">SCL <span className="text-[var(--k-text)] font-mono">{ONBOARD_IMU_PINS.scl}</span></span>
            <span className="text-[10px] text-zinc-500">SDA <span className="text-[var(--k-text)] font-mono">{ONBOARD_IMU_PINS.sda}</span></span>
            <span className="text-[10px] text-zinc-500">Addr <span className="text-[var(--k-text)] font-mono">{ONBOARD_IMU_PINS.address}</span></span>
          </div>
        </div>
      </AdvancedSection>

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

      <AdvancedSection>
        <NodeField label="Loop Delay (ms)">
          <NumberInput value={loopDelay} onChange={setLoopDelay} />
        </NodeField>
      </AdvancedSection>

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

      {/* Live radar display */}
      <PIRRadarDisplay detected={detected} live={live} />

      <AdvancedSection>
        <NodeField label="Pull-up">
          <ToggleInput value={pullup} onChange={setPullup} leftLabel="None" rightLabel="↑ Up" />
        </NodeField>
        {/* Debounce */}
        <div className="px-3 py-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[var(--k-muted)] font-medium">Debounce</span>
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
      </AdvancedSection>

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
