import { Handle, Position } from "@xyflow/react";
import {
  BaseNode,
  NodeField,
  TextInput,
  NumberInput,
  ToggleInput,
  useNodeField,
  makeHandleStyle,
  AdvancedSection,
  COLORS,
} from "./BaseNode";
import { SensorIcon } from "./_shared";
import { useSensorStore } from "@/shared/lib/sensorStore";
import { IR_SENSOR } from "@/entities/board";

const outHS = { ...makeHandleStyle(COLORS.green), top: "50%", transform: "translateY(-50%)" };

const IR_STALE_MS = 3000;

// ─── IR Beam Display ──────────────────────────────────────────────────────────
function IRBeamDisplay({ blocked, live }: { blocked: boolean; live: boolean }) {
  const beamColor  = blocked ? "#ef4444" : "#22c55e";
  const stateLabel = !live ? "Waiting..." : blocked ? "Blocked!" : "All Clear!";
  const stateColor = !live ? "#52525b"       : blocked ? "#ef4444"   : "#22c55e";

  return (
    <div
      className="mx-3 mb-1 px-3 py-2.5 rounded-xl border bg-[var(--k-base-100)] transition-all duration-300"
      style={{
        borderColor: !live ? "var(--k-border)" : blocked ? "#ef444440" : "#22c55e40",
        boxShadow:   !live ? "none"    : blocked ? "0 0 12px #ef444420" : "0 0 10px #22c55e18",
      }}
    >
      {/* Beam diagram */}
      <div className="flex items-center gap-3 mb-3">
        {/* TX emitter */}
        <div className="w-8 h-9 rounded-lg border-2 flex flex-col items-center justify-center gap-0.5 flex-shrink-0 transition-all duration-300"
          style={{ borderColor: beamColor, background: `${beamColor}15` }}>
          <span className="text-[8px] font-bold leading-none" style={{ color: beamColor }}></span>
          <span className="text-[7px] font-bold" style={{ color: beamColor }}>TX</span>
        </div>

        {/* Beam */}
        <div className="flex-1 relative h-3 flex items-center">
          {blocked ? (
            <>
              <div className="flex-1 h-0.5 bg-red-500 opacity-30 rounded-full" />
              <div className="w-6 h-6 flex items-center justify-center rounded-full bg-red-500/20 border-2 border-red-500/60 flex-shrink-0 mx-1"
                style={{ animation: "pulse 0.7s ease-in-out infinite" }}>
                <span className="text-[10px]"></span>
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
          <span className="text-[8px] font-bold leading-none" style={{ color: beamColor }}></span>
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
            style={{ background: live ? beamColor : "var(--k-base-400)",
              animation: live ? "pulse 2s ease-in-out infinite" : "none" }} />
          <span className="text-[8px] text-[var(--k-dim)]">{live ? "Live" : "Connect to see data"}</span>
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
      <AdvancedSection>
        <NodeField label="GPIO Pin"><NumberInput value={pin} onChange={setPin} /></NodeField>
        <NodeField label="Invert">
          <ToggleInput value={invert} onChange={setInvert} leftLabel="LOW=blocked" rightLabel="HIGH=blocked" />
        </NodeField>
      </AdvancedSection>

      <IRBeamDisplay blocked={blocked} live={live} />

      <AdvancedSection>
        <NodeField label="Send to Viz">
          <ToggleInput value={sendToViz} onChange={setSendToViz} leftLabel="Off" rightLabel="On" />
        </NodeField>
      </AdvancedSection>
      <NodeField label="IR Value">
        <TextInput value={varName} onChange={setVarName} green />
        <Handle type="source" position={Position.Right} id="ir" style={{ ...outHS, right: -6 }} />
      </NodeField>
    </BaseNode>
  );
}

// ─── IR Code Display ──────────────────────────────────────────────────────────
function IRCodeDisplay({ code, live }: { code: number | null; live: boolean }) {
  const hex = code !== null ? `0x${code.toString(16).toUpperCase().padStart(4, "0")}` : "——";
  return (
    <div className="mx-3 mb-1 px-3 py-2 rounded-lg border border-[var(--k-border)] bg-[var(--k-base-100)]">
      {/* Code display */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[8px] uppercase tracking-wider text-[var(--k-dim)] font-bold">Last Code</span>
        <div className="flex items-center gap-1">
          <span className="w-1 h-1 rounded-full"
            style={{ background: live ? "#f97316" : "var(--k-base-400)", animation: live ? "pulse 2s ease-in-out infinite" : "none" }} />
          <span className="text-[8px] text-[var(--k-dim)] font-mono">{live ? "LIVE" : "no signal"}</span>
        </div>
      </div>

      <div className="flex items-center justify-center py-1 px-3 rounded-md bg-[var(--k-base-200)] border border-[var(--k-border)]">
        <span className="text-base font-mono font-bold tracking-widest"
          style={{ color: live ? "#f97316" : "var(--k-base-400)" }}>
          {hex}
        </span>
      </div>

      <p className="text-[8px] text-[var(--k-dim)] mt-1.5 text-center">Point your remote at the receiver!</p>
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
