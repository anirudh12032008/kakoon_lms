
import { Handle, Position } from "@xyflow/react";
import {
  BaseNode,
  NodeField,
  TextInput,
  useNodeField,
  makeHandleStyle,
  NodeToggleButton,
  COLORS,
} from "./BaseNode";

function GlobeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  );
}

// ─── Print ────────────────────────────────────────────────────────────────────
export function PrintNode() {
  const [text, setText] = useNodeField<string>("text", "'Hello world'");
  return (
    <BaseNode title="Print" color={COLORS.blue} icon={<GlobeIcon />} width="220px">
      <NodeField label="Text">
        <TextInput value={text} onChange={setText} wide />
      </NodeField>
    </BaseNode>
  );
}

export function VariableNode() {
  const [name, setName] = useNodeField<string>("name", "x");
  const [value, setValue] = useNodeField<string>("value", "0");
  return (
    <BaseNode title="Variable" color={COLORS.yellow} icon={<GlobeIcon />} width="200px">
      <NodeField label="Variable">
        <TextInput value={name} onChange={setName} />
      </NodeField>
      <NodeField label="Value">
        <TextInput value={value} onChange={setValue} wide />
      </NodeField>
    </BaseNode>
  );
}

// ─── Sleep (circular) ─────────────────────────────────────────────────────────
export function SleepNode() {
  const [seconds, setSeconds] = useNodeField<number>("seconds", 1);
  const [disabled, setDisabled] = useNodeField<boolean>("disabled", false);
  const color = "#ec4899";
  const hs = makeHandleStyle(color);
  return (
    <div
      className="relative flex flex-col items-center justify-center animate-fade-in"
      style={{
        width: "130px",
        height: "130px",
        borderRadius: "50%",
        background: "var(--k-base-200)",
        border: `3px solid ${color}`,
        opacity: disabled ? 0.55 : 1,
        filter: disabled ? "saturate(0.6)" : "none",
      }}
    >
      <NodeToggleButton value={disabled} onChange={setDisabled} className="absolute right-3 top-3" />
      <Handle type="target" position={Position.Top} style={{ ...hs, top: -7 }} />
      <div className="text-sm font-bold text-white mb-2">Sleep</div>
      <div className="w-3/4 border-t border-[var(--k-border)] mb-2" />
      <input
        type="number"
        className="rounded-md px-2 py-1 text-sm text-white bg-[var(--k-base-300)] border border-[var(--k-border)] outline-none nodrag w-[65px] text-center"
        value={seconds}
        onChange={(e) => setSeconds(Number(e.target.value))}
      />
      <Handle type="source" position={Position.Bottom} style={{ ...hs, bottom: -7 }} />
    </div>
  );
}
