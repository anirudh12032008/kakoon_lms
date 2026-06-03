import { type ReactNode, useCallback, useMemo, useState } from "react";
import { Handle, Position, useNodeId, useNodes, useReactFlow, useStore } from "@xyflow/react";
import { motion, AnimatePresence } from "framer-motion";
import { useModal } from "@/shared/context/ModalContext";
import { PlusCircle } from "lucide-react";
import { saveCustomSubflowFromSelection } from "@/entities/custom-node/model/customNodes";

function TrashIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2M10 11v6M14 11v6" />
    </svg>
  );
}

function DuplicateIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

export function NodeToggleButton({
  value,
  onChange,
  className = "",
}: {
  value: boolean;
  onChange: (nextValue: boolean) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={value ? "Enable node" : "Disable node"}
      aria-pressed={value}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!value);
      }}
      className={`nodrag inline-flex h-5 w-9 items-center rounded-full border border-[#2d2d35] p-0.5 transition-colors ${value ? "bg-[#7c3aed]" : "bg-[#3f3f46]"} ${className}`}
    >
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${value ? "translate-x-4" : "translate-x-0"}`} />
    </button>
  );
}

function SelectionToolbar() {
  const nodeId = useNodeId();
  const { getNode, getNodes, getEdges, setNodes, setEdges } = useReactFlow();
  const { prompt } = useModal();

  // useNodes() re-renders only when node selection changes — no store any-cast needed
  const allNodes = useNodes();
  const isSelected = useMemo(
    () => allNodes.find((n) => n.id === nodeId)?.selected ?? false,
    [allNodes, nodeId]
  );

  if (!nodeId || !isSelected) return null;

  const handleSaveAsCustomNode = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const node = getNode(nodeId);
    if (!node) return;
    const defaultLabel =
      typeof node.data?.label === "string" && node.data.label.trim()
        ? node.data.label.trim()
        : node.type ?? "Custom Node";
    const savedLabel = await prompt("Name this custom node", defaultLabel);
    if (!savedLabel) return;
    saveCustomSubflowFromSelection(node, getNodes(), getEdges(), savedLabel);
  };

  return (
    <div
      className="absolute flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-[#2d2d35] shadow-2xl z-50 nodrag select-none"
      style={{ top: -46, right: 0, background: "#18181b" }}
    >
      <button
        onClick={handleSaveAsCustomNode}
        className="text-[#9ca3af] hover:text-violet-300 transition-colors p-1 rounded hover:bg-[#27272a]"
        title="Save as Custom Subflow"
      >
        <PlusCircle className="w-4 h-4" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setNodes((nds) => nds.filter((n) => n.id !== nodeId));
          setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
        }}
        className="text-[#9ca3af] hover:text-red-400 transition-colors p-1 rounded hover:bg-[#27272a]"
        title="Delete Node"
      >
        <TrashIcon />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setNodes((nds) => {
            const original = nds.find((n) => n.id === nodeId);
            if (!original) return nds;
            const newId = `node_dup_${Date.now()}`;
            const duplicated = {
              ...original,
              id: newId,
              position: { x: original.position.x + 30, y: original.position.y + 35 },
              selected: true,
            };
            return nds.map((n) => n.id === nodeId ? { ...n, selected: false } : n).concat(duplicated);
          });
        }}
        className="text-[#9ca3af] hover:text-white transition-colors p-1 rounded hover:bg-[#27272a]"
        title="Duplicate Node"
      >
        <DuplicateIcon />
      </button>
    </div>
  );
}

export const COLORS = {
  blue: "#3b82f6",
  cyan: "#14b8a6",
  yellow: "#eab308",
  red: "#ef4444",
  pink: "#ec4899",
  green: "#22c55e",
  orange: "#f97316",
  purple: "#8b5cf6",
  violet: "#7c3aed",
  indigo: "#6366f1",
  gray: "#6b7280",
};

export function useNodeField<T>(key: string, defaultValue: T): [T, (val: T) => void] {
  const nodeId = useNodeId();
  const { setNodes, getNode } = useReactFlow();
  const node = nodeId ? getNode(nodeId) : null;
  const value = (node?.data?.[key] ?? defaultValue) as T;

  const setValue = useCallback(
    (newVal: T) => {
      if (!nodeId) return;
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId ? { ...n, data: { ...n.data, [key]: newVal } } : n
        )
      );
    },
    [nodeId, key, setNodes]
  );
  return [value, setValue];
}

export function makeHandleStyle(color: string) {
  return {
    width: 12,
    height: 12,
    background: "#111113",
    border: `2.5px solid ${color}`,
    borderRadius: "50%",
    zIndex: 10,
  };
}

export function NodeField({ label, children }: { label?: string; children: ReactNode }) {
  return (
    <div className="relative flex items-center gap-2 px-3 py-1">
      {label && <span className="w-[72px] flex-shrink-0 text-xs text-[#9ca3af] font-medium">{label}</span>}
      {children}
    </div>
  );
}

const VAR_KEYS = ["varName", "t1", "t2", "t3", "t4", "name"] as const;

export function TextInput({
  value, onChange, className, green, wide, style,
}: {
  value: string; onChange: (v: string) => void;
  className?: string; green?: boolean; wide?: boolean; style?: React.CSSProperties;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const allNodes = useNodes();

  const suggestions = useMemo(() => {
    if (!isFocused) return [];
    const vars = new Set<string>();
    for (const n of allNodes) {
      if (!n.data) continue;
      for (const k of VAR_KEYS) {
        const v = n.data[k];
        if (typeof v === "string" && v.trim()) vars.add(v.trim());
      }
    }
    const lower = value.toLowerCase();
    return Array.from(vars).filter((s) => s !== value && s.toLowerCase().includes(lower));
  }, [allNodes, isFocused, value]);

  const dropdown = isFocused && suggestions.length > 0 && (
    <div className="absolute left-0 right-0 top-full mt-1 z-[9999] rounded-lg border border-cyan-800 bg-[#0c0c0f]/95 backdrop-blur-md shadow-2xl p-1 max-h-[140px] overflow-y-auto select-none nodrag">
      {suggestions.map((s) => (
        <button key={s} type="button"
          onMouseDown={(e) => { e.preventDefault(); onChange(s); setIsFocused(false); }}
          className="w-full text-left px-2.5 py-1.5 rounded-md text-[11px] font-mono font-semibold text-cyan-400 hover:text-white hover:bg-cyan-600/25 transition-all cursor-pointer"
        >{s}</button>
      ))}
    </div>
  );

  if (green) {
    return (
      <div className={`relative flex items-center bg-[#18181b] border border-[#22c55e] rounded-md h-7 overflow-visible flex-1 w-0 -mr-3 ${className ?? ""}`} style={style}>
        <input
          className="bg-transparent px-2.5 py-1 text-xs font-mono outline-none text-white nodrag flex-1 min-w-0"
          value={value} onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
        />
        <div className="flex items-center justify-center bg-[#22c55e] text-[#111113] font-black font-sans text-[10px] w-5 h-[calc(100%+2px)] -my-[1px] rounded-r-[5px] select-none uppercase">o</div>
        {dropdown}
      </div>
    );
  }

  return (
    <div className="relative flex flex-col flex-1 min-w-0 overflow-visible">
      <input
        style={style}
        className={`rounded-md px-2 py-1 text-xs font-mono outline-none nodrag bg-[#1c1c20] border border-[#2d2d35] text-white ${wide ? "w-full" : "w-[90px]"} ${className ?? ""}`}
        value={value} onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
      />
      {dropdown}
    </div>
  );
}

export function NumberInput({ value, onChange, className, style }: {
  value: number; onChange: (v: number) => void; className?: string; style?: React.CSSProperties;
}) {
  return (
    <input type="number" style={style}
      className={`rounded-md px-2 py-1 text-xs text-[#60a5fa] font-mono bg-[#1c1c20] border border-[#2d2d35] outline-none nodrag w-[70px] ${className ?? ""}`}
      value={value} onChange={(e) => onChange(Number(e.target.value))}
    />
  );
}

export function SelectInput({ value, onChange, options, className, compact, style }: {
  value: string; onChange: (v: string) => void;
  options: { label: string; value: string }[];
  className?: string; compact?: boolean; style?: React.CSSProperties;
}) {
  return (
    <select style={style}
      className={`rounded-md px-2 py-1 text-xs text-[#9ca3af] bg-[#1c1c20] border border-[#2d2d35] outline-none nodrag ${compact ? "w-[90px]" : "flex-1 w-full"} ${className ?? ""}`}
      value={value} onChange={(e) => onChange(e.target.value)}
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function ToggleInput({ value, onChange, leftLabel, rightLabel }: {
  value: boolean; onChange: (v: boolean) => void; leftLabel?: string; rightLabel?: string;
}) {
  return (
    <div className="flex items-center gap-1.5 nodrag">
      {leftLabel && <span className="text-xs text-[#9ca3af]">{leftLabel}</span>}
      <button type="button" onClick={() => onChange(!value)}
        className={`relative inline-flex h-4 w-7 flex-shrink-0 items-center rounded-full transition-colors ${value ? "bg-[#7c3aed]" : "bg-[#3f3f46]"}`}
      >
        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${value ? "translate-x-3.5" : "translate-x-0.5"}`} />
      </button>
      {rightLabel && <span className="text-xs text-[#9ca3af]">{rightLabel}</span>}
    </div>
  );
}

export function OutputHandle({ id = "output" }: { id?: string }) {
  return (
    <Handle type="source" position={Position.Right} id={id}
      style={{ width: 12, height: 12, background: "#22c55e", border: "2.5px solid #16a34a", borderRadius: "50%", right: -6 }}
    />
  );
}

export function BaseNode({
  title, color, icon, children,
  hasTopHandle = true, hasBottomHandle = true,
  hasRightHandle = false, hasLeftHandle = false,
  circular = false, width = "220px",
}: {
  title: string; color: string; icon?: ReactNode; children?: ReactNode;
  hasTopHandle?: boolean; hasBottomHandle?: boolean;
  hasRightHandle?: boolean; hasLeftHandle?: boolean;
  circular?: boolean; width?: string;
}) {
  const hs = makeHandleStyle(color);
  const [disabled, setDisabled] = useNodeField<boolean>("disabled", false);
  const nodeId = useNodeId();
  const isSelected = useStore(s => nodeId ? (s.nodes.find(n => n.id === nodeId)?.selected ?? false) : false);

  if (circular) {
    return (
      <motion.div
        className="relative flex flex-col items-center justify-center"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: disabled ? 0.55 : 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 26 }}
        style={{
          width: "130px", height: "130px", borderRadius: "50%",
          background: "#111113",
          border: `3px solid ${isSelected ? color : color + "80"}`,
          filter: disabled ? "saturate(0.6)" : "none",
          boxShadow: isSelected
            ? `0 0 0 2px ${color}cc, 0 0 32px ${color}55, 0 0 72px ${color}20`
            : `0 6px 24px rgba(0,0,0,0.5)`,
          transition: "box-shadow 0.2s ease, border-color 0.2s ease",
        }}
      >
        <SelectionToolbar />
        <NodeToggleButton value={disabled} onChange={setDisabled} className="absolute right-3 top-3" />
        {hasTopHandle && <Handle type="target" position={Position.Top} style={{ ...hs, top: -7 }} />}
        <div className="text-sm font-bold text-white mb-2">{title}</div>
        <div className="w-3/4 border-t border-[#2a2a30] mb-2" />
        {children}
        {hasBottomHandle && <Handle type="source" position={Position.Bottom} style={{ ...hs, bottom: -7 }} />}
        {hasRightHandle && <Handle type="source" position={Position.Right} id="right" style={{ ...hs, right: -7 }} />}
      </motion.div>
    );
  }

  return (
    <motion.div
      className="relative overflow-visible rounded-xl"
      initial={{ opacity: 0, scale: 0.88, y: 8 }}
      animate={{ opacity: disabled ? 0.55 : 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 26, mass: 0.8 }}
      style={{
        width, minWidth: "160px",
        background: "#111113",
        border: `1px solid ${isSelected ? color + "aa" : "#222228"}`,
        filter: disabled ? "saturate(0.6)" : "none",
        boxShadow: isSelected
          ? `0 0 0 1px ${color}88, 0 0 28px ${color}45, 0 0 64px ${color}18, 0 8px 32px rgba(0,0,0,0.5)`
          : "0 8px 32px rgba(0,0,0,0.4)",
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",
      }}
    >
      <SelectionToolbar />
      <NodeToggleButton value={disabled} onChange={setDisabled} className="absolute right-3 top-3 z-20" />
      {hasTopHandle && <Handle type="target" position={Position.Top} style={{ ...hs, top: -7 }} />}
      {hasBottomHandle && <Handle type="source" position={Position.Bottom} style={{ ...hs, bottom: -7 }} />}
      {hasLeftHandle && <Handle type="target" position={Position.Left} id="left" style={{ ...hs, left: -7 }} />}
      {hasRightHandle && <Handle type="source" position={Position.Right} id="right" style={{ ...hs, right: -7 }} />}

      <div className="flex items-center justify-between px-3 py-2 pr-14"
        style={{ background: color, borderRadius: "10px 10px 0 0" }}
      >
        <span className="text-sm font-bold text-white leading-none">{title}</span>
        {icon && <span className="text-white opacity-90">{icon}</span>}
      </div>
      <div className="w-full py-1.5 flex flex-col gap-0.5">{children}</div>
    </motion.div>
  );
}

export function LoopNode({
  title, color, icon, children, hasRightHandle = false, width = "210px",
}: {
  title: string; color: string; icon?: ReactNode; children?: ReactNode;
  hasRightHandle?: boolean; width?: string;
}) {
  const hs = makeHandleStyle(color);
  const [disabled, setDisabled] = useNodeField<boolean>("disabled", false);
  const nodeId = useNodeId();
  const isSelected = useStore(s => nodeId ? (s.nodes.find(n => n.id === nodeId)?.selected ?? false) : false);
  return (
    <motion.div
      className="relative overflow-visible"
      initial={{ opacity: 0, scale: 0.88, y: 8 }}
      animate={{ opacity: disabled ? 0.55 : 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 26, mass: 0.8 }}
      style={{
        width, background: "#111113",
        border: `2.5px solid ${isSelected ? color : color + "66"}`,
        borderRadius: "18px",
        filter: disabled ? "saturate(0.6)" : "none",
        boxShadow: isSelected
          ? `0 0 0 1px ${color}88, 0 0 28px ${color}45, 0 0 64px ${color}18`
          : "0 8px 32px rgba(0,0,0,0.4)",
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",
      }}
    >
      <SelectionToolbar />
      <NodeToggleButton value={disabled} onChange={setDisabled} className="absolute right-3 top-3 z-20" />
      <Handle type="target" position={Position.Top} style={{ ...hs, top: -7 }} />
      <Handle type="source" position={Position.Bottom} style={{ ...hs, bottom: -7 }} />
      {hasRightHandle && <Handle type="source" position={Position.Right} id="body" style={{ ...hs, right: -7 }} />}
      <div className="flex items-center justify-between px-4 py-3 pr-14">
        <span className="text-sm font-bold text-white">{title}</span>
        {icon && <span style={{ color }}>{icon}</span>}
      </div>
      {children && (
        <>
          <div className="border-t border-[#222228]" />
          <div className="py-1.5 flex flex-col gap-0.5">{children}</div>
        </>
      )}
    </motion.div>
  );
}

export function IfElseNodeWrapper({ children }: { children?: ReactNode }) {
  const color = "#008cff";
  const hs = { width: 12, height: 12, background: "#111113", border: "2.5px solid #3f3f46", borderRadius: "50%", zIndex: 10 };
  const [disabled, setDisabled] = useNodeField<boolean>("disabled", false);
  const nodeId = useNodeId();
  const isSelected = useStore(s => nodeId ? (s.nodes.find(n => n.id === nodeId)?.selected ?? false) : false);
  return (
    <motion.div
      className="relative overflow-visible rounded-xl"
      initial={{ opacity: 0, scale: 0.88, y: 8 }}
      animate={{ opacity: disabled ? 0.55 : 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 26, mass: 0.8 }}
      style={{
        width: "260px", background: "#111113",
        border: `1px solid ${isSelected ? color + "aa" : "#222228"}`,
        filter: disabled ? "saturate(0.6)" : "none",
        boxShadow: isSelected
          ? `0 0 0 1px ${color}88, 0 0 28px ${color}45, 0 0 64px ${color}18, 0 8px 32px rgba(0,0,0,0.5)`
          : "0 8px 32px rgba(0,0,0,0.4)",
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",
      }}
    >
      <SelectionToolbar />
      <NodeToggleButton value={disabled} onChange={setDisabled} className="absolute right-3 top-3 z-20" />
      <Handle type="target" position={Position.Top} style={{ ...hs, top: -7 }} />
      <Handle type="source" position={Position.Bottom} style={{ ...hs, bottom: -7 }} />
      <Handle type="source" position={Position.Left} id="false" style={{ ...hs, left: -7, top: "calc(50% + 16px)" }} />
      <Handle type="source" position={Position.Right} id="true" style={{ ...hs, right: -7, top: "calc(50% + 16px)" }} />
      <div className="flex items-center justify-between px-4 py-2 pr-14"
        style={{ background: color, borderRadius: "10px 10px 0 0" }}
      >
        <span className="text-sm font-bold text-white tracking-wide">If-Else</span>
        <svg className="w-5 h-5 text-white opacity-95" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </div>
      <div className="py-4 px-3 flex items-center justify-center">{children}</div>
      <div className="absolute text-xs text-[#9ca3af] font-semibold select-none" style={{ left: "-42px", top: "calc(50% + 16px)", transform: "translateY(-50%)" }}>False</div>
      <div className="absolute text-xs text-[#9ca3af] font-semibold select-none" style={{ right: "-38px", top: "calc(50% + 16px)", transform: "translateY(-50%)" }}>True</div>
    </motion.div>
  );
}

// Suppress unused import warning — AnimatePresence reserved for future node exit animations
void AnimatePresence;
