
import { Handle, Position } from "@xyflow/react";
import {
  BaseNode,
  NodeField,
  TextInput,
  NumberInput,
  useNodeField,
  COLORS,
} from "./BaseNode";

function MathIcon() {
  return <span className="text-xs font-bold font-mono">(x)</span>;
}

const outHS = {
  width: 12,
  height: 12,
  background: "#111113",
  border: "2.5px solid #22c55e",
  borderRadius: "50%",
  zIndex: 10,
  top: "50%",
  transform: "translateY(-50%)",
};

// ─── Map Range ────────────────────────────────────────────────────────────────
export function MapRangeNode() {
  const [value, setValue] = useNodeField<string>("value", "value");
  const [fromMin, setFromMin] = useNodeField<number>("fromMin", 0);
  const [fromMax, setFromMax] = useNodeField<number>("fromMax", 4095);
  const [toMin, setToMin] = useNodeField<number>("toMin", 0);
  const [toMax, setToMax] = useNodeField<number>("toMax", 180);
  const [varName, setVarName] = useNodeField<string>("varName", "mapped_value");
  return (
    <BaseNode title="Map Range" color={COLORS.blue} icon={<MathIcon />} width="230px">
      <NodeField label="Value"><TextInput value={value} onChange={setValue} /></NodeField>
      <NodeField label="From Min"><NumberInput value={fromMin} onChange={setFromMin} /></NodeField>
      <NodeField label="From Max"><NumberInput value={fromMax} onChange={setFromMax} className="w-[80px]" /></NodeField>
      <NodeField label="To Min"><NumberInput value={toMin} onChange={setToMin} /></NodeField>
      <NodeField label="To Max"><NumberInput value={toMax} onChange={setToMax} /></NodeField>
      <NodeField label="mapped value">
        <TextInput value={varName} onChange={setVarName} green />
        <Handle type="source" position={Position.Right} id="mapped" style={{ ...outHS, right: -6 }} />
      </NodeField>
    </BaseNode>
  );
}

// ─── Random Number ────────────────────────────────────────────────────────────
export function RandomNumberNode() {
  const [from, setFrom] = useNodeField<number>("from", 0);
  const [to, setTo] = useNodeField<number>("to", 100);
  const [varName, setVarName] = useNodeField<string>("varName", "rand_val");
  return (
    <BaseNode title="Random Number" color={COLORS.violet} icon={<MathIcon />} width="220px">
      <NodeField label="From"><NumberInput value={from} onChange={setFrom} /></NodeField>
      <NodeField label="To"><NumberInput value={to} onChange={setTo} /></NodeField>
      <NodeField label="random value">
        <TextInput value={varName} onChange={setVarName} green />
        <Handle type="source" position={Position.Right} id="rand" style={{ ...outHS, right: -6 }} />
      </NodeField>
    </BaseNode>
  );
}
