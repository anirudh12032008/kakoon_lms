import { useState, useEffect } from "react";
import {
  BaseNode,
  NodeField,
  NumberInput,
  useNodeField,
  COLORS,
} from "./BaseNode";
import { DisplayIcon } from "./_shared";
import { MATRIX } from "@/entities/board";
import { useNodeActions } from "@/shared/context/NodeActionsContext";

/** Animated live preview of matrix frame data inside the node */
function MatrixMiniPreview({
  frames, fps, modules,
}: {
  frames: number[][], fps: number, modules: number
}) {
  const [fi, setFi] = useState(0);
  const W = modules * 8;

  useEffect(() => {
    if (frames.length <= 1) { setFi(0); return; }
    const id = setInterval(() => setFi(p => (p + 1) % frames.length), 1000 / fps);
    return () => clearInterval(id);
  }, [frames.length, fps]);

  const frame = frames[fi % frames.length] ?? frames[0];
  // Cell size shrinks as module count grows to fit in node width (~230px)
  const cell = modules >= 3 ? 5 : modules === 2 ? 7 : 9;

  return (
    <div className="mx-3 mb-1 p-2 rounded-xl bg-[#080805] border border-[#2a2010] flex flex-col items-center">
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${W}, ${cell}px)`, gap: 1 }}>
        {Array.from({ length: 8 * W }, (_, i) => {
          const on = frame[i];
          return (
            <div key={i} style={{
              width: cell, height: cell,
              background: on ? "#fbbf24" : "#1a1208",
              boxShadow: on ? `0 0 ${cell}px #fbbf2488` : "none",
              borderRadius: 1,
            }} />
          );
        })}
      </div>
      <div className="flex items-center justify-between w-full mt-1.5 px-0.5">
        <span className="text-[8px] text-amber-700 font-mono">{modules}×8×8</span>
        {frames.length > 1 && (
          <span className="text-[8px] text-amber-600 font-mono">
            {fi + 1}/{frames.length} · {fps}fps
          </span>
        )}
      </div>
    </div>
  );
}

export function MAX7219Node() {
  const { openMatrixDesigner: onOpenDesigner } = useNodeActions();
  const [modules, setModules]       = useNodeField<number>("modules", 1);
  const [brightness, setBrightness] = useNodeField<number>("brightness", 8);
  const [fps, setFps]               = useNodeField<number>("fps", 8);
  const [sck, setSck]               = useNodeField<number>("sck",  MATRIX.sck);
  const [mosi, setMosi]             = useNodeField<number>("mosi", MATRIX.mosi);
  const [cs, setCs]                 = useNodeField<number>("cs",   MATRIX.cs);
  const [matrixFrames]              = useNodeField<number[][]>("matrixFrames", []);
  const [designName]                = useNodeField<string>("designName", "");

  const hasDesign = matrixFrames && matrixFrames.length > 0;

  return (
    <BaseNode title="MAX7219 8×8 Matrix" color={COLORS.blue} icon={<DisplayIcon />} width="240px">

      {/* SPI pins — editable, using MAX7219 silk-screen names */}
      <NodeField label="CLK Pin"><NumberInput value={sck}  onChange={setSck}  /></NodeField>
      <NodeField label="DIN Pin"><NumberInput value={mosi} onChange={setMosi} /></NodeField>
      <NodeField label="CS Pin"><NumberInput  value={cs}   onChange={setCs}   /></NodeField>

      {/* Live preview OR empty state */}
      {hasDesign ? (
        <>
          {/* Design name badge */}
          <div className="mx-3 mb-1 flex items-center gap-2">
            <span className="text-[9px] font-bold text-amber-400 truncate">{designName || "Custom Design"}</span>
            <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/25 text-amber-500">
              {matrixFrames.length} frame{matrixFrames.length !== 1 ? "s" : ""}
            </span>
          </div>
          <MatrixMiniPreview frames={matrixFrames} fps={fps} modules={modules} />
        </>
      ) : (
        /* Empty state — invite the user to open the designer */
        <div className="mx-3 mb-2 flex flex-col items-center gap-2 py-3 rounded-xl border border-dashed border-[#2a2a35] bg-[var(--k-base-100)]">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <span className="text-xl">💡</span>
          </div>
          <p className="text-[9px] text-zinc-500 text-center px-3 leading-relaxed">
            No pattern yet.<br />Design one in the Matrix Designer.
          </p>
          {onOpenDesigner && (
            <button
              onClick={onOpenDesigner}
              className="nodrag px-3 py-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-[9px] font-bold text-blue-400 hover:bg-blue-500/25 transition-all"
            >
              ✏️ Open Matrix Designer
            </button>
          )}
        </div>
      )}

      {/* Controls */}
      <NodeField label="Modules">
        <div className="flex gap-1">
          {[1, 2, 3, 4].map(n => (
            <button key={n} onClick={() => setModules(n)}
              className={`nodrag flex-1 py-1 text-[9px] font-bold rounded transition-all ${n === modules ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "text-zinc-500 border border-[var(--k-border)] hover:text-zinc-300"}`}>
              {n}
            </button>
          ))}
        </div>
      </NodeField>

      <div className="px-3 py-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[var(--k-muted)] font-medium">Brightness</span>
          <span className="text-[10px] font-mono text-blue-400">{brightness}/15</span>
        </div>
        <input type="range" min={0} max={15} value={brightness}
          onChange={e => setBrightness(Number(e.target.value))}
          className="nodrag w-full h-1 cursor-pointer" style={{ accentColor: COLORS.blue }} />
      </div>

      {hasDesign && (
        <div className="px-3 py-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[var(--k-muted)] font-medium">Speed</span>
            <span className="text-[10px] font-mono text-amber-400">{fps} fps</span>
          </div>
          <input type="range" min={1} max={30} value={fps}
            onChange={e => setFps(Number(e.target.value))}
            className="nodrag w-full h-1 cursor-pointer" style={{ accentColor: "#f59e0b" }} />
        </div>
      )}

      {/* Redesign button when design exists */}
      {hasDesign && onOpenDesigner && (
        <div className="px-3 pb-2">
          <button onClick={onOpenDesigner}
            className="nodrag w-full py-1.5 rounded-lg border border-[#2a2a35] text-[9px] font-bold text-zinc-500 hover:text-blue-400 hover:border-blue-500/30 transition-all">
            ✏️ Edit in Designer
          </button>
        </div>
      )}
    </BaseNode>
  );
}
