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
import { SensorIcon, PORT_OPTIONS, PortPinBadge } from "./_shared";

const outHS = { ...makeHandleStyle(COLORS.green), top: "50%", transform: "translateY(-50%)" };

// ─── Touch Sensor ─────────────────────────────────────────────────────────────
export function TouchSensorNode() {
  const [port, setPort] = useNodeField<string>("port", "1");
  const [varName, setVarName] = useNodeField<string>("varName", "touch_value");
  return (
    <BaseNode title="Touch Sensor" color={COLORS.red} icon={<SensorIcon />} width="240px">
      <NodeField label="Sensor Port">
        <SelectInput value={port} onChange={setPort} options={PORT_OPTIONS} compact />
      </NodeField>
      <AdvancedSection><PortPinBadge port={port} mode="i2c" /></AdvancedSection>
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
      <AdvancedSection><PortPinBadge port={port} mode="i2c" /></AdvancedSection>
      <NodeField label="Value">
        <TextInput value={varName} onChange={setVarName} green />
        <Handle type="source" position={Position.Right} id="value" style={{ ...outHS, right: -6 }} />
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

      <AdvancedSection>
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
      </AdvancedSection>

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
      <AdvancedSection>
        <NodeField label="Touch Pin 1"><NumberInput value={pin1} onChange={setPin1} /></NodeField>
        <NodeField label="Touch Pin 2"><NumberInput value={pin2} onChange={setPin2} /></NodeField>
        <NodeField label="Touch Pin 3"><NumberInput value={pin3} onChange={setPin3} /></NodeField>
        <NodeField label="Touch Pin 4"><NumberInput value={pin4} onChange={setPin4} /></NodeField>
      </AdvancedSection>
      {outputs.map((row) => (
        <NodeField key={row.id} label={row.label}>
          <TextInput value={row.val} onChange={row.set} green />
          <Handle type="source" position={Position.Right} id={row.id} style={{ ...outHS, right: -6 }} />
        </NodeField>
      ))}
    </BaseNode>
  );
}
