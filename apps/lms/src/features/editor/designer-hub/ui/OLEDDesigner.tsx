import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Play, Pause, Copy, PlusCircle, Upload } from "lucide-react";
import { OLED_W, OLED_H, flatToNodePixels } from "@/shared/lib/imageUtils";
import { MediaImporter } from "./MediaImporter";
import {
  type AnimEntry, loadAnimRegistry, upsertAnim, removeAnim, toSafeName,
} from "@/shared/lib/animRegistry";

type OLEDTool = "pen" | "eraser" | "line" | "rect" | "circle" | "fill";
interface OLEDDesign { id: string; name: string; frames: number[][]; fps: number; }

function copyText(s: string) { navigator.clipboard.writeText(s).catch(() => {}); }

const OLED_PRESETS: { name: string; pixels: number[] }[] = [
  { name: "Smiley 😊", pixels: (() => {
    const f = new Array(128 * 64).fill(0);
    const c = [64, 32], r = 20;
    for (let y = 0; y < 64; y++) for (let x = 0; x < 128; x++) {
      const d = Math.sqrt((x-c[0])**2 + (y-c[1])**2);
      if (Math.abs(d - r) < 1.5) f[y*128+x] = 1;
    }
    [[54,24],[74,24]].forEach(([ex,ey]) => {
      for (let dy=-2;dy<=2;dy++) for (let dx=-2;dx<=2;dx++) if (dx*dx+dy*dy<=4) f[(ey+dy)*128+(ex+dx)]=1;
    });
    for (let x=50;x<=78;x++) { const y=Math.round(c[1]+12+Math.sin((x-c[0])*Math.PI/28)*5); if(y>=0&&y<64) f[y*128+x]=1; }
    return f;
  })() },
  { name: "Heart ❤️", pixels: (() => {
    const f = new Array(128*64).fill(0);
    for (let y=0;y<64;y++) for (let x=0;x<128;x++) {
      const nx=(x-64)/15, ny=(y-35)/15;
      if ((nx*nx+ny*ny-1)**3 - nx*nx*ny*ny*ny <= 0) f[y*128+x]=1;
    }
    return f;
  })() },
  { name: "WiFi 📶", pixels: (() => {
    const f = new Array(128*64).fill(0);
    const cx=64, cy=48;
    [[22,6],[16,4],[10,3]].forEach(([r,t]) => {
      for (let a=200;a<=340;a+=2) {
        const rad=a*Math.PI/180;
        for (let ri=r-t;ri<=r;ri++) {
          const px=Math.round(cx+ri*Math.cos(rad)), py=Math.round(cy-ri*Math.sin(rad));
          if (px>=0&&px<128&&py>=0&&py<64) f[py*128+px]=1;
        }
      }
    });
    for (let dy=-2;dy<=2;dy++) for (let dx=-2;dx<=2;dx++) if(dx*dx+dy*dy<=4) f[(cy+dy)*128+(cx+dx)]=1;
    return f;
  })() },
];

function oledToBytearray(frame: number[]): string {
  const bytes: number[] = [];
  for (let y = 0; y < OLED_H; y++) {
    for (let xb = 0; xb < OLED_W / 8; xb++) {
      let byte = 0;
      for (let bit = 0; bit < 8; bit++) {
        if (frame[y * OLED_W + xb * 8 + bit]) byte |= (0x80 >> bit);
      }
      bytes.push(byte);
    }
  }
  return bytes.map((b) => `\\x${b.toString(16).padStart(2, "0")}`).join("");
}

function generateOLEDCode(design: OLEDDesign): string {
  const name = design.name.toLowerCase().replace(/\W+/g, "_");
  const header = `# OLED — ${design.name}
from machine import SoftI2C, Pin
import ssd1306, framebuf
i2c = SoftI2C(scl=Pin(36), sda=Pin(35))
oled = ssd1306.SSD1306_I2C(128, 64, i2c)
`;

  if (design.frames.length === 1) {
    return `${header}
_buf_${name} = bytearray(b"${oledToBytearray(design.frames[0])}")
_fb_${name} = framebuf.FrameBuffer(_buf_${name}, 128, 64, framebuf.MONO_HLSB)
oled.fill(0)
oled.blit(_fb_${name}, 0, 0)
oled.show()`;
  }

  const lines = [header, `import time`, `_frames_${name} = [`];
  design.frames.forEach((f, i) => {
    lines.push(`    bytearray(b"${oledToBytearray(f)}"),  # frame ${i}`);
  });
  lines.push(`]`);
  lines.push(`while True:`);
  lines.push(`    for _buf in _frames_${name}:`);
  lines.push(`        _fb = framebuf.FrameBuffer(_buf, 128, 64, framebuf.MONO_HLSB)`);
  lines.push(`        oled.fill(0); oled.blit(_fb, 0, 0); oled.show()`);
  lines.push(`        time.sleep_ms(${Math.round(1000 / design.fps)})`);
  return lines.join("\n");
}

export interface OLEDDesignerProps {
  onAddNode?: (type: string, data: Record<string, unknown>) => void;
  /** Upload an animation to the ESP32 device (requires connection) */
  onSaveToDevice?: (frames: number[][], fps: number, name: string, onProgress?: (pct: number) => void) => Promise<void>;
}

export function OLEDDesigner({ onAddNode, onSaveToDevice }: OLEDDesignerProps) {
  const [frames, setFrames] = useState<number[][]>([new Array(OLED_W * OLED_H).fill(0)]);
  const [curFrame, setCurFrame] = useState(0);
  const [tool, setTool] = useState<OLEDTool>("pen");
  const [fps, setFps] = useState(10);
  const [designName, setDesignName] = useState("MyDesign");
  const [drawing, setDrawing] = useState(false);
  const [lineStart, setLineStart] = useState<[number, number] | null>(null);
  const [dragPos, setDragPos] = useState<[number, number] | null>(null); // current mouse pixel during shape drag
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [addedToCanvas, setAddedToCanvas] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [playFrame, setPlayFrame] = useState(0);
  const [saveDeviceState, setSaveDeviceState] = useState<"idle" | "saving" | "saved" | "failed">("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [registry, setRegistry] = useState<AnimEntry[]>(() => loadAnimRegistry());
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dragFrame = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── History (undo/redo) ────────────────────────────────────────────────────
  const [history, setHistory] = useState<number[][][]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  const pushHistory = useCallback((newFrames: number[][]) => {
    setHistory(h => [...h.slice(0, historyIdx + 1).slice(-49), newFrames.map(f => [...f])]);
    setHistoryIdx(i => Math.min(i + 1, 49));
  }, [historyIdx]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "z") {
          e.preventDefault();
          if (e.shiftKey) {
            // Redo
            setHistoryIdx(i => {
              const nextIdx = i + 1;
              if (nextIdx < history.length) {
                setFrames(history[nextIdx].map(f => [...f]));
                return nextIdx;
              }
              return i;
            });
          } else {
            // Undo
            setHistoryIdx(i => {
              const prevIdx = i - 1;
              if (prevIdx >= 0) {
                setFrames(history[prevIdx].map(f => [...f]));
                return prevIdx;
              }
              return i;
            });
          }
        } else if (e.key === "y") {
          e.preventDefault();
          setHistoryIdx(i => {
            const nextIdx = i + 1;
            if (nextIdx < history.length) {
              setFrames(history[nextIdx].map(f => [...f]));
              return nextIdx;
            }
            return i;
          });
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [history]);

  // ── Pixel helpers ──────────────────────────────────────────────────────────
  const getPixel = useCallback((x: number, y: number) => {
    if (x < 0 || x >= OLED_W || y < 0 || y >= OLED_H) return 0;
    return frames[curFrame][y * OLED_W + x];
  }, [frames, curFrame]);

  const setPixel = useCallback((x: number, y: number, val: number) => {
    if (x < 0 || x >= OLED_W || y < 0 || y >= OLED_H) return;
    setFrames((prev) => {
      const updated = [...prev];
      const f = [...updated[curFrame]];
      f[y * OLED_W + x] = val;
      updated[curFrame] = f;
      return updated;
    });
  }, [curFrame]);

  const floodFill = useCallback((x: number, y: number, target: number, val: number) => {
    if (x < 0 || x >= OLED_W || y < 0 || y >= OLED_H) return;
    const f = [...frames[curFrame]];
    const stack: [number, number][] = [[x, y]];
    while (stack.length) {
      const [cx, cy] = stack.pop()!;
      if (cx < 0 || cx >= OLED_W || cy < 0 || cy >= OLED_H) continue;
      if (f[cy * OLED_W + cx] !== target) continue;
      f[cy * OLED_W + cx] = val;
      stack.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
    }
    setFrames((prev) => { const u=[...prev]; u[curFrame]=f; return u; });
  }, [frames, curFrame]);

  const drawLine = useCallback((x0: number, y0: number, x1: number, y1: number, val: number) => {
    let dx=Math.abs(x1-x0),dy=Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,err=dx-dy;
    while (true) {
      setPixel(x0,y0,val);
      if (x0===x1&&y0===y1) break;
      const e2=2*err;
      if(e2>-dy){err-=dy;x0+=sx;}
      if(e2<dx){err+=dx;y0+=sy;}
    }
  }, [setPixel]);

  // ── Invert & Shift ────────────────────────────────────────────────────────
  const invertFrame = useCallback(() => {
    setFrames(prev => {
      const u = [...prev];
      u[curFrame] = u[curFrame].map(v => v ^ 1);
      return u;
    });
  }, [curFrame]);

  const shiftFrame = useCallback((dx: number, dy: number) => {
    setFrames(prev => {
      const u = [...prev];
      const src = u[curFrame];
      const dst = new Array(OLED_W * OLED_H).fill(0);
      for (let y = 0; y < OLED_H; y++) {
        for (let x = 0; x < OLED_W; x++) {
          const nx = ((x + dx) % OLED_W + OLED_W) % OLED_W;
          const ny = ((y + dy) % OLED_H + OLED_H) % OLED_H;
          dst[ny * OLED_W + nx] = src[y * OLED_W + x];
        }
      }
      u[curFrame] = dst;
      return u;
    });
  }, [curFrame]);

  // ── Dynamic scale ─────────────────────────────────────────────────────────
  const [scale, setScale] = useState(6);
  useEffect(() => {
    const update = () => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      const availW = width - 32;
      const availH = height - 80; // leave room for frames bar
      const s = Math.max(4, Math.min(8, Math.min(Math.floor(availW / OLED_W), Math.floor(availH / OLED_H))));
      setScale(s);
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // ── Canvas render ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const f = playing ? frames[playFrame % frames.length] : frames[curFrame];
    const W = OLED_W * scale;
    const H = OLED_H * scale;

    // Use ImageData for performance
    const imgData = ctx.createImageData(W, H);
    const buf = imgData.data;

    for (let py = 0; py < OLED_H; py++) {
      for (let px2 = 0; px2 < OLED_W; px2++) {
        const lit = f[py * OLED_W + px2] === 1;
        const cellX = px2 * scale;
        const cellY = py * scale;

        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            const sx = cellX + dx;
            const sy = cellY + dy;
            const idx = (sy * W + sx) * 4;
            // Determine if inside the lit pixel rect (1px padding each side)
            const inPixel = dx >= 1 && dx < scale - 1 && dy >= 1 && dy < scale - 1;
            if (lit && inPixel) {
              buf[idx]   = 232; // R: #e8
              buf[idx+1] = 232; // G: #e8
              buf[idx+2] = 240; // B: #f0 — slightly blue-white like real OLED
              buf[idx+3] = 255;
            } else {
              // cell background
              buf[idx]   = 13;  // #0d
              buf[idx+1] = 13;
              buf[idx+2] = 13;
              buf[idx+3] = 255;
            }
          }
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }, [frames, curFrame, playing, playFrame, scale]);

  // ── Playback ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (playing) {
      playRef.current = setInterval(() => setPlayFrame((p) => p + 1), 1000 / fps);
    } else {
      if (playRef.current) clearInterval(playRef.current);
    }
    return () => { if (playRef.current) clearInterval(playRef.current); };
  }, [playing, fps]);

  // ── Canvas interaction ────────────────────────────────────────────────────
  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>): [number, number] => {
    const rect = e.currentTarget.getBoundingClientRect();
    return [Math.floor((e.clientX - rect.left) / scale), Math.floor((e.clientY - rect.top) / scale)];
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    const [x,y] = getCanvasPos(e);
    setDrawing(true);
    pushHistory(frames);
    const val = tool === "eraser" ? 0 : 1;
    if (tool === "pen" || tool === "eraser") setPixel(x, y, val);
    else if (tool === "fill") floodFill(x, y, getPixel(x,y), val);
    else { setLineStart([x, y]); setDragPos([x, y]); }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const [x, y] = getCanvasPos(e);
    if (lineStart) setDragPos([x, y]); // track for live preview
    if (!drawing) return;
    const val = tool === "eraser" ? 0 : 1;
    if (tool === "pen" || tool === "eraser") setPixel(x, y, val);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setDrawing(false);
    setDragPos(null);
    if (!lineStart) return;
    const [x, y] = getCanvasPos(e);
    const [lx, ly] = lineStart;
    const val = 1;
    if (tool === "line") drawLine(lx, ly, x, y, val);
    else if (tool === "rect") {
      for (let rx=Math.min(lx,x);rx<=Math.max(lx,x);rx++) {
        setPixel(rx, Math.min(ly,y), val); setPixel(rx, Math.max(ly,y), val);
      }
      for (let ry=Math.min(ly,y);ry<=Math.max(ly,y);ry++) {
        setPixel(Math.min(lx,x), ry, val); setPixel(Math.max(lx,x), ry, val);
      }
    } else if (tool === "circle") {
      const r = Math.round(Math.sqrt((x-lx)**2+(y-ly)**2));
      for (let a=0;a<360;a+=0.5) {
        setPixel(Math.round(lx+r*Math.cos(a*Math.PI/180)), Math.round(ly+r*Math.sin(a*Math.PI/180)), val);
      }
    }
    setLineStart(null);
  };

  // ── Frame management ──────────────────────────────────────────────────────
  const addFrame = () => setFrames((prev) => [...prev, [...prev[prev.length - 1]]]);
  const removeFrame = (i: number) => {
    if (frames.length <= 1) return;
    setFrames((prev) => prev.filter((_, idx) => idx !== i));
    if (curFrame >= frames.length - 1) setCurFrame(frames.length - 2);
  };
  const duplicateFrame = (i: number) => {
    pushHistory(frames);
    setFrames((prev) => [...prev.slice(0, i + 1), [...prev[i]], ...prev.slice(i + 1)]);
    setCurFrame(i + 1);
  };
  const moveFrame = (from: number, to: number) => {
    if (from === to) return;
    pushHistory(frames);
    setFrames((prev) => {
      const next = [...prev];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      return next;
    });
    setCurFrame(to);
  };
  const clearFrame = () => {
    pushHistory(frames);
    setFrames((prev) => { const u=[...prev]; u[curFrame]=new Array(OLED_W*OLED_H).fill(0); return u; });
  };
  const loadPreset = (p: typeof OLED_PRESETS[0]) => {
    pushHistory(frames);
    setFrames((prev) => { const u=[...prev]; u[curFrame]=[...p.pixels]; return u; });
  };

  // ── Library ───────────────────────────────────────────────────────────────
  // ── Save to Library (always works — no device needed) ────────────────────
  const saveToLibrary = () => {
    const entry: AnimEntry = {
      name: toSafeName(designName) || "my_design",
      fps,
      frameCount: frames.length,
      frames: frames.map(f => [...f]),
      onDevice: false,
      savedAt: new Date().toISOString(),
    };
    upsertAnim(entry);
    setRegistry(loadAnimRegistry());
  };

  const loadFromLibrary = (entry: AnimEntry) => {
    pushHistory(frames);
    setFrames(entry.frames.map(f => [...f]));
    setFps(entry.fps);
    setDesignName(entry.name);
    setCurFrame(0);
  };

  const deleteFromLibrary = (name: string) => {
    removeAnim(name);
    setRegistry(loadAnimRegistry());
  };

  // ── Upload to Device (requires connection) ────────────────────────────────
  const handleSaveToDevice = async (entry?: AnimEntry) => {
    if (!onSaveToDevice) return;
    const src = entry ?? { name: toSafeName(designName) || "my_design", frames, fps };
    setSaveDeviceState("saving");
    setUploadProgress(0);
    try {
      await onSaveToDevice(src.frames, src.fps, src.name, (pct) => setUploadProgress(pct));
      setUploadProgress(100);
      setSaveDeviceState("saved");
      setRegistry(loadAnimRegistry()); // refresh onDevice badges
      setTimeout(() => setSaveDeviceState("idle"), 2500);
    } catch {
      setSaveDeviceState("failed");
      setTimeout(() => setSaveDeviceState("idle"), 2500);
    }
  };

  const design: OLEDDesign = { id: Date.now().toString(36), name: designName, frames, fps };
  const code = generateOLEDCode(design);

  const tools: { id: OLEDTool; icon: string; label: string }[] = [
    { id: "pen",    icon: "✏️", label: "Pen" },
    { id: "eraser", icon: "⬜", label: "Eraser" },
    { id: "line",   icon: "╱",  label: "Line" },
    { id: "rect",   icon: "▭",  label: "Rect" },
    { id: "circle", icon: "○",  label: "Circle" },
    { id: "fill",   icon: "🪣", label: "Fill" },
  ];

  return (
    <div className="flex h-full gap-0">
      {/* Left panel: 150px — tools + presets + library */}
      <div className="w-[150px] flex-shrink-0 border-r border-[var(--k-border)] p-2 flex flex-col gap-2 overflow-y-auto">
        {/* Tools */}
        <div>
          <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1 font-bold">Tools</div>
          <div className="grid grid-cols-2 gap-1">
            {tools.map((t) => (
              <button key={t.id} onClick={() => setTool(t.id)}
                className={`flex flex-col items-center gap-0.5 py-1 px-1 rounded-lg text-[10px] font-bold transition-all ${
                  tool === t.id ? "bg-violet-500/20 text-violet-300 border border-violet-500/30" : "text-zinc-500 hover:bg-white/5 border border-transparent"
                }`}>
                <span className="text-sm">{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Invert / Shift */}
        <div>
          <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1 font-bold">Edit</div>
          <button onClick={() => { pushHistory(frames); invertFrame(); }}
            className="w-full text-left text-[10px] text-zinc-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition-all">
            ⬛ Invert
          </button>
          <div className="grid grid-cols-3 gap-0.5 mt-1">
            <div />
            <button onClick={() => { pushHistory(frames); shiftFrame(0, -1); }}
              className="text-zinc-500 hover:text-white text-center py-0.5 rounded hover:bg-white/5 text-sm">↑</button>
            <div />
            <button onClick={() => { pushHistory(frames); shiftFrame(-1, 0); }}
              className="text-zinc-500 hover:text-white text-center py-0.5 rounded hover:bg-white/5 text-sm">←</button>
            <button onClick={() => { pushHistory(frames); shiftFrame(0, 1); }}
              className="text-zinc-500 hover:text-white text-center py-0.5 rounded hover:bg-white/5 text-sm">↓</button>
            <button onClick={() => { pushHistory(frames); shiftFrame(1, 0); }}
              className="text-zinc-500 hover:text-white text-center py-0.5 rounded hover:bg-white/5 text-sm">→</button>
          </div>
        </div>

        {/* Presets */}
        <div>
          <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1 font-bold">Presets</div>
          <div className="flex flex-col gap-0.5">
            {OLED_PRESETS.map((p) => (
              <button key={p.name} onClick={() => loadPreset(p)}
                className="text-left text-[10px] text-zinc-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/5 transition-all truncate">
                {p.name}
              </button>
            ))}
            <button onClick={clearFrame}
              className="text-left text-[10px] text-red-400 hover:text-red-300 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-all">
              🗑 Clear
            </button>
          </div>
        </div>

        {/* Design name & FPS */}
        <div>
          <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-0.5 font-bold">Name</div>
          <input value={designName} onChange={(e) => setDesignName(e.target.value)}
            className="w-full text-[10px] font-mono bg-[var(--k-base-100)] border border-[var(--k-base-400)] rounded-lg px-2 py-1 text-white outline-none" />
        </div>
        {frames.length > 1 && (
          <div>
            <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-0.5 font-bold">FPS: {fps}</div>
            <input type="range" min={1} max={30} value={fps} onChange={(e) => setFps(+e.target.value)}
              className="w-full accent-violet-500" />
          </div>
        )}

        {/* Animation Library */}
        <div className="flex-1">
          <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1 font-bold">Library</div>

          {/* Save to Library — always works, no device needed */}
          <button onClick={saveToLibrary}
            className="w-full mb-1.5 text-[10px] px-2 py-1 rounded-lg bg-violet-500/15 text-violet-400 border border-violet-500/30 hover:bg-violet-500/25 transition-all font-bold">
            💾 Save to Library
          </button>

          <div className="flex flex-col gap-1">
            {registry.length === 0 && (
              <p className="text-[9px] text-zinc-700 px-1">No saved animations</p>
            )}
            {registry.map((entry) => (
              <div key={entry.name} className="bg-[#0e0e14] rounded-lg p-1.5 border border-[var(--k-border)]">
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[10px] text-zinc-300 font-semibold truncate flex-1">{entry.name}</span>
                  {entry.onDevice && (
                    <span className="text-[7px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 rounded px-1 py-px font-bold flex-shrink-0">ON DEVICE</span>
                  )}
                </div>
                <div className="text-[9px] text-zinc-600">{entry.frameCount}f · {entry.fps}fps</div>
                <div className="flex gap-1 mt-1">
                  <button onClick={() => loadFromLibrary(entry)}
                    className="flex-1 text-[9px] text-violet-400 border border-violet-500/30 rounded px-1 py-0.5 hover:bg-violet-500/10 transition-all">
                    Load
                  </button>
                  {onSaveToDevice && (
                    <button onClick={() => handleSaveToDevice(entry)}
                      title="Upload to ESP32 device"
                      className="text-[9px] text-emerald-400 border border-emerald-500/25 rounded px-1 py-0.5 hover:bg-emerald-500/10 transition-all">
                      <Upload className="w-2.5 h-2.5" />
                    </button>
                  )}
                  <button onClick={() => deleteFromLibrary(entry.name)}
                    className="text-[9px] text-red-500 border border-red-500/20 rounded px-1 py-0.5 hover:bg-red-500/10 transition-all">
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Center: canvas fills remaining width — min-h-0 lets flex children shrink */}
      <div ref={containerRef} className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">
        {/* Frames bar */}
        <div className="w-full flex items-center gap-2 px-3 py-2 border-b border-[var(--k-border)] bg-[var(--k-base-100)] flex-shrink-0 flex-wrap">
          <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold mr-1">Frames</span>
          {frames.map((_, i) => (
            <div key={i} draggable
              onDragStart={() => { dragFrame.current = i; }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragFrame.current !== null) moveFrame(dragFrame.current, i); dragFrame.current = null; }}
              title="Drag to reorder"
              className="flex items-center gap-0.5 cursor-move">
              <button onClick={() => { setCurFrame(i); setPlaying(false); }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${i === curFrame ? "bg-violet-500/25 text-violet-300 border border-violet-500/40" : "text-zinc-500 hover:text-zinc-300"}`}>
                {i + 1}
              </button>
              {frames.length > 1 && (
                <button onClick={() => removeFrame(i)} className="text-zinc-700 hover:text-red-400 text-[10px]">×</button>
              )}
            </div>
          ))}
          <button onClick={addFrame}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] text-zinc-500 hover:text-green-400 border border-[var(--k-border)] hover:border-green-500/30 transition-all">
            <Plus className="w-2.5 h-2.5" />Add
          </button>
          <button onClick={() => duplicateFrame(curFrame)} title="Duplicate current frame"
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] text-zinc-500 hover:text-violet-400 border border-[var(--k-border)] hover:border-violet-500/30 transition-all">
            <Copy className="w-2.5 h-2.5" />Dup
          </button>

          <button onClick={() => setShowImport(v => !v)}
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[9px] font-bold border transition-all ${
              showImport
                ? "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40"
                : "text-zinc-500 border-[var(--k-border)] hover:text-fuchsia-400 hover:border-fuchsia-500/30"
            }`}>
            📷 Import
          </button>

          {frames.length > 1 && (
            <button onClick={() => setPlaying(!playing)}
              className={`ml-auto flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                playing ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-violet-500/20 text-violet-300 border border-violet-500/30"
              }`}>
              {playing ? <><Pause className="w-3 h-3" /> Stop</> : <><Play className="w-3 h-3" /> Play</>}
            </button>
          )}

          {/* Undo/Redo */}
          <button
            onClick={() => {
              setHistoryIdx(i => {
                const prevIdx = i - 1;
                if (prevIdx >= 0) { setFrames(history[prevIdx].map(f => [...f])); return prevIdx; }
                return i;
              });
            }}
            title="Undo (Ctrl+Z)"
            className="text-zinc-500 hover:text-zinc-300 text-xs px-1.5 py-0.5 rounded border border-[var(--k-border)] hover:border-zinc-600 transition-all">
            ↩
          </button>
          <button
            onClick={() => {
              setHistoryIdx(i => {
                const nextIdx = i + 1;
                if (nextIdx < history.length) { setFrames(history[nextIdx].map(f => [...f])); return nextIdx; }
                return i;
              });
            }}
            title="Redo (Ctrl+Y)"
            className="text-zinc-500 hover:text-zinc-300 text-xs px-1.5 py-0.5 rounded border border-[var(--k-border)] hover:border-zinc-600 transition-all">
            ↪
          </button>
        </div>

        {/* Media importer */}
        {showImport && (
          <div className="border-b border-[var(--k-border)] bg-[var(--k-base-100)] p-4 max-h-[380px] overflow-y-auto w-full flex-shrink-0">
            <MediaImporter
              onApply={(importedFrames, importedFps) => {
                setFrames(importedFrames);
                setFps(importedFps);
                setCurFrame(0);
              }}
              onClose={() => setShowImport(false)}
            />
          </div>
        )}

        {/* OLED canvas — explicit CSS width/height locks the 2:1 OLED aspect ratio */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto min-h-0">
          {/* wrapper keeps canvas + SVG overlay perfectly aligned */}
          <div className="relative flex-shrink-0" style={{ width: `${OLED_W * scale}px`, height: `${OLED_H * scale}px` }}>
            <canvas
              ref={canvasRef}
              width={OLED_W * scale}
              height={OLED_H * scale}
              className="cursor-crosshair"
              style={{
                width: `${OLED_W * scale}px`,
                height: `${OLED_H * scale}px`,
                imageRendering: "pixelated",
                background: "#000000",
                border: "2px solid #2a2a3a",
                borderRadius: "4px",
                boxShadow: "0 0 0 1px #3a3a50, 0 0 30px rgba(100,120,255,0.18), inset 0 0 60px rgba(0,0,60,0.4)",
                display: "block",
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => { setDrawing(false); setDragPos(null); }}
            />

            {/* Live shape preview overlay */}
            {lineStart && dragPos && (() => {
              const [lx, ly] = lineStart;
              const [dx, dy] = dragPos;
              const s = scale;
              const x1 = lx * s, y1 = ly * s, x2 = dx * s, y2 = dy * s;

              // Rect dimensions in pixels (OLED pixels, not screen px)
              const rw = Math.abs(dx - lx) + 1;
              const rh = Math.abs(dy - ly) + 1;
              const rx = Math.min(lx, dx) * s;
              const ry = Math.min(ly, dy) * s;
              const rW = rw * s;
              const rH = rh * s;

              // Circle radius
              const cr = Math.round(Math.sqrt((dx - lx) ** 2 + (dy - ly) ** 2));

              return (
                <svg
                  className="absolute inset-0 pointer-events-none"
                  width={OLED_W * s}
                  height={OLED_H * s}
                  style={{ borderRadius: "4px" }}
                >
                  {tool === "rect" && (
                    <>
                      {/* Filled dim background */}
                      <rect x={rx} y={ry} width={rW} height={rH}
                        fill="rgba(167,139,250,0.07)" />
                      {/* Outline */}
                      <rect x={rx} y={ry} width={rW} height={rH}
                        fill="none" stroke="#a78bfa" strokeWidth="1.5"
                        strokeDasharray="4 2" />
                      {/* Corner dots */}
                      {[[rx,ry],[rx+rW,ry],[rx,ry+rH],[rx+rW,ry+rH]].map(([cx2,cy2],i) => (
                        <circle key={i} cx={cx2} cy={cy2} r={2.5} fill="#a78bfa" />
                      ))}
                      {/* Size badge */}
                      <rect x={rx} y={Math.max(0, ry - 16)} width={Math.max(36, String(`${rw}×${rh}`).length * 6 + 8)} height={14} rx={3} fill="#18181f" stroke="#3a3a55" strokeWidth="1" />
                      <text x={rx + 4} y={Math.max(0, ry - 16) + 10} fill="#a78bfa" fontSize={9} fontFamily="monospace" fontWeight="bold">
                        {rw}×{rh} px
                      </text>
                    </>
                  )}
                  {tool === "line" && (
                    <>
                      <line x1={x1 + s/2} y1={y1 + s/2} x2={x2 + s/2} y2={y2 + s/2}
                        stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4 2" />
                      <circle cx={x1 + s/2} cy={y1 + s/2} r={3} fill="#a78bfa" />
                      <circle cx={x2 + s/2} cy={y2 + s/2} r={3} fill="#a78bfa" />
                      {/* Length badge */}
                      {(() => {
                        const len = Math.round(Math.sqrt((dx-lx)**2+(dy-ly)**2));
                        const midX = (x1 + x2) / 2 + s/2;
                        const midY = (y1 + y2) / 2 + s/2 - 8;
                        return (
                          <>
                            <rect x={midX - 18} y={midY - 9} width={36} height={12} rx={3} fill="#18181f" stroke="#3a3a55" strokeWidth="1" />
                            <text x={midX} y={midY} fill="#a78bfa" fontSize={9} fontFamily="monospace" fontWeight="bold" textAnchor="middle">{len}px</text>
                          </>
                        );
                      })()}
                    </>
                  )}
                  {tool === "circle" && (
                    <>
                      <circle cx={x1 + s/2} cy={y1 + s/2} r={cr * s}
                        fill="rgba(167,139,250,0.06)" stroke="#a78bfa" strokeWidth="1.5" strokeDasharray="4 2" />
                      <circle cx={x1 + s/2} cy={y1 + s/2} r={2.5} fill="#a78bfa" />
                      {/* Radius badge */}
                      <rect x={x1 + s/2 + 4} y={y1 + s/2 - 16} width={Math.max(36, String(`r=${cr}`).length * 6 + 8)} height={14} rx={3} fill="#18181f" stroke="#3a3a55" strokeWidth="1" />
                      <text x={x1 + s/2 + 8} y={y1 + s/2 - 16 + 10} fill="#a78bfa" fontSize={9} fontFamily="monospace" fontWeight="bold">r={cr} px</text>
                    </>
                  )}
                  {/* Cursor crosshair */}
                  <line x1={x2 + s/2 - 5} y1={y2 + s/2} x2={x2 + s/2 + 5} y2={y2 + s/2} stroke="#a78bfa" strokeWidth="1" opacity="0.6" />
                  <line x1={x2 + s/2} y1={y2 + s/2 - 5} x2={x2 + s/2} y2={y2 + s/2 + 5} stroke="#a78bfa" strokeWidth="1" opacity="0.6" />
                </svg>
              );
            })()}

            {/* Coordinate readout — bottom right corner of canvas */}
            {dragPos && (
              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 border border-[#2a2a3a] text-[9px] font-mono text-violet-300 pointer-events-none">
                {dragPos[0]}, {dragPos[1]}
              </div>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="w-full border-t border-[var(--k-border)] bg-[var(--k-base-100)] px-3 py-2 flex items-center gap-2 flex-shrink-0 flex-wrap">
          {/* Code toggle */}
          <button onClick={() => setShowCode(v => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
              showCode
                ? "bg-violet-500/20 text-violet-300 border-violet-500/40"
                : "text-zinc-500 border-[var(--k-border)] hover:text-zinc-300 hover:border-zinc-600"
            }`}>
            {"</>"}  Code
          </button>

          {/* Add to Canvas */}
          {onAddNode && (
            <button
              onClick={() => {
                const nodePixels = frames.map(f => flatToNodePixels(f, OLED_W, OLED_H));
                if (frames.length > 1) {
                  onAddNode("oled_display", { animFrames: nodePixels, fps, line1: "", line2: "" });
                } else {
                  onAddNode("oled_display", { staticPixels: nodePixels[0], line1: "", line2: "" });
                }
                setAddedToCanvas(true);
                setTimeout(() => setAddedToCanvas(false), 2000);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                addedToCanvas
                  ? "bg-green-500/20 border-green-500/40 text-green-400"
                  : "bg-violet-500/15 border-violet-500/40 text-violet-400 hover:bg-violet-500/25"
              }`}
            >
              <PlusCircle className="w-3 h-3" />
              {addedToCanvas ? "Added! ✓" : "Add to Canvas"}
            </button>
          )}

          {/* Copy code shortcut */}
          <button onClick={() => { copyText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
              copied ? "bg-green-500/20 text-green-400 border-green-500/30" : "text-zinc-500 border-[var(--k-border)] hover:text-zinc-300 hover:border-zinc-600"
            }`}>
            <Copy className="w-3 h-3" />{copied ? "Copied!" : "Copy Code"}
          </button>

          {/* Upload to Device — with live progress bar */}
          {onSaveToDevice && (
            <div className="relative ml-auto">
              <button onClick={() => handleSaveToDevice()} disabled={saveDeviceState === "saving"}
                className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition-all overflow-hidden ${
                  saveDeviceState === "saved"   ? "bg-green-500/20 text-green-400 border-green-500/30" :
                  saveDeviceState === "failed"  ? "bg-red-500/20 text-red-400 border-red-500/30" :
                  saveDeviceState === "saving"  ? "bg-blue-500/10 text-blue-300 border-blue-500/30" :
                  "bg-blue-500/15 text-blue-400 border-blue-500/30 hover:bg-blue-500/25"
                }`}>
                {/* Progress fill */}
                {saveDeviceState === "saving" && (
                  <span
                    className="absolute inset-y-0 left-0 bg-blue-500/30 transition-[width] duration-150"
                    style={{ width: `${uploadProgress}%` }}
                  />
                )}
                <span className="relative flex items-center gap-1.5">
                  {saveDeviceState === "saving" ? (
                    <><span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin inline-block" /> Uploading… {uploadProgress}%</>
                  ) : saveDeviceState === "saved" ? "✅ Saved to device!" :
                     saveDeviceState === "failed" ? "❌ Not connected / failed" : (
                    <><Upload className="w-3 h-3" /> Save to Device</>
                  )}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Code overlay */}
        {showCode && (
          <div className="absolute bottom-14 right-4 w-72 max-h-64 bg-[var(--k-base-100)] border border-[var(--k-border)] rounded-xl shadow-2xl flex flex-col overflow-hidden z-10">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--k-border)]">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">MicroPython</span>
              <button onClick={() => setShowCode(false)} className="text-zinc-600 hover:text-zinc-300 text-xs">✕</button>
            </div>
            <pre className="flex-1 overflow-auto p-3 text-[9px] font-mono text-green-400 leading-relaxed">
              {code}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
