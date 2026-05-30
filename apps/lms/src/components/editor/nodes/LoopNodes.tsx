
import { Handle, Position } from "@xyflow/react";
import {
  LoopNode,
  NodeField,
  TextInput,
  NumberInput,
  useNodeField,
  makeHandleStyle,
  COLORS,
} from "./BaseNode";

function InfinityIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 12c-2-2.5-4-4-6-4a4 4 0 0 0 0 8c2 0 4-1.5 6-4z"/>
      <path d="M12 12c2 2.5 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.5-6 4z"/>
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
      <path d="M3 3v5h5"/>
    </svg>
  );
}

function ScissorsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
      <line x1="20" y1="4" x2="8.12" y2="15.88"/>
      <line x1="14.47" y1="14.48" x2="20" y2="20"/>
      <line x1="8.12" y1="8.12" x2="12" y2="12"/>
    </svg>
  );
}

// ─── Forever Loop (no-header oval) ───────────────────────────────────────────
export function ForeverLoopNode() {
  const color = COLORS.cyan;
  const hs = makeHandleStyle(color);
  return (
    <div
      className="relative flex flex-col items-center justify-center gap-2 animate-fade-in"
      style={{
        width: "180px",
        height: "90px",
        borderRadius: "22px",
        background: "#111113",
        border: `2.5px solid ${color}`,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ ...hs, top: -7 }} />
      <div className="text-sm font-bold text-white">Forever Loop</div>
      <div style={{ color }}><RefreshIcon /></div>
      <Handle type="source" position={Position.Bottom} style={{ ...hs, bottom: -7 }} />
      <Handle type="source" position={Position.Right} id="body" style={{ ...hs, right: -7 }} />
    </div>
  );
}

// ─── For Loop ────────────────────────────────────────────────────────────────
export function ForLoopNode() {
  const [variable, setVariable] = useNodeField<string>("variable", "i");
  const [start, setStart] = useNodeField<number>("start", 0);
  const [end, setEnd] = useNodeField<number>("end", 10);
  const [step, setStep] = useNodeField<number>("step", 1);
  return (
    <LoopNode title="For Loop" color={COLORS.purple} icon={<InfinityIcon />} hasRightHandle width="210px">
      <NodeField label="Variable"><TextInput value={variable} onChange={setVariable} /></NodeField>
      <NodeField label="Start"><NumberInput value={start} onChange={setStart} /></NodeField>
      <NodeField label="End"><NumberInput value={end} onChange={setEnd} /></NodeField>
      <NodeField label="Step"><NumberInput value={step} onChange={setStep} /></NodeField>
    </LoopNode>
  );
}

// ─── While Loop ───────────────────────────────────────────────────────────────
export function WhileLoopNode() {
  const [condition, setCondition] = useNodeField<string>("condition", "True");
  return (
    <LoopNode title="While Loop" color={COLORS.green} hasRightHandle width="210px">
      <NodeField label="Condition"><TextInput value={condition} onChange={setCondition} /></NodeField>
    </LoopNode>
  );
}

// ─── Repeat ───────────────────────────────────────────────────────────────────
export function RepeatNode() {
  const [times, setTimes] = useNodeField<number>("times", 1);
  return (
    <LoopNode title="Repeat" color={COLORS.blue} hasRightHandle width="210px">
      <NodeField label="times"><NumberInput value={times} onChange={setTimes} /></NodeField>
    </LoopNode>
  );
}

// ─── Break (circular) ─────────────────────────────────────────────────────────
export function BreakNode() {
  const color = COLORS.yellow;
  const hs = makeHandleStyle(color);
  return (
    <div
      className="relative flex flex-col items-center justify-center animate-fade-in"
      style={{
        width: "130px",
        height: "130px",
        borderRadius: "50%",
        background: "#111113",
        border: `3px solid ${color}`,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ ...hs, top: -7 }} />
      <div className="text-sm font-bold text-white mb-2">Break</div>
      <div className="w-3/4 border-t border-[#2a2a30] mb-2" />
      <div style={{ color }}><ScissorsIcon /></div>
      <Handle type="source" position={Position.Bottom} style={{ ...hs, bottom: -7 }} />
    </div>
  );
}
