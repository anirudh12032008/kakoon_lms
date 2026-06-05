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

const outHS = { ...makeHandleStyle(COLORS.green), top: "50%", transform: "translateY(-50%)" };

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

      <AdvancedSection>
        <PortPinBadge port={port} mode="ultrasonic" />
        {/* Echo pulse visualiser */}
        <div className="px-3 pt-1 pb-0.5">
          <EchoPulseDisplay />
        </div>
      </AdvancedSection>

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

      <AdvancedSection>
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
