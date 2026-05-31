import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  BaseNode,
  NodeField,
  TextInput,
  NumberInput,
  SelectInput,
  ToggleInput,
  useNodeField,
  COLORS,
} from "./BaseNode";

// ─── Board hardware constants ──────────────────────────────────────────────────
const OLED_PINS = { scl: 36, sda: 35 };

function DisplayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  );
}

const PORT_OPTIONS = [
  { label: "Port 1", value: "1" },
  { label: "Port 2", value: "2" },
  { label: "Port 3", value: "3" },
];

const ROTATE_OPTIONS = [
  { label: "0°", value: "0" },
  { label: "90°", value: "90" },
  { label: "180°", value: "180" },
  { label: "270°", value: "270" },
];

// ─── Inline pin info badge ─────────────────────────────────────────────────────
function PinInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-0.5">
      <span className="text-xs text-[#9ca3af] font-medium">{label}</span>
      <span className="text-[10px] font-mono text-zinc-500 bg-[#1a1a20] border border-[#2d2d35] px-1.5 py-0.5 rounded">
        {value}
      </span>
    </div>
  );
}

// ─── Portal Modal ─────────────────────────────────────────────────────────────
// Renders into document.body so React event bubbling doesn't reach the node,
// which is what caused the "node moves instead of drawing" bug.
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
            e.stopPropagation(); // prevent ReactFlow node drag
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
  const [address, setAddress] = useNodeField<string>("address", "0x3C");
  const [resolution, setResolution] = useNodeField<string>("resolution", "128x64");
  const [driver, setDriver] = useNodeField<boolean>("driver", false);
  const [rotate, setRotate] = useNodeField<string>("rotate", "0");
  const [line1, setLine1] = useNodeField<string>("line1", "");
  const [line2, setLine2] = useNodeField<string>("line2", "");
  const [staticPixels, setStaticPixels] = useNodeField<OLEDPixels>("staticPixels", makeBlankOLED());
  const [animFrames, setAnimFrames] = useNodeField<OLEDPixels[]>("animFrames", [makeBlankOLED()]);

  const [showDesigner, setShowDesigner] = useState(false);
  const [showAnimDesigner, setShowAnimDesigner] = useState(false);
  const [showGIFConverter, setShowGIFConverter] = useState(false);

  const CELL = 2, W = 128, H = 32;
  const hasContent = staticPixels.some(row => row.some(v => v));

  return (
    <>
      <BaseNode title="OLED Display" color={COLORS.purple} icon={<DisplayIcon />} width="270px">
        {/* Fixed port info — pins are hardwired on the Kokoon board */}
        <div className="mx-3 mb-1 px-2.5 py-1.5 rounded-lg border border-[#2d2d35] bg-[#111116]">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Dedicated I2C Port</span>
            <span className="text-[9px] font-mono text-purple-400">fixed</span>
          </div>
          <div className="flex gap-3 mt-0.5">
            <span className="text-[10px] text-zinc-500">SCL <span className="text-zinc-300 font-mono">{OLED_PINS.scl}</span></span>
            <span className="text-[10px] text-zinc-500">SDA <span className="text-zinc-300 font-mono">{OLED_PINS.sda}</span></span>
          </div>
        </div>

        <NodeField label="I2C Address">
          <SelectInput value={address} onChange={setAddress} compact
            options={[{ label: "0x3C (default)", value: "0x3C" }, { label: "0x3D (alt)", value: "0x3D" }]} />
        </NodeField>
        <NodeField label="Resolution">
          <SelectInput value={resolution} onChange={setResolution} compact
            options={[{ label: "128×64", value: "128x64" }, { label: "128×32", value: "128x32" }]} />
        </NodeField>
        <NodeField label="Driver">
          <ToggleInput value={driver} onChange={setDriver} leftLabel="SH1106" rightLabel="SSD1306" />
        </NodeField>
        <NodeField label="Rotate">
          <SelectInput value={rotate} onChange={setRotate} options={ROTATE_OPTIONS} compact />
        </NodeField>

        {/* Sensor display bindings */}
        <div className="px-3 pt-2 pb-0.5">
          <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Sensor Display</span>
        </div>
        <NodeField label="Line 1"><TextInput value={line1} onChange={setLine1} wide /></NodeField>
        <NodeField label="Line 2"><TextInput value={line2} onChange={setLine2} wide /></NodeField>

        {/* Static pixel preview */}
        {hasContent && (
          <div className="px-3 pb-1">
            <div className="rounded-lg border border-[#2d2d35] overflow-hidden bg-black p-1 flex justify-center">
              <svg width={W * CELL} height={H * CELL} style={{ imageRendering: "pixelated" }}>
                {staticPixels.map((row, r) => row.map((on, c) => on ? (
                  <rect key={`${r}-${c}`} x={c * CELL} y={r * CELL} width={CELL} height={CELL} fill="#d0d0ff" />
                ) : null))}
              </svg>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="px-3 pb-2 flex flex-col gap-1.5">
          <button onClick={() => setShowDesigner(true)}
            className="nodrag w-full flex items-center justify-center gap-2 py-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 text-xs font-bold transition-all">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 9 6 6m0-6-6 6"/>
            </svg>
            Open OLED Designer
          </button>
          <button onClick={() => setShowAnimDesigner(true)}
            className="nodrag w-full flex items-center justify-center gap-2 py-1.5 rounded-lg border border-blue-500/40 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-bold transition-all">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Animation Designer
          </button>
          <button onClick={() => setShowGIFConverter(true)}
            className="nodrag w-full flex items-center justify-center gap-2 py-1.5 rounded-lg border border-orange-500/40 bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 text-xs font-bold transition-all">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            GIF → OLED Converter
          </button>
        </div>
      </BaseNode>

      {showDesigner && (
        <Modal title="OLED Designer — 128×64 Static Screen" onClose={() => setShowDesigner(false)} wide>
          <OLEDDesigner pixels={staticPixels} onPixelsChange={setStaticPixels} />
        </Modal>
      )}
      {showAnimDesigner && (
        <Modal title="OLED Animation Designer" onClose={() => setShowAnimDesigner(false)} wide>
          <AnimationDesigner frames={animFrames} onFramesChange={setAnimFrames} />
        </Modal>
      )}
      {showGIFConverter && (
        <Modal title="GIF → OLED Converter" onClose={() => setShowGIFConverter(false)}>
          <GIFConverter onFramesReady={frames => { setAnimFrames(frames); setShowGIFConverter(false); }} />
        </Modal>
      )}
    </>
  );
}

// ─── 5×8 Custom LCD Character Editor ─────────────────────────────────────────
type LCDCharPixels = boolean[][];
function makeBlankChar(): LCDCharPixels { return Array.from({ length: 8 }, () => Array(5).fill(false)); }

function CharEditor({ pixels, onChange }: { pixels: LCDCharPixels; onChange: (p: LCDCharPixels) => void }) {
  const [drawing, setDrawing] = useState(false);
  const [drawVal, setDrawVal] = useState(true);
  const CELL = 20;

  const toggle = (r: number, c: number, val: boolean) => {
    const next = pixels.map(row => [...row]);
    next[r][c] = val;
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2">
      <svg width={5 * CELL} height={8 * CELL}
        style={{ display: "block", cursor: "crosshair", userSelect: "none" }}
        onMouseDown={e => {
          e.stopPropagation();
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const c = Math.floor((e.clientX - rect.left) / CELL);
          const r = Math.floor((e.clientY - rect.top) / CELL);
          const val = !pixels[r]?.[c];
          setDrawVal(val); setDrawing(true);
          toggle(r, c, val);
        }}
        onMouseMove={e => {
          if (!drawing) return;
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const c = Math.floor((e.clientX - rect.left) / CELL);
          const r = Math.floor((e.clientY - rect.top) / CELL);
          if (r >= 0 && r < 8 && c >= 0 && c < 5) toggle(r, c, drawVal);
        }}
        onMouseUp={() => setDrawing(false)}
        onMouseLeave={() => setDrawing(false)}
      >
        {Array.from({ length: 9 }, (_, i) => <line key={`h${i}`} x1={0} y1={i * CELL} x2={5 * CELL} y2={i * CELL} stroke="#2d2d35" strokeWidth="1" />)}
        {Array.from({ length: 6 }, (_, i) => <line key={`v${i}`} x1={i * CELL} y1={0} x2={i * CELL} y2={8 * CELL} stroke="#2d2d35" strokeWidth="1" />)}
        {pixels.map((row, r) => row.map((on, c) => (
          <rect key={`${r}-${c}`} x={c * CELL + 1} y={r * CELL + 1} width={CELL - 2} height={CELL - 2}
            fill={on ? "#60a5fa" : "#111116"} rx="2" />
        )))}
      </svg>
      <button onClick={() => onChange(makeBlankChar())} className="text-[10px] text-zinc-500 hover:text-red-400 transition-colors text-center">Clear</button>
    </div>
  );
}

// ─── 16×2 LCD Grid Designer ───────────────────────────────────────────────────
function LCD16x2Grid({ lines, onLinesChange }: { lines: [string, string]; onLinesChange: (l: [string, string]) => void }) {
  const COLS = 16;
  const chars = lines.map(l => l.padEnd(COLS, " ").slice(0, COLS).split(""));
  const setChar = (row: number, col: number, ch: string) => {
    const newLines: [string, string] = [...lines] as [string, string];
    const arr = newLines[row].padEnd(COLS, " ").split("");
    arr[col] = ch || " ";
    newLines[row] = arr.join("");
    onLinesChange(newLines);
  };

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Character Grid — click any cell to type</span>
      <div className="inline-flex flex-col gap-px rounded-lg overflow-hidden border border-[#2d2d35] bg-[#0a1a0a]">
        {[0, 1].map(row => (
          <div key={row} className="flex gap-px">
            {Array.from({ length: COLS }, (_, col) => {
              const ch = chars[row][col] || " ";
              return (
                <div key={col}
                  className="w-7 h-7 flex items-center justify-center text-[11px] font-mono text-green-300 bg-[#0a1a0a] hover:bg-[#0d2a0d] border border-[#1a2a1a] cursor-text transition-colors"
                  contentEditable suppressContentEditableWarning
                  onKeyDown={e => {
                    e.preventDefault();
                    if (e.key === "Backspace") { setChar(row, col, " "); return; }
                    if (e.key.length === 1) setChar(row, col, e.key);
                  }}
                  style={{ outline: "none" }}
                >
                  {ch === " " ? <span className="text-[#1a3a1a]">·</span> : ch}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-1.5 mt-1">
        {([0, 1] as const).map(i => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[9px] text-zinc-500 w-10">Line {i + 1}</span>
            <input value={lines[i]} maxLength={16}
              onChange={e => { const l: [string, string] = [...lines] as [string, string]; l[i] = e.target.value; onLinesChange(l); }}
              className="flex-1 bg-[#111116] border border-[#2d2d35] rounded-lg px-2 py-1 text-xs font-mono text-green-300 outline-none focus:border-blue-500/60"
              placeholder={`Line ${i + 1} text…`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 16×2 LCD Node ────────────────────────────────────────────────────────────
export function LCD16x2Node() {
  const [mode, setMode] = useNodeField<string>("mode", "i2c");
  const [address, setAddress] = useNodeField<string>("address", "0x27");
  const [sensorPort, setSensorPort] = useNodeField<string>("sensorPort", "1");
  const [line1, setLine1] = useNodeField<string>("line1", "Hello");
  const [line2, setLine2] = useNodeField<string>("line2", "World");
  const [cursorBlink, setCursorBlink] = useNodeField<boolean>("cursorBlink", false);
  const [cursorUnderline, setCursorUnderline] = useNodeField<boolean>("cursorUnderline", false);
  const [backlight, setBacklight] = useNodeField<boolean>("backlight", true);
  const [formatStr, setFormatStr] = useNodeField<string>("formatStr", "Dist: {v} cm");
  const [customChars, setCustomChars] = useNodeField<LCDCharPixels[]>("customChars",
    Array.from({ length: 8 }, makeBlankChar));

  const [showGrid, setShowGrid] = useState(false);
  const [showCharEditor, setShowCharEditor] = useState(false);
  const [activeChar, setActiveChar] = useState(0);

  const previewLines: [string, string] = [line1.slice(0, 16).padEnd(16, " "), line2.slice(0, 16).padEnd(16, " ")];

  // Port → GPIO mapping (I2C lines)
  const PORT_PINS: Record<string, { scl: number; sda: number }> = {
    "1": { scl: 4, sda: 5 },
    "2": { scl: 1, sda: 2 },
  };
  const pins = PORT_PINS[sensorPort] ?? { scl: 4, sda: 5 };

  return (
    <>
      <BaseNode title="16×2 LCD" color={COLORS.blue} icon={<DisplayIcon />} width="270px">
        <NodeField label="Mode">
          <SelectInput value={mode} onChange={setMode} compact
            options={[{ label: "I2C", value: "i2c" }, { label: "Parallel 4-bit", value: "parallel" }]} />
        </NodeField>
        {mode === "i2c" && <>
          <NodeField label="I2C Address">
            <SelectInput value={address} onChange={setAddress} compact
              options={[{ label: "0x27 (default)", value: "0x27" }, { label: "0x3F (alt)", value: "0x3F" }]} />
          </NodeField>
          <NodeField label="Sensor Port">
            <SelectInput value={sensorPort} onChange={setSensorPort} compact
              options={[{ label: "Port 1 (SCL 4 / SDA 5)", value: "1" }, { label: "Port 2 (SCL 1 / SDA 2)", value: "2" }]} />
          </NodeField>
          <PinInfo label="SCL / SDA" value={`GPIO ${pins.scl} / ${pins.sda}`} />
        </>}

        {/* Mini LCD preview */}
        <div className="px-3 py-1">
          <div className="rounded-lg border border-[#2a3a2a] bg-[#0a1a0a] px-2 py-1.5">
            {previewLines.map((line, i) => (
              <div key={i} className="flex">
                {line.split("").map((ch, j) => (
                  <span key={j} className="text-[10px] leading-4 text-green-300 font-mono w-[9px] text-center">
                    {ch === " " ? " " : ch}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <NodeField label="Cursor Blink"><ToggleInput value={cursorBlink} onChange={setCursorBlink} leftLabel="Off" rightLabel="On" /></NodeField>
        <NodeField label="Underline"><ToggleInput value={cursorUnderline} onChange={setCursorUnderline} leftLabel="Off" rightLabel="On" /></NodeField>
        <NodeField label="Backlight"><ToggleInput value={backlight} onChange={setBacklight} leftLabel="Off" rightLabel="On" /></NodeField>

        <div className="px-3 pt-2 pb-0.5">
          <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Sensor Format String</span>
        </div>
        <div className="px-3 pb-1.5">
          <input value={formatStr} onChange={e => setFormatStr(e.target.value)}
            className="nodrag w-full bg-[#111116] border border-[#2d2d35] rounded-lg px-2 py-1 text-[11px] font-mono text-green-300 outline-none focus:border-blue-500/60"
            placeholder="e.g. Dist: {v} cm" />
          <p className="text-[9px] text-zinc-600 mt-1">Use <span className="font-mono text-zinc-400">{"{v}"}</span> for live sensor value</p>
        </div>

        <div className="px-3 pb-2 flex flex-col gap-1.5">
          <button onClick={() => setShowGrid(true)}
            className="nodrag w-full flex items-center justify-center gap-2 py-1.5 rounded-lg border border-blue-500/40 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-bold transition-all">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            16×2 Grid Designer
          </button>
          <button onClick={() => setShowCharEditor(true)}
            className="nodrag w-full flex items-center justify-center gap-2 py-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 text-xs font-bold transition-all">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            Custom Chars (8 slots · 5×8px)
          </button>
        </div>
      </BaseNode>

      {showGrid && (
        <Modal title="16×2 LCD Grid Designer" onClose={() => setShowGrid(false)} wide>
          <LCD16x2Grid lines={[line1, line2]} onLinesChange={([l1, l2]) => { setLine1(l1); setLine2(l2); }} />
        </Modal>
      )}

      {showCharEditor && (
        <Modal title="Custom Character Editor — 8 Slots (5×8 pixels each)" onClose={() => setShowCharEditor(false)} wide>
          <div className="flex gap-6">
            <div className="flex flex-col gap-2 w-28 flex-shrink-0">
              <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Slots</span>
              {customChars.map((ch, i) => (
                <button key={i} onClick={() => setActiveChar(i)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left transition-all ${i === activeChar ? "border-purple-500 bg-purple-500/10" : "border-[#2d2d35] hover:border-[#3d3d45] bg-[#111114]"}`}
                >
                  <div className="w-3 h-3 rounded-sm border border-[#2d2d35] flex-shrink-0"
                    style={{ background: ch.some(r => r.some(v => v)) ? COLORS.blue : "transparent" }} />
                  <span className="text-[10px] text-zinc-400">Char {i}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <div className="text-xs text-zinc-400 font-bold">Editing Slot {activeChar}</div>
              <CharEditor pixels={customChars[activeChar]}
                onChange={px => setCustomChars(customChars.map((c, i) => i === activeChar ? px : c))} />
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-zinc-500">2× Preview</span>
                <div className="inline-block bg-[#0a1a0a] p-2 rounded-lg border border-[#2a3a2a]">
                  <svg width={5 * 8} height={8 * 8} style={{ imageRendering: "pixelated" }}>
                    {customChars[activeChar].map((row, r) => row.map((on, c) => (
                      <rect key={`${r}-${c}`} x={c * 8} y={r * 8} width={7} height={7} fill={on ? "#4ade80" : "#0a1a0a"} />
                    )))}
                  </svg>
                </div>
              </div>
              <p className="text-[10px] text-zinc-600">Loaded into CGRAM slot {activeChar} on startup.</p>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

// ─── 7-Seg Display TM1637 ─────────────────────────────────────────────────────
export function SevenSegNode() {
  const [port, setPort] = useNodeField<string>("port", "1");
  const [dio, setDio] = useNodeField<number>("dio", 18);
  const [clk, setClk] = useNodeField<number>("clk", 17);
  const [number, setNumber] = useNodeField<number>("number", 1234);
  const [colon, setColon] = useNodeField<boolean>("colon", false);
  return (
    <BaseNode title="7-Seg Display TM1637" color={COLORS.red} icon={<DisplayIcon />} width="230px">
      <NodeField label="Port"><SelectInput value={port} onChange={setPort} options={PORT_OPTIONS} compact /></NodeField>
      <NodeField label="DIO Pin"><NumberInput value={dio} onChange={setDio} /></NodeField>
      <NodeField label="CLK Pin"><NumberInput value={clk} onChange={setClk} /></NodeField>
      <NodeField label="Number"><NumberInput value={number} onChange={setNumber} /></NodeField>
      <NodeField label="Colon"><ToggleInput value={colon} onChange={setColon} leftLabel="0" rightLabel="1" /></NodeField>
    </BaseNode>
  );
}

// ─── MAX7219 8×8 Matrix ───────────────────────────────────────────────────────
export function MAX7219Node() {
  const [port, setPort] = useNodeField<string>("port", "1");
  const [din, setDin] = useNodeField<number>("din", 5);
  const [cs, setCs] = useNodeField<number>("cs", 6);
  const [clk, setClk] = useNodeField<number>("clk", 7);
  const [matrices, setMatrices] = useNodeField<number>("matrices", 1);
  const [brightness, setBrightness] = useNodeField<number>("brightness", 8);
  const [text, setText] = useNodeField<string>("text", "HI");
  return (
    <BaseNode title="MAX7219 8×8 Matrix" color={COLORS.blue} icon={<DisplayIcon />} width="220px">
      <NodeField label="Port"><SelectInput value={port} onChange={setPort} options={PORT_OPTIONS} compact /></NodeField>
      <NodeField label="DIN Pin"><NumberInput value={din} onChange={setDin} /></NodeField>
      <NodeField label="CS Pin"><NumberInput value={cs} onChange={setCs} /></NodeField>
      <NodeField label="CLK Pin"><NumberInput value={clk} onChange={setClk} /></NodeField>
      <NodeField label="Matrices"><NumberInput value={matrices} onChange={setMatrices} /></NodeField>
      <NodeField label="Brightness"><NumberInput value={brightness} onChange={setBrightness} /></NodeField>
      <NodeField label="Text"><TextInput value={text} onChange={setText} /></NodeField>
    </BaseNode>
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
