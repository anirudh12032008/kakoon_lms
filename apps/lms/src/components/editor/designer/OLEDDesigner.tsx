import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, Play, Pause, Copy, PlusCircle } from "lucide-react";
import { OLED_W, OLED_H, flatToNodePixels } from "../../../lib/imageUtils";
import { MediaImporter } from "./MediaImporter";

const SCALE = 5;

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

export function OLEDDesigner({ onAddNode }: { onAddNode?: (type: string, data: Record<string, unknown>) => void }) {
  const [frames, setFrames] = useState<number[][]>([new Array(OLED_W * OLED_H).fill(0)]);
  const [curFrame, setCurFrame] = useState(0);
  const [tool, setTool] = useState<OLEDTool>("pen");
  const [fps, setFps] = useState(10);
  const [designName, setDesignName] = useState("MyDesign");
  const [drawing, setDrawing] = useState(false);
  const [lineStart, setLineStart] = useState<[number, number] | null>(null);
  const [playing, setPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [addedToCanvas, setAddedToCanvas] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [playFrame, setPlayFrame] = useState(0);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return [Math.floor((e.clientX - rect.left) / SCALE), Math.floor((e.clientY - rect.top) / SCALE)] as [number, number];
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.stopPropagation();
    const [x,y] = getCanvasPos(e);
    setDrawing(true);
    const val = tool === "eraser" ? 0 : 1;
    if (tool === "pen" || tool === "eraser") setPixel(x, y, val);
    else if (tool === "fill") floodFill(x, y, getPixel(x,y), val);
    else setLineStart([x, y]);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawing) return;
    const [x, y] = getCanvasPos(e);
    const val = tool === "eraser" ? 0 : 1;
    if (tool === "pen" || tool === "eraser") setPixel(x, y, val);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setDrawing(false);
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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const f = playing ? frames[playFrame % frames.length] : frames[curFrame];
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, OLED_W * SCALE, OLED_H * SCALE);
    for (let y = 0; y < OLED_H; y++) for (let x = 0; x < OLED_W; x++) {
      if (f[y * OLED_W + x]) {
        ctx.fillStyle = "#4ade80";
        ctx.fillRect(x * SCALE, y * SCALE, SCALE - 1, SCALE - 1);
      }
    }
  }, [frames, curFrame, playing, playFrame]);

  useEffect(() => {
    if (playing) {
      playRef.current = setInterval(() => setPlayFrame((p) => p + 1), 1000 / fps);
    } else {
      if (playRef.current) clearInterval(playRef.current);
    }
    return () => { if (playRef.current) clearInterval(playRef.current); };
  }, [playing, fps]);

  const addFrame = () => setFrames((prev) => [...prev, [...prev[prev.length - 1]]]);
  const removeFrame = (i: number) => {
    if (frames.length <= 1) return;
    setFrames((prev) => prev.filter((_, idx) => idx !== i));
    if (curFrame >= frames.length - 1) setCurFrame(frames.length - 2);
  };
  const clearFrame = () => setFrames((prev) => { const u=[...prev]; u[curFrame]=new Array(OLED_W*OLED_H).fill(0); return u; });
  const loadPreset = (p: typeof OLED_PRESETS[0]) => {
    setFrames((prev) => { const u=[...prev]; u[curFrame]=[...p.pixels]; return u; });
  };

  const design: OLEDDesign = { id: Date.now().toString(36), name: designName, frames, fps };
  const code = generateOLEDCode(design);

  const tools: { id: OLEDTool; icon: string; label: string }[] = [
    { id: "pen", icon: "✏️", label: "Pen" },
    { id: "eraser", icon: "⬜", label: "Eraser" },
    { id: "line", icon: "╱", label: "Line" },
    { id: "rect", icon: "▭", label: "Rect" },
    { id: "circle", icon: "○", label: "Circle" },
    { id: "fill", icon: "🪣", label: "Fill" },
  ];

  return (
    <div className="flex h-full gap-0">
      {/* Left: tools */}
      <div className="w-[140px] flex-shrink-0 border-r border-[#1a1a20] p-3 flex flex-col gap-3">
        <div>
          <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1.5 font-bold">Tools</div>
          <div className="grid grid-cols-2 gap-1">
            {tools.map((t) => (
              <button key={t.id} onClick={() => setTool(t.id)}
                className={`flex flex-col items-center gap-1 py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all ${
                  tool === t.id ? "bg-violet-500/20 text-violet-300 border border-violet-500/30" : "text-zinc-500 hover:bg-white/5 border border-transparent"
                }`}>
                <span className="text-base">{t.icon}</span>{t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1.5 font-bold">Presets</div>
          <div className="flex flex-col gap-1">
            {OLED_PRESETS.map((p) => (
              <button key={p.name} onClick={() => loadPreset(p)}
                className="text-left text-[10px] text-zinc-400 hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/5 transition-all">
                {p.name}
              </button>
            ))}
            <button onClick={clearFrame}
              className="text-left text-[10px] text-red-400 hover:text-red-300 px-2 py-1.5 rounded-lg hover:bg-red-500/10 transition-all">
              🗑 Clear
            </button>
          </div>
        </div>

        <div>
          <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1 font-bold">Name</div>
          <input value={designName} onChange={(e) => setDesignName(e.target.value)}
            className="w-full text-[10px] font-mono bg-[#0c0c10] border border-[#1e1e26] rounded-lg px-2 py-1.5 text-white outline-none" />
        </div>

        {frames.length > 1 && (
          <div>
            <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1 font-bold">FPS: {fps}</div>
            <input type="range" min={1} max={30} value={fps} onChange={(e) => setFps(+e.target.value)}
              className="w-full accent-violet-500" />
          </div>
        )}
      </div>

      {/* Center: canvas */}
      <div className="flex flex-col flex-1 items-center min-w-0">
        <div className="w-full flex items-center gap-2 px-4 py-2 border-b border-[#1a1a20] bg-[#0a0a0d]">
          <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold mr-1">Frames</span>
          {frames.map((_, i) => (
            <div key={i} className="flex items-center gap-0.5">
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
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] text-zinc-500 hover:text-green-400 border border-[#2a2a32] hover:border-green-500/30 transition-all">
            <Plus className="w-2.5 h-2.5" />Add
          </button>

          <button
            onClick={() => setShowImport(v => !v)}
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded text-[9px] font-bold border transition-all ${
              showImport
                ? "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40"
                : "text-zinc-500 border-[#2a2a32] hover:text-fuchsia-400 hover:border-fuchsia-500/30"
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
        </div>

        {showImport && (
          <div className="border-b border-[#1a1a20] bg-[#08080b] p-4 max-h-[380px] overflow-y-auto">
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

        <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
          <canvas
            ref={canvasRef}
            width={OLED_W * SCALE}
            height={OLED_H * SCALE}
            className="rounded-xl border-2 border-[#1a4a1a] cursor-crosshair"
            style={{ imageRendering: "pixelated", background: "#0a0a0a", boxShadow: "0 0 40px #4ade8020" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => setDrawing(false)}
          />
        </div>
      </div>

      {/* Right: code */}
      <div className="w-[260px] flex-shrink-0 border-l border-[#1a1a20] flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[#1a1a20]">
          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">MicroPython Code</span>
          <button onClick={() => { copyText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-bold transition-all ${
              copied ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-white/5 text-zinc-400 border border-[#2a2a32] hover:border-zinc-600"
            }`}>
            <Copy className="w-3 h-3" />{copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <pre className="flex-1 overflow-auto p-3 text-[9px] font-mono text-green-400 leading-relaxed bg-[#050507]">
          {code}
        </pre>
        {onAddNode && (
          <div className="px-3 py-2.5 border-t border-[#1a1a20]">
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
