import { useState } from "react";
import { Handle, Position } from "@xyflow/react";

// Safe formula evaluator — whitelist chars before using Function constructor.
// Allows: digits, x, basic operators, parentheses, decimal points, and safe
// Math methods. Anything else throws so malicious strings never execute.
const SAFE_FORMULA_RE = /^[0-9x\s+\-*/.()%,]+$|(Math\.(floor|ceil|abs|round|min|max|sqrt|pow|log|exp|sin|cos|tan)\b)/;
function evalSafeFormula(formula: string, x: number): number {
  const stripped = formula.replace(/Math\.(floor|ceil|abs|round|min|max|sqrt|pow|log|exp|sin|cos|tan)\b/g, "");
  if (!SAFE_FORMULA_RE.test(stripped)) {
    throw new Error("Formula contains unsafe characters");
  }
  // eslint-disable-next-line no-new-func
  return new Function("x", `"use strict"; return (${formula});`)(x) as number;
}
import {
  BaseNode, NodeField, TextInput, NumberInput, SelectInput, ToggleInput,
  useNodeField, COLORS, makeHandleStyle,
} from "./BaseNode";

const outHS = (color = "#22c55e") => ({
  width: 12, height: 12, background: "#111113",
  border: `2.5px solid ${color}`, borderRadius: "50%", zIndex: 10,
});

function TimerIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}
function VarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3h7l2 18 2-12 2 12 2-18h3"/>
    </svg>
  );
}
function MathIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>
    </svg>
  );
}

// ─── Timer / Interval Node ────────────────────────────────────────────────────
export function TimerIntervalNode() {
  const [mode, setMode] = useNodeField<string>("mode", "repeat");
  const [interval, setInterval] = useNodeField<number>("interval", 1000);
  const [unit, setUnit] = useNodeField<string>("unit", "ms");
  const [autoStart, setAutoStart] = useNodeField<boolean>("autoStart", true);
  const [varName, setVarName] = useNodeField<string>("varName", "elapsed");

  const ms = unit === "ms" ? interval : unit === "s" ? interval * 1000 : interval * 60000;
  const hz = ms > 0 ? (1000 / ms).toFixed(2) : "—";

  return (
    <BaseNode title="Timer / Interval" color={COLORS.cyan} icon={<TimerIcon />} width="260px"
      hasRightHandle={false} hasLeftHandle={false}>
      {/* top target handles */}
      <Handle type="target" position={Position.Left} id="start"
        style={{ ...outHS("#22c55e"), left: -6, top: "35%" }} />
      <Handle type="target" position={Position.Left} id="stop"
        style={{ ...outHS("#ef4444"), left: -6, top: "65%" }} />
      <div className="absolute text-[8px] text-zinc-500 select-none font-mono" style={{ left: 10, top: "30%" }}>START</div>
      <div className="absolute text-[8px] text-zinc-500 select-none font-mono" style={{ left: 10, top: "60%" }}>STOP</div>

      <div className="h-3" />

      <NodeField label="Mode">
        <SelectInput value={mode} onChange={setMode} compact
          options={[{ label: "Repeat", value: "repeat" }, { label: "One-Shot", value: "oneshot" }]} />
      </NodeField>

      <NodeField label="Interval">
        <NumberInput value={interval} onChange={setInterval} style={{ width: 70 }} />
        <SelectInput value={unit} onChange={setUnit} compact style={{ width: 54 }}
          options={[{ label: "ms", value: "ms" }, { label: "s", value: "s" }, { label: "min", value: "min" }]} />
      </NodeField>

      {/* freq readout */}
      <div className="mx-3 mb-1 flex items-center justify-between px-2.5 py-1 rounded-lg bg-[#0a0a0d] border border-[#1c1c20]">
        <span className="text-[9px] text-zinc-500">Period</span>
        <span className="text-[11px] font-mono font-bold text-cyan-400">{ms >= 1000 ? `${(ms/1000).toFixed(2)} s` : `${ms} ms`}</span>
        <span className="text-[9px] text-zinc-500">{hz} Hz</span>
      </div>

      <NodeField label="Auto-start"><ToggleInput value={autoStart} onChange={setAutoStart} leftLabel="Off" rightLabel="On" /></NodeField>
      <NodeField label="Elapsed var">
        <TextInput value={varName} onChange={setVarName} green />
      </NodeField>

      {/* output handles */}
      <Handle type="source" position={Position.Right} id="tick"
        style={{ ...outHS(COLORS.cyan), right: -6, top: "42%" }} />
      <Handle type="source" position={Position.Right} id="elapsed_out"
        style={{ ...outHS(COLORS.yellow), right: -6, top: "62%" }} />
      <div className="absolute text-[8px] text-zinc-500 select-none font-mono text-right" style={{ right: 10, top: "37%" }}>TICK</div>
      <div className="absolute text-[8px] text-zinc-500 select-none font-mono text-right" style={{ right: 10, top: "57%" }}>ELAPSED</div>
      <div className="h-5" />
    </BaseNode>
  );
}

// ─── Variable / State Node ─────────────────────────────────────────────────────
export function VariableStateNode() {
  const [label, setLabel] = useNodeField<string>("label", "myVar");
  const [type, setType] = useNodeField<string>("type", "int");
  const [initVal, setInitVal] = useNodeField<string>("initVal", "0");
  const [persistent, setPersistent] = useNodeField<boolean>("persistent", false);

  const typeColor: Record<string, string> = {
    int: "#3b82f6", float: "#8b5cf6", bool: "#22c55e", string: "#f97316",
  };
  const tc = typeColor[type] ?? COLORS.blue;

  return (
    <BaseNode title="Variable / State" color={COLORS.yellow} icon={<VarIcon />} width="250px">
      <NodeField label="Name"><TextInput value={label} onChange={setLabel} wide /></NodeField>
      <NodeField label="Type">
        <SelectInput value={type} onChange={setType} compact
          options={[
            { label: "Integer", value: "int" },
            { label: "Float", value: "float" },
            { label: "Boolean", value: "bool" },
            { label: "String", value: "string" },
          ]} />
        <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold font-mono uppercase"
          style={{ background: `${tc}22`, color: tc, border: `1px solid ${tc}55` }}>{type}</span>
      </NodeField>
      <NodeField label="Init value"><TextInput value={initVal} onChange={setInitVal} wide /></NodeField>
      <NodeField label="Persistent">
        <ToggleInput value={persistent} onChange={setPersistent} leftLabel="RAM" rightLabel="NVS" />
      </NodeField>

      {/* read output on right */}
      <div className="px-3 py-1 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Handle type="target" position={Position.Left} id="write"
            style={{ ...makeHandleStyle(COLORS.orange), left: -6 }} />
          <span className="text-[9px] text-zinc-500 font-mono ml-4">WRITE IN</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-zinc-500 font-mono mr-4">READ OUT</span>
          <Handle type="source" position={Position.Right} id="read"
            style={{ ...makeHandleStyle(tc), right: -6 }} />
        </div>
      </div>

      {/* live value pill */}
      <div className="mx-3 mb-2 flex items-center justify-center px-3 py-1.5 rounded-lg bg-[#0a0a0d] border border-[#1c1c20]">
        <span className="text-[9px] text-zinc-500 mr-2">Current value:</span>
        <span className="text-xs font-mono font-bold" style={{ color: tc }}>{initVal}</span>
      </div>
    </BaseNode>
  );
}

// ─── Math / Transform Node ────────────────────────────────────────────────────
const OPERATIONS = [
  { label: "Map (Arduino)", value: "map" },
  { label: "Scale ×", value: "scale" },
  { label: "Clamp", value: "clamp" },
  { label: "Abs", value: "abs" },
  { label: "Round", value: "round" },
  { label: "Invert (1/x)", value: "invert" },
  { label: "Custom formula", value: "custom" },
];

export function MathTransformNode() {
  const [op, setOp] = useNodeField<string>("op", "map");
  const [inMin, setInMin] = useNodeField<number>("inMin", 0);
  const [inMax, setInMax] = useNodeField<number>("inMax", 4095);
  const [outMin, setOutMin] = useNodeField<number>("outMin", 0);
  const [outMax, setOutMax] = useNodeField<number>("outMax", 100);
  const [scale, setScale] = useNodeField<number>("scale", 1);
  const [clampMin, setClampMin] = useNodeField<number>("clampMin", 0);
  const [clampMax, setClampMax] = useNodeField<number>("clampMax", 255);
  const [formula, setFormula] = useNodeField<string>("formula", "(x * 3.3) / 4095");
  const [varName, setVarName] = useNodeField<string>("varName", "result");

  const [preview, setPreview] = useState<string | null>(null);

  const handlePreview = () => {
    const x = 2048;
    let r: number | string;
    try {
      if (op === "map") r = ((x - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
      else if (op === "scale") r = x * scale;
      else if (op === "clamp") r = Math.min(clampMax, Math.max(clampMin, x));
      else if (op === "abs") r = Math.abs(x);
      else if (op === "round") r = Math.round(x);
      else if (op === "invert") r = 1 / x;
      else r = evalSafeFormula(formula, x);
      setPreview(`x=2048 → ${typeof r === "number" ? r.toFixed(3) : r}`);
    } catch (err: unknown) {
      setPreview(err instanceof Error ? `Error: ${err.message}` : "Formula error");
    }
  };

  return (
    <BaseNode title="Math / Transform" color={COLORS.purple} icon={<MathIcon />} width="270px">
      <Handle type="target" position={Position.Left} id="input"
        style={{ ...makeHandleStyle(COLORS.purple), left: -6, top: "40%" }} />
      <Handle type="source" position={Position.Right} id="output"
        style={{ ...makeHandleStyle(COLORS.cyan), right: -6, top: "40%" }} />

      <NodeField label="Operation">
        <SelectInput value={op} onChange={setOp} options={OPERATIONS} style={{ flex: 1 }} />
      </NodeField>

      {op === "map" && (<>
        <div className="mx-3 mt-0.5 rounded-lg border border-[#1c1c20] bg-[#0a0a0d] p-2">
          <div className="text-[9px] text-zinc-500 mb-1.5 uppercase tracking-wider font-bold">Input Range → Output Range</div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[9px] text-zinc-500 w-6">in</span>
            <NumberInput value={inMin} onChange={setInMin} style={{ width: 54 }} />
            <span className="text-[9px] text-zinc-600">to</span>
            <NumberInput value={inMax} onChange={setInMax} style={{ width: 54 }} />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-zinc-500 w-6">out</span>
            <NumberInput value={outMin} onChange={setOutMin} style={{ width: 54 }} />
            <span className="text-[9px] text-zinc-600">to</span>
            <NumberInput value={outMax} onChange={setOutMax} style={{ width: 54 }} />
          </div>
        </div>
      </>)}

      {op === "scale" && (
        <NodeField label="Factor"><NumberInput value={scale} onChange={setScale} /></NodeField>
      )}

      {op === "clamp" && (
        <div className="mx-3 mt-0.5 rounded-lg border border-[#1c1c20] bg-[#0a0a0d] p-2">
          <div className="text-[9px] text-zinc-500 mb-1.5 uppercase tracking-wider font-bold">Clamp Range</div>
          <div className="flex items-center gap-1.5">
            <NumberInput value={clampMin} onChange={setClampMin} style={{ width: 60 }} />
            <span className="text-[9px] text-zinc-600">to</span>
            <NumberInput value={clampMax} onChange={setClampMax} style={{ width: 60 }} />
          </div>
        </div>
      )}

      {op === "custom" && (
        <NodeField label="f(x) ="><TextInput value={formula} onChange={setFormula} wide /></NodeField>
      )}

      {/* preview button */}
      <div className="px-3 py-1">
        <button onClick={handlePreview}
          className="nodrag w-full py-1 rounded-lg border border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 text-[10px] font-bold transition-all">
          Test with x = 2048
        </button>
        {preview && (
          <div className="mt-1 text-center text-[10px] font-mono font-bold text-cyan-400 bg-[#0a0a0d] rounded px-2 py-1 border border-[#1c1c20]">
            {preview}
          </div>
        )}
      </div>

      <NodeField label="Output var">
        <TextInput value={varName} onChange={setVarName} green />
      </NodeField>
    </BaseNode>
  );
}
