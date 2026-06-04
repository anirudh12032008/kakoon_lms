import { useState, useRef, useEffect } from "react";
import { Play, Pause, Copy, PlusCircle, Save, Trash2 } from "lucide-react";

function copyText(s: string) { navigator.clipboard.writeText(s).catch(() => {}); }

type RGB = [number, number, number];

const OFF: RGB = [0, 0, 0];

const PALETTE: RGB[] = [
  [255,0,0],[255,165,0],[255,255,0],[0,255,0],[0,255,255],
  [0,0,255],[128,0,255],[255,0,255],[255,255,255],[128,128,128],[0,0,0],
];

const NEOPIXEL_EFFECTS = [
  { id: "rainbow_wave", name: "🌈 Rainbow Wave" },
  { id: "pulse_red",    name: "❤️ Pulse Red" },
  { id: "chase_white",  name: "⚡ Chase White" },
  { id: "twinkle",      name: "✨ Twinkle" },
  { id: "fire",         name: "🔥 Fire" },
  { id: "ocean",        name: "🌊 Ocean" },
  { id: "police",       name: "🚓 Police" },
];

// 8-LED police strobe: blue half / red half with a sweeping grey "off" wipe
const B: RGB = [0, 0, 255], R: RGB = [255, 0, 0], G: RGB = [128, 128, 128];
const POLICE_FRAMES: RGB[][] = [
  [B, B, B, B, R, R, R, R],
  [G, B, B, B, R, R, R, G],
  [G, G, B, B, R, R, G, G],
  [G, G, G, B, R, G, G, G],
  [G, G, G, G, G, G, G, G],
  [G, G, G, B, R, G, G, G],
  [G, G, B, B, R, R, G, G],
  [G, B, B, B, R, R, R, G],
  [B, B, B, B, R, R, R, R],
];

// ─── Saved animations (localStorage) ──────────────────────────────────────────
const SAVED_KEY = "neopixel_saved_designs";
interface SavedDesign {
  id: string; name: string; mode: "strip" | "grid";
  ledCount: number; gridRows: number; gridCols: number;
  dataPin: number; fps: number; frames: RGB[][];
}
function loadSavedDesigns(): SavedDesign[] {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]"); }
  catch { return []; }
}
function persistSavedDesigns(designs: SavedDesign[]) {
  try { localStorage.setItem(SAVED_KEY, JSON.stringify(designs)); } catch { /* ignore quota */ }
}

function wheel(pos: number): RGB {
  pos = 255 - (pos % 256);
  if (pos < 85) return [255 - pos * 3, 0, pos * 3];
  if (pos < 170) { pos -= 85; return [0, pos * 3, 255 - pos * 3]; }
  pos -= 170; return [pos * 3, 255 - pos * 3, 0];
}

function buildEffectFrames(id: string, count: number): RGB[][] {
  switch (id) {
    case "rainbow_wave":
      return Array.from({ length: 16 }, (_, step) =>
        Array.from({ length: count }, (__, i) => wheel(((i * 256 / count) + step * 16) % 256)));
    case "pulse_red": {
      const steps = 16;
      return Array.from({ length: steps * 2 }, (_, s) => {
        const t = s < steps ? s / steps : 1 - (s - steps) / steps;
        return Array(count).fill([Math.round(255 * t), 0, 0] as RGB);
      });
    }
    case "chase_white":
      return Array.from({ length: count }, (_, head) =>
        Array.from({ length: count }, (__, i) => {
          const d = (i - head + count) % count;
          const b = Math.round(Math.max(0, 255 - d * 40));
          return [b, b, b] as RGB;
        }));
    case "twinkle": {
      const rng = (seed: number) => { let x = seed; x ^= x<<13; x ^= x>>17; x ^= x<<5; return x; };
      return Array.from({ length: 20 }, (_, f) =>
        Array.from({ length: count }, (__, i) => {
          const r = ((Math.abs(rng(i * 100 + f * 7)) % 256));
          return r > 180 ? [255,255,255] : [0,0,0];
        }) as RGB[]);
    }
    case "fire":
      return Array.from({ length: 20 }, (_, f) =>
        Array.from({ length: count }, (__, i) => {
          const heat = Math.max(0, 200 - i * 8 + (Math.sin(f * 0.7 + i * 0.3) * 40));
          return [Math.min(255, Math.round(heat * 2)), Math.min(255, Math.round(Math.max(0, heat - 100) * 3)), 0] as RGB;
        }));
    case "ocean":
      return Array.from({ length: 20 }, (_, f) =>
        Array.from({ length: count }, (__, i) => {
          const v = Math.round(((Math.sin((i + f) * 0.5) + 1) / 2) * 200);
          return [0, Math.round(v * 0.3), v] as RGB;
        }));
    case "police":
      // Map the 8-LED police pattern across whatever count is configured.
      return POLICE_FRAMES.map((frame) =>
        Array.from({ length: count }, (_, i) =>
          frame[Math.floor((i * frame.length) / count)] ?? OFF));
    default: return [Array(count).fill([0,0,0] as RGB)];
  }
}

function generateNeoPixelCode(ledCount: number, dataPin: number, frames: RGB[][], fps: number, name: string): string {
  const safeName = name.toLowerCase().replace(/\W+/g, "_");
  const header = `# NeoPixel — ${name}
from machine import Pin
import neopixel
_np_${safeName} = neopixel.NeoPixel(Pin(${dataPin}), ${ledCount})`;

  if (frames.length === 1) {
    const colors = frames[0].map((c) => `(${c.join(",")})`).join(", ");
    return `${header}
_colors = [${colors}]
for i, rgb in enumerate(_colors):
    _np_${safeName}[i] = rgb
_np_${safeName}.write()`;
  }
  const lines = [header, `import time`, `_frames_${safeName} = [`];
  frames.forEach((f) => {
    lines.push(`    [${f.map((c) => `(${c.join(",")})`).join(", ")}],`);
  });
  lines.push(`]`);
  lines.push(`while True:`);
  lines.push(`    for _frame in _frames_${safeName}:`);
  lines.push(`        for _i, _rgb in enumerate(_frame): _np_${safeName}[_i] = _rgb`);
  lines.push(`        _np_${safeName}.write()`);
  lines.push(`        time.sleep_ms(${Math.round(1000 / fps)})`);
  return lines.join("\n");
}

export function NeoPixelDesigner({ onAddNode }: { onAddNode?: (type: string, data: Record<string, unknown>) => void }) {
  const [ledCount, setLedCount] = useState(12);
  const [dataPin, setDataPin] = useState(48);
  const [mode, setMode] = useState<"strip" | "grid">("strip");
  const [gridRows, setGridRows] = useState(4);
  const [gridCols, setGridCols] = useState(8);
  const [frames, setFrames] = useState<RGB[][]>([Array.from({ length: 12 }, () => [0,0,0] as RGB)]);
  const [curFrame, setCurFrame] = useState(0);
  const [selectedColor, setSelectedColor] = useState<RGB>([255,0,0]);
  const [customHex, setCustomHex] = useState("#ff0000");
  const [fps, setFps] = useState(10);
  const [playing, setPlaying] = useState(false);
  const [playFrame, setPlayFrame] = useState(0);
  const [designName, setDesignName] = useState("MyEffect");
  const [copied, setCopied] = useState(false);
  const [addedToCanvas, setAddedToCanvas] = useState(false);
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>(() => loadSavedDesigns());
  const [justSaved, setJustSaved] = useState(false);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const effectiveLedCount = mode === "grid" ? gridRows * gridCols : ledCount;

  useEffect(() => {
    const newFrames = frames.map((f) => {
      const nf: RGB[] = Array.from({ length: effectiveLedCount }, (_, i) => f[i] ?? [0,0,0]);
      return nf;
    });
    setFrames(newFrames);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveLedCount]);

  useEffect(() => {
    if (playing) {
      playRef.current = setInterval(() => setPlayFrame((p) => p + 1), 1000 / fps);
    } else {
      if (playRef.current) clearInterval(playRef.current);
    }
    return () => { if (playRef.current) clearInterval(playRef.current); };
  }, [playing, fps]);

  const setLED = (i: number, color: RGB) => {
    setFrames((prev) => {
      const u = [...prev];
      const f = [...u[curFrame]];
      f[i] = color;
      u[curFrame] = f;
      return u;
    });
  };

  const loadEffect = (id: string) => {
    // Police is authored for an 8-LED strip — switch to that so it looks right.
    if (id === "police" && mode === "strip" && ledCount !== 8) setLedCount(8);
    const ef = buildEffectFrames(id, id === "police" && mode === "strip" ? 8 : effectiveLedCount);
    setFrames(ef);
    setCurFrame(0);
    setPlaying(false);
  };

  const saveDesign = () => {
    const design: SavedDesign = {
      id: `${Date.now()}`, name: designName, mode,
      ledCount, gridRows, gridCols, dataPin, fps,
      frames: frames.map((f) => f.map((c) => [...c] as RGB)),
    };
    setSavedDesigns((prev) => {
      // Overwrite a same-named design instead of piling up duplicates.
      const next = [...prev.filter((d) => d.name !== design.name), design];
      persistSavedDesigns(next);
      return next;
    });
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1500);
  };

  const loadDesign = (d: SavedDesign) => {
    setPlaying(false);
    setMode(d.mode);
    setLedCount(d.ledCount);
    setGridRows(d.gridRows);
    setGridCols(d.gridCols);
    setDataPin(d.dataPin);
    setFps(d.fps);
    setDesignName(d.name);
    setFrames(d.frames.map((f) => f.map((c) => [...c] as RGB)));
    setCurFrame(0);
  };

  const deleteDesign = (id: string) => {
    setSavedDesigns((prev) => {
      const next = prev.filter((d) => d.id !== id);
      persistSavedDesigns(next);
      return next;
    });
  };

  const displayFrame = playing ? frames[playFrame % frames.length] : frames[curFrame];
  const code = generateNeoPixelCode(effectiveLedCount, dataPin, frames, fps, designName);

  return (
    <div className="flex h-full">
      {/* Left: settings */}
      <div className="w-[160px] flex-shrink-0 border-r border-[#1a1a20] p-3 flex flex-col gap-3 overflow-y-auto">
        <div>
          <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1.5 font-bold">Mode</div>
          <div className="flex flex-col gap-1">
            {(["strip","grid"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)}
                className={`text-[10px] font-bold py-1.5 rounded-lg transition-all ${m === mode ? "bg-violet-500/20 text-violet-300 border border-violet-500/30" : "text-zinc-500 border border-transparent hover:bg-white/5"}`}>
                {m === "strip" ? "💡 LED Strip" : "⬜ LED Grid"}
              </button>
            ))}
          </div>
        </div>

        {mode === "strip" ? (
          <div>
            <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1 font-bold">LED Count</div>
            <input type="number" value={ledCount} min={1} max={64} onChange={(e) => setLedCount(+e.target.value)}
              className="w-full text-[10px] font-mono bg-[#0c0c10] border border-[#1e1e26] rounded px-2 py-1 text-white outline-none" />
          </div>
        ) : (
          <div className="flex gap-1.5">
            <div className="flex-1">
              <div className="text-[9px] text-zinc-600 mb-0.5">Rows</div>
              <input type="number" value={gridRows} min={1} max={16} onChange={(e) => setGridRows(+e.target.value)}
                className="w-full text-[10px] bg-[#0c0c10] border border-[#1e1e26] rounded px-1.5 py-1 text-white outline-none" />
            </div>
            <div className="flex-1">
              <div className="text-[9px] text-zinc-600 mb-0.5">Cols</div>
              <input type="number" value={gridCols} min={1} max={16} onChange={(e) => setGridCols(+e.target.value)}
                className="w-full text-[10px] bg-[#0c0c10] border border-[#1e1e26] rounded px-1.5 py-1 text-white outline-none" />
            </div>
          </div>
        )}

        <div>
          <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1 font-bold">Data Pin</div>
          <input type="number" value={dataPin} onChange={(e) => setDataPin(+e.target.value)}
            className="w-full text-[10px] font-mono bg-[#0c0c10] border border-[#1e1e26] rounded px-2 py-1 text-white outline-none" />
          <div className="text-[8px] text-zinc-600 mt-0.5">On-board ring = GPIO 48</div>
        </div>

        <div>
          <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1.5 font-bold">Color</div>
          <div className="grid grid-cols-4 gap-1 mb-2">
            {PALETTE.map((c, i) => (
              <button key={i} onClick={() => { setSelectedColor(c); setCustomHex(`#${c.map(v=>v.toString(16).padStart(2,'0')).join('')}`); }}
                className="w-full aspect-square rounded transition-all hover:scale-110"
                style={{ background: `rgb(${c.join(",")})`, outline: JSON.stringify(c) === JSON.stringify(selectedColor) ? "2px solid white" : "none" }} />
            ))}
          </div>
          <input type="color" value={customHex}
            onChange={(e) => {
              setCustomHex(e.target.value);
              const hex = e.target.value.slice(1);
              setSelectedColor([parseInt(hex.slice(0,2),16),parseInt(hex.slice(2,4),16),parseInt(hex.slice(4,6),16)]);
            }}
            className="w-full h-7 rounded-lg cursor-pointer border border-[#2a2a32]" />
          <button
            onClick={() => { setSelectedColor(OFF); setCustomHex("#000000"); }}
            className={`mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
              JSON.stringify(selectedColor) === JSON.stringify(OFF)
                ? "bg-white/10 border-white/40 text-white"
                : "bg-[#0c0c10] border-[#2a2a32] text-zinc-400 hover:text-white"
            }`}>
            ⬛ Off (LED dark)
          </button>
        </div>

        <div>
          <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1.5 font-bold">Built-in Effects</div>
          {NEOPIXEL_EFFECTS.map((ef) => (
            <button key={ef.id} onClick={() => loadEffect(ef.id)}
              className="block w-full text-left text-[10px] text-zinc-400 hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/5 transition-all">
              {ef.name}
            </button>
          ))}
        </div>

        <div>
          <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1 font-bold">Name</div>
          <input value={designName} onChange={(e) => setDesignName(e.target.value)}
            className="w-full text-[10px] bg-[#0c0c10] border border-[#1e1e26] rounded px-2 py-1 text-white outline-none" />
          <button
            onClick={saveDesign}
            disabled={!designName.trim()}
            className={`mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border disabled:opacity-40 ${
              justSaved
                ? "bg-green-500/20 border-green-500/40 text-green-400"
                : "bg-violet-500/15 border-violet-500/40 text-violet-400 hover:bg-violet-500/25"
            }`}>
            <Save className="w-3 h-3" />{justSaved ? "Saved! ✓" : "Save Animation"}
          </button>
        </div>

        {savedDesigns.length > 0 && (
          <div>
            <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1.5 font-bold">Saved Animations</div>
            <div className="flex flex-col gap-1">
              {savedDesigns.map((d) => (
                <div key={d.id} className="group flex items-center gap-1">
                  <button onClick={() => loadDesign(d)}
                    title={`${d.frames.length} frame${d.frames.length !== 1 ? "s" : ""} · ${d.mode}`}
                    className="flex-1 min-w-0 text-left text-[10px] text-zinc-400 hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/5 transition-all truncate">
                    {d.name} <span className="text-zinc-600">· {d.frames.length}f</span>
                  </button>
                  <button onClick={() => deleteDesign(d.id)} title="Delete"
                    className="flex-shrink-0 p-1 rounded text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div>
          <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1 font-bold">FPS: {fps}</div>
          <input type="range" min={1} max={30} value={fps} onChange={(e) => setFps(+e.target.value)} className="w-full accent-violet-500" />
        </div>
      </div>

      {/* Center: LED canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[#1a1a20]">
          {frames.map((_, i) => (
            <button key={i} onClick={() => { setCurFrame(i); setPlaying(false); }}
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${i === curFrame ? "bg-violet-500/25 text-violet-300" : "text-zinc-500"}`}>
              {i + 1}
            </button>
          ))}
          <button onClick={() => setFrames((p) => [...p, [...p[p.length-1]]])}
            className="px-2 py-0.5 rounded text-[9px] text-zinc-500 hover:text-green-400 border border-[#2a2a32] hover:border-green-500/30">
            + Frame
          </button>
          {frames.length > 1 && (
            <button onClick={() => setPlaying(!playing)}
              className={`ml-auto flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold ${playing ? "bg-amber-500/20 text-amber-400" : "bg-violet-500/20 text-violet-300"}`}>
              {playing ? <><Pause className="w-3 h-3" /> Stop</> : <><Play className="w-3 h-3" /> Play</>}
            </button>
          )}
        </div>

        <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
          {mode === "strip" ? (
            <div className="flex flex-wrap gap-2 max-w-[600px] justify-center">
              {displayFrame.map((c, i) => (
                <button key={i} onClick={() => setLED(i, selectedColor)} onContextMenu={(e) => { e.preventDefault(); setLED(i, [0,0,0]); }}
                  title={`LED ${i} — right-click to turn off`}
                  className="w-10 h-10 rounded-full border-2 border-white/10 transition-all hover:scale-110 relative"
                  style={{ background: `rgb(${c.join(",")})`, boxShadow: c.some(v=>v>30) ? `0 0 12px rgb(${c.join(",")})` : "none" }}>
                  <span className="absolute inset-0 flex items-center justify-center text-[8px] text-white/30 font-mono">{i}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {Array.from({ length: gridRows }, (_, row) => (
                <div key={row} className="flex gap-1.5">
                  {Array.from({ length: gridCols }, (_, col) => {
                    const idx = row * gridCols + col;
                    const c = displayFrame[idx] ?? [0,0,0];
                    return (
                      <button key={col} onClick={() => setLED(idx, selectedColor)} onContextMenu={(e) => { e.preventDefault(); setLED(idx, [0,0,0]); }}
                        className="w-8 h-8 rounded-lg border border-white/10 hover:scale-110 transition-all"
                        style={{ background: `rgb(${c.join(",")})`, boxShadow: c.some(v=>v>30) ? `0 0 8px rgb(${c.join(",")})` : "none" }} />
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="text-center py-2 text-[9px] text-zinc-600">Left-click to paint · Right-click to erase</div>
      </div>

      {/* Right: code */}
      <div className="w-[260px] flex-shrink-0 border-l border-[#1a1a20] flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#1a1a20]">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">MicroPython Code</span>
          <button onClick={() => { copyText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold transition-all ${copied ? "bg-green-500/20 text-green-400" : "bg-white/5 text-zinc-400 border border-[#2a2a32]"}`}>
            <Copy className="w-3 h-3" />{copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <pre className="flex-1 overflow-auto p-3 text-[9px] font-mono leading-relaxed bg-[#050507]"
          style={{ color: `rgb(${selectedColor.join(",")})` }}>
          {code}
        </pre>
        {onAddNode && (
          <div className="px-3 py-2.5 border-t border-[#1a1a20]">
            <button
              onClick={() => {
                onAddNode("neopixel_designer", {
                  pin: dataPin,
                  ledCount: effectiveLedCount,
                  fps,
                  frames,
                  effectName: designName,
                  mode,
                });
                setAddedToCanvas(true);
                setTimeout(() => setAddedToCanvas(false), 2000);
              }}
              className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-bold transition-all border ${
                addedToCanvas
                  ? "bg-green-500/20 border-green-500/40 text-green-400"
                  : "bg-violet-500/15 border-violet-500/40 text-violet-400 hover:bg-violet-500/25"
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              {addedToCanvas ? "Added to Canvas! ✓" : "Add to Canvas"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
