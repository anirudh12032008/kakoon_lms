import { Handle, Position } from "@xyflow/react";
import {
  BaseNode,
  NodeField,
  TextInput,
  NumberInput,
  useNodeField,
  makeHandleStyle,
  AdvancedSection,
  COLORS,
} from "./BaseNode";
import { SensorIcon } from "./_shared";

const outHS = { ...makeHandleStyle(COLORS.green), top: "50%", transform: "translateY(-50%)" };

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

      <AdvancedSection>
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
      </AdvancedSection>

      {/* Value output */}
      <NodeField label="value">
        <TextInput value={varName} onChange={setVarName} green />
        <Handle type="source" position={Position.Right} id="value" style={{ ...outHS, right: -6 }} />
      </NodeField>

      <AdvancedSection>
        {/* Threshold trigger output */}
        <NodeField label="thresh →">
          <TextInput value={threshVar} onChange={setThreshVar} green />
          <Handle type="source" position={Position.Right} id="threshold"
            style={{ ...outHS, right: -6, border: "2.5px solid #f97316" }} />
        </NodeField>
      </AdvancedSection>
    </BaseNode>
  );
}
