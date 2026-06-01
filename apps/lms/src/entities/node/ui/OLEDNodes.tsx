import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  BaseNode,
  NodeField,
  TextInput,
  SelectInput,
  ToggleInput,
  useNodeField,
  COLORS,
} from "./BaseNode";
import { DisplayIcon, ROTATE_OPTIONS } from "./_shared";
import { OLED } from "@/entities/board";
import { type AnimEntry, loadAnimRegistry } from "@/shared/lib/animRegistry";
import { useNodeActions } from "@/shared/context/NodeActionsContext";

// ─── Board hardware constants ──────────────────────────────────────────────────
const OLED_PINS = { scl: OLED.scl, sda: OLED.sda };

// ─── Portal Modal ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative flex flex-col rounded-2xl border border-[#2d2d35] shadow-2xl overflow-hidden"
        style={{
          background: "#0f0f12",
          width: wide ? "min(900px, 95vw)" : "min(600px, 95vw)",
          maxHeight: "90vh",
        }}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#1e1e24]">
          <span className="text-sm font-bold text-white">{title}</span>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-full text-zinc-500 hover:text-white hover:bg-zinc-700/60 transition-colors text-lg leading-none"
          >×</button>
        </div>
        <div className="overflow-y-auto flex-1 p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}

// ─── OLED pixel grid types ─────────────────────────────────────────────────────
type OLEDPixels = boolean[][];

function makeBlankOLED(w = 128, h = 32): OLEDPixels {
  return Array.from({ length: h }, () => Array(w).fill(false));
}

// ─── OLED Screen Designer ─────────────────────────────────────────────────────
function OLEDDesigner({
  pixels,
  onPixelsChange,
}: {
  pixels: OLEDPixels;
  onPixelsChange: (p: OLEDPixels) => void;
}) {
  const [tool, setTool] = useState<"draw" | "erase">("draw");
  const [drawing, setDrawing] = useState(false);
  const CELL = 4;
  const W = 128, H = 32;

  const toggle = useCallback((r: number, c: number, val: boolean) => {
    const next = pixels.map(row => [...row]);
    next[r][c] = val;
    onPixelsChange(next);
  }, [pixels, onPixelsChange]);

  const handleMouse = (e: React.MouseEvent<SVGSVGElement>, force?: boolean) => {
    if (!drawing && !force) return;
    const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const c = Math.floor(x / CELL), r = Math.floor(y / CELL);
    if (c >= 0 && c < W && r >= 0 && r < H) toggle(r, c, tool === "draw");
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        {(["draw", "erase"] as const).map(t => (
          <button key={t} onClick={() => setTool(t)}
            className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
              tool === t ? "bg-purple-600 border-purple-500 text-white" : "border-[#2d2d35] text-zinc-400 hover:border-zinc-500 bg-[#18181c]"
            }`}
          >{t === "draw" ? "✏ Draw" : "◻ Erase"}</button>
        ))}
        <div className="w-px h-5 bg-[#2d2d35] mx-1" />
        <button onClick={() => onPixelsChange(pixels.map(row => row.map(v => !v)))}
          className="px-3 py-1 rounded-lg text-xs font-bold border border-[#2d2d35] text-zinc-400 hover:border-zinc-500 bg-[#18181c]">⬛ Invert</button>
        <button onClick={() => onPixelsChange(makeBlankOLED())}
          className="px-3 py-1 rounded-lg text-xs font-bold border border-[#2d2d35] text-zinc-400 hover:text-red-400 hover:border-red-800 bg-[#18181c]">✕ Clear</button>
      </div>

      <div className="overflow-auto rounded-xl border border-[#2d2d35] bg-black" style={{ userSelect: "none" }}>
        <svg
          width={W * CELL} height={H * CELL}
          onMouseDown={e => {
            e.stopPropagation();
            setDrawing(true);
            handleMouse(e, true);
          }}
          onMouseMove={handleMouse}
          onMouseUp={() => setDrawing(false)}
          onMouseLeave={() => setDrawing(false)}
          style={{ display: "block", cursor: tool === "draw" ? "crosshair" : "cell", userSelect: "none" }}
        >
          {Array.from({ length: H + 1 }, (_, i) => (
            <line key={`h${i}`} x1={0} y1={i * CELL} x2={W * CELL} y2={i * CELL} stroke="#1a1a1a" strokeWidth="0.5" />
          ))}
          {Array.from({ length: W + 1 }, (_, i) => (
            <line key={`v${i}`} x1={i * CELL} y1={0} x2={i * CELL} y2={H * CELL} stroke="#1a1a1a" strokeWidth="0.5" />
          ))}
          {pixels.map((row, r) =>
            row.map((on, c) => on ? (
              <rect key={`${r}-${c}`} x={c * CELL + 0.5} y={r * CELL + 0.5}
                width={CELL - 1} height={CELL - 1} fill="#e0e0ff" rx="0.5" />
            ) : null)
          )}
        </svg>
      </div>
      <p className="text-[10px] text-zinc-600">128×32 preview (each row = 2 OLED rows → renders as 128×64). Click and drag to paint.</p>
    </div>
  );
}

// ─── GIF → OLED Converter ─────────────────────────────────────────────────────
function GIFConverter({ onFramesReady }: { onFramesReady: (frames: OLEDPixels[]) => void }) {
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState(0);
  const [fps, setFps] = useState(10);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    if (!file) return;
    setStatus("processing");
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 128; canvas.height = 32;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, 128, 32);
      const imageData = ctx.getImageData(0, 0, 128, 32);
      const pixGrid = makeBlankOLED();
      for (let r = 0; r < 32; r++) {
        for (let c = 0; c < 128; c++) {
          const idx = (r * 128 + c) * 4;
          const lum = imageData.data[idx] * 0.299 + imageData.data[idx + 1] * 0.587 + imageData.data[idx + 2] * 0.114;
          pixGrid[r][c] = lum < 128;
        }
      }
      const fc = file.type === "image/gif" ? Math.max(1, fps) : 1;
      const frames = Array.from({ length: fc }, () => pixGrid.map(row => [...row]));
      setFrameCount(frames.length);
      onFramesReady(frames);
      setStatus("done");
    };
    img.onerror = () => setStatus("error");
    img.src = url;
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        className="border-2 border-dashed border-[#3d3d45] rounded-xl flex flex-col items-center justify-center gap-2 py-8 cursor-pointer hover:border-purple-500/60 hover:bg-purple-500/5 transition-all"
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) processFile(f); }}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept="image/*,.gif" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <p className="text-sm text-zinc-400 font-medium">Drop image or GIF here</p>
        <p className="text-xs text-zinc-600">PNG · JPG · BMP · GIF — auto-converted to 128×64 mono</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-400 w-20">Playback FPS</span>
        <input type="range" min={1} max={30} step={1} value={fps}
          onChange={e => setFps(Number(e.target.value))} className="flex-1" style={{ accentColor: COLORS.purple }} />
        <span className="text-xs font-mono text-purple-400 w-10 text-right">{fps} fps</span>
      </div>
      {status === "processing" && <p className="text-xs text-zinc-400">Converting…</p>}
      {status === "done" && (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-green-500/20 bg-green-500/5">
          {previewUrl && <img src={previewUrl} alt="preview" className="w-16 h-8 object-cover rounded border border-[#2d2d35]" style={{ imageRendering: "pixelated" }} />}
          <div>
            <p className="text-xs font-bold text-green-400">Converted successfully</p>
            <p className="text-[11px] text-zinc-500">{frameCount} frame{frameCount !== 1 ? "s" : ""} · 128×64 · 1-bit mono</p>
          </div>
        </div>
      )}
      {status === "error" && <p className="text-xs text-red-400">Failed to read file. Try a different image.</p>}
    </div>
  );
}

// ─── Animation Designer ───────────────────────────────────────────────────────
function AnimationDesigner({ frames, onFramesChange }: {
  frames: OLEDPixels[]; onFramesChange: (f: OLEDPixels[]) => void;
}) {
  const [activeTab, setActiveTab] = useState<"frames" | "gif">("frames");
  const [selectedFrame, setSelectedFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [fps, setFps] = useState(10);
  const [playFrame, setPlayFrame] = useState(0);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPlay = () => {
    setPlaying(true); setPlayFrame(0);
    playRef.current = setInterval(() => setPlayFrame(f => (f + 1) % frames.length), 1000 / fps);
  };
  const stopPlay = () => { setPlaying(false); if (playRef.current) clearInterval(playRef.current); };

  const addFrame = () => { const n = [...frames, makeBlankOLED()]; onFramesChange(n); setSelectedFrame(n.length - 1); };
  const dupFrame = () => {
    const copy = frames[selectedFrame].map(r => [...r]);
    const n = [...frames.slice(0, selectedFrame + 1), copy, ...frames.slice(selectedFrame + 1)];
    onFramesChange(n); setSelectedFrame(selectedFrame + 1);
  };
  const delFrame = () => {
    if (frames.length <= 1) return;
    const n = frames.filter((_, i) => i !== selectedFrame);
    onFramesChange(n); setSelectedFrame(Math.min(selectedFrame, n.length - 1));
  };

  const CELL = 2, W = 128, H = 32;
  const renderMini = (px: OLEDPixels, scale = 1) => (
    <svg width={W * scale} height={H * scale} style={{ display: "block" }}>
      {px.map((row, r) => row.map((on, c) => on ? (
        <rect key={`${r}-${c}`} x={c * scale} y={r * scale} width={scale} height={scale} fill="#e0e0ff" />
      ) : null))}
    </svg>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 p-1 bg-[#18181c] rounded-xl border border-[#2d2d35] w-fit">
        {(["frames", "gif"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === tab ? "bg-purple-600 text-white" : "text-zinc-400 hover:text-white"}`}
          >{tab === "frames" ? "Frame Editor" : "GIF → Import"}</button>
        ))}
      </div>

      {activeTab === "gif" ? (
        <GIFConverter onFramesReady={f => { onFramesChange(f); setActiveTab("frames"); }} />
      ) : (
        <div className="flex gap-4">
          {/* Frame strip */}
          <div className="flex flex-col gap-2 w-28 flex-shrink-0">
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Frames ({frames.length})</span>
            <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-1">
              {frames.map((f, i) => (
                <button key={i} onClick={() => setSelectedFrame(i)}
                  className={`rounded-lg border overflow-hidden transition-all ${i === selectedFrame ? "border-purple-500" : "border-[#2d2d35] hover:border-[#3d3d45]"}`}
                  style={{ background: "#000", padding: 2 }}
                >
                  <div style={{ transform: `scale(${96 / 128})`, transformOrigin: "top left", width: 128, height: 32 }}>
                    {renderMini(f, 1)}
                  </div>
                  <div className="text-[8px] text-zinc-500 text-center py-0.5 bg-[#111114]">#{i + 1}</div>
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-1">
              <button onClick={addFrame} className="text-[10px] py-1 rounded-lg border border-[#2d2d35] text-zinc-400 hover:border-purple-500 hover:text-purple-400 bg-[#18181c] transition-all">+ Add</button>
              <button onClick={dupFrame} className="text-[10px] py-1 rounded-lg border border-[#2d2d35] text-zinc-400 hover:border-blue-500 hover:text-blue-400 bg-[#18181c] transition-all">⧉ Dup</button>
              <button onClick={delFrame} disabled={frames.length <= 1}
                className="text-[10px] py-1 rounded-lg border border-[#2d2d35] text-zinc-400 hover:border-red-500 hover:text-red-400 bg-[#18181c] transition-all disabled:opacity-30">✕ Del</button>
            </div>
          </div>

          {/* Editor + preview */}
          <div className="flex flex-col gap-3 flex-1 min-w-0">
            <OLEDDesigner pixels={frames[selectedFrame]}
              onPixelsChange={px => onFramesChange(frames.map((f, i) => i === selectedFrame ? px : f))} />
            <div className="flex flex-col gap-2 p-3 rounded-xl border border-[#2d2d35] bg-[#0a0a0d]">
              <div className="flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Preview</span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-zinc-600">{fps} fps</span>
                  <input type="range" min={1} max={30} value={fps}
                    onChange={e => setFps(Number(e.target.value))} className="w-16" style={{ accentColor: COLORS.purple }} />
                  <button onClick={playing ? stopPlay : startPlay}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${playing ? "bg-red-600/20 border border-red-500/40 text-red-400" : "bg-purple-600/20 border border-purple-500/40 text-purple-400"}`}
                  >{playing ? "⏹ Stop" : "▶ Play"}</button>
                </div>
              </div>
              <div className="flex justify-center bg-black rounded-lg p-2 border border-[#1a1a1a]">
                <div style={{ width: 128 * CELL, height: 32 * CELL, background: "#000" }}>
                  {renderMini(frames[playing ? playFrame : selectedFrame], CELL)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── OLED Display Node ────────────────────────────────────────────────────────
export function OLEDDisplayNode() {
  const [mode, setMode]     = useNodeField<"text" | "anim">("mode", "text");
  const [line1, setLine1]   = useNodeField<string>("line1", "Hello");
  const [line2, setLine2]   = useNodeField<string>("line2", "World!");
  const [animFile, setAnimFile] = useNodeField<string>("animFile", "");
  const [driver, setDriver] = useNodeField<boolean>("driver", false);

  const { deleteOLEDAnim } = useNodeActions();

  const [animList, setAnimList] = useState<AnimEntry[]>([]);
  const [search, setSearch] = useState("");

  // Reload registry whenever the component mounts or re-focuses
  const refreshList = useCallback(() => {
    setAnimList(loadAnimRegistry());
  }, []);

  useEffect(() => { refreshList(); }, [refreshList]);

  const filtered = search.trim()
    ? animList.filter(a => a.name.toLowerCase().includes(search.toLowerCase()))
    : animList;

  const selected = animList.find(a => a.name === animFile);

  return (
    <>
      <BaseNode title="OLED Display" color={COLORS.purple} icon={<DisplayIcon />} width="250px">
        {/* Fixed port info */}
        <div className="mx-3 mb-2 px-2.5 py-1.5 rounded-lg border border-[#2d2d35] bg-[#111116]">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Dedicated I2C Port</span>
            <span className="text-[9px] font-mono text-purple-400">fixed</span>
          </div>
          <div className="flex gap-3 mt-0.5">
            <span className="text-[10px] text-zinc-500">SCL <span className="text-zinc-300 font-mono">{OLED_PINS.scl}</span></span>
            <span className="text-[10px] text-zinc-500">SDA <span className="text-zinc-300 font-mono">{OLED_PINS.sda}</span></span>
          </div>
        </div>

        {/* Mode toggle */}
        <NodeField label="Mode">
          <div className="flex gap-1 w-full">
            <button onClick={() => setMode("text")}
              className={`nodrag flex-1 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                mode === "text"
                  ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                  : "text-zinc-500 border-[#2a2a35] hover:text-zinc-300"
              }`}>
              📝 Text
            </button>
            <button onClick={() => setMode("anim")}
              className={`nodrag flex-1 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                mode === "anim"
                  ? "bg-blue-500/20 text-blue-300 border-blue-500/40"
                  : "text-zinc-500 border-[#2a2a35] hover:text-zinc-300"
              }`}>
              🎬 Animation
            </button>
          </div>
        </NodeField>

        {mode === "text" ? (
          <>
            <NodeField label="Line 1"><TextInput value={line1} onChange={setLine1} /></NodeField>
            <NodeField label="Line 2"><TextInput value={line2} onChange={setLine2} /></NodeField>
          </>
        ) : (
          <div className="px-3 pb-1.5">
            {/* Search */}
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Search animations..."
              className="nodrag w-full text-[10px] bg-[#111116] border border-[#2d2d35] rounded-lg px-2 py-1.5 text-zinc-300 placeholder-zinc-600 outline-none focus:border-purple-500/50 mb-1.5"
            />

            {animList.length === 0 ? (
              <div className="rounded-lg border border-dashed border-[#2d2d35] p-3 text-center">
                <p className="text-[10px] text-zinc-600 leading-relaxed">
                  No animations saved yet.<br />
                  <span className="text-purple-500">OLED Designer → Save to Library</span>
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-[10px] text-zinc-600 py-2 text-center">No matches for "{search}"</p>
            ) : (
              <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto">
                {filtered.map(anim => (
                  <div key={anim.name}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded-lg border text-[10px] transition-all ${
                      animFile === anim.name
                        ? "bg-purple-500/20 border-purple-500/40"
                        : "border-transparent hover:bg-white/5"
                    }`}>
                    <button className="nodrag flex-1 text-left min-w-0" onClick={() => setAnimFile(anim.name)}>
                      <span className={`font-semibold truncate block ${animFile === anim.name ? "text-purple-300" : "text-zinc-300"}`}>
                        {anim.name}
                      </span>
                      <span className="text-zinc-600 text-[9px]">
                        {anim.frameCount}f · {anim.fps}fps
                        {anim.onDevice && <span className="text-emerald-500 ml-1">● on device</span>}
                      </span>
                    </button>
                    <button
                      onClick={async () => {
                        if (animFile === anim.name) setAnimFile("");
                        await deleteOLEDAnim(anim.name);
                        refreshList();
                      }}
                      className="nodrag p-1 rounded text-zinc-700 hover:text-red-400 transition-colors flex-shrink-0"
                      title="Remove from library and device"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}

            {selected && (
              <div className="mt-1.5 px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <p className="text-[9px] text-purple-400 font-mono">/anim/{selected.name}.bin</p>
              </div>
            )}
          </div>
        )}

        <NodeField label="Driver">
          <ToggleInput value={driver} onChange={setDriver} leftLabel="SH1106" rightLabel="SSD1306" />
        </NodeField>
      </BaseNode>
    </>
  );
}

// ─── Play Animation ───────────────────────────────────────────────────────────
export function PlayAnimationNode() {
  const [driver, setDriver] = useNodeField<boolean>("driver", false);
  const [rotate, setRotate] = useNodeField<string>("rotate", "0");
  const [folder, setFolder] = useNodeField<string>("folder", "animation");
  return (
    <BaseNode title="Play Animation" color={COLORS.purple} icon={<DisplayIcon />} width="230px">
      {/* Uses dedicated OLED port — pins fixed */}
      <div className="mx-3 mb-1 px-2.5 py-1.5 rounded-lg border border-[#2d2d35] bg-[#111116]">
        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">OLED Dedicated Port</span>
        <div className="flex gap-3 mt-0.5">
          <span className="text-[10px] text-zinc-500">SCL <span className="text-zinc-300 font-mono">{OLED_PINS.scl}</span></span>
          <span className="text-[10px] text-zinc-500">SDA <span className="text-zinc-300 font-mono">{OLED_PINS.sda}</span></span>
        </div>
      </div>
      <NodeField label="Driver"><ToggleInput value={driver} onChange={setDriver} leftLabel="SH1106" rightLabel="SSD1306" /></NodeField>
      <NodeField label="Rotate"><SelectInput value={rotate} onChange={setRotate} options={ROTATE_OPTIONS} compact /></NodeField>
      <NodeField label="Folder name"><TextInput value={folder} onChange={setFolder} /></NodeField>
    </BaseNode>
  );
}

// ─── Show Image ───────────────────────────────────────────────────────────────
export function ShowImageNode() {
  const [driver, setDriver] = useNodeField<boolean>("driver", false);
  const [rotate, setRotate] = useNodeField<string>("rotate", "0");
  const [imageFile, setImageFile] = useNodeField<string>("imageFile", "image.pbm");
  return (
    <BaseNode title="Show Image" color={COLORS.purple} icon={<DisplayIcon />} width="220px">
      <div className="mx-3 mb-1 px-2.5 py-1.5 rounded-lg border border-[#2d2d35] bg-[#111116]">
        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">OLED Dedicated Port</span>
        <div className="flex gap-3 mt-0.5">
          <span className="text-[10px] text-zinc-500">SCL <span className="text-zinc-300 font-mono">{OLED_PINS.scl}</span></span>
          <span className="text-[10px] text-zinc-500">SDA <span className="text-zinc-300 font-mono">{OLED_PINS.sda}</span></span>
        </div>
      </div>
      <NodeField label="Driver"><ToggleInput value={driver} onChange={setDriver} leftLabel="SH1106" rightLabel="SSD1306" /></NodeField>
      <NodeField label="Rotate"><SelectInput value={rotate} onChange={setRotate} options={ROTATE_OPTIONS} compact /></NodeField>
      <NodeField label="Image file"><TextInput value={imageFile} onChange={setImageFile} /></NodeField>
    </BaseNode>
  );
}
