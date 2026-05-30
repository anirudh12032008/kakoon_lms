/**
 * DesignerHub — full-screen modal with tabs for:
 *   1. OLED Designer (128×64 monochrome pixel canvas, multi-frame)
 *   2. Matrix Designer (MAX7219 8×8 LED matrix, animations, scroll text)
 *   3. NeoPixel Designer (RGB LED strip/grid, effects, custom frames)
 *
 * All designers save to localStorage and generate copy-able MicroPython code.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Copy, Play, Pause, Plus, PlusCircle } from "lucide-react";

// Convert DesignerHub flat pixel array (length W×H, values 0/1) to
// boolean[][] (rows × cols) for the OLED node's staticPixels / animFrames field.
function flatToNodePixels(flat: number[], w: number, h: number): boolean[][] {
  return Array.from({ length: h }, (_, r) =>
    Array.from({ length: w }, (_, c) => flat[r * w + c] !== 0)
  );
}

// ─── Shared ────────────────────────────────────────────────────────────────────
function copyText(s: string) { navigator.clipboard.writeText(s).catch(() => {}); }

interface TabProps { label: string; icon: string; active: boolean; onClick: () => void; }
function Tab({ label, icon, active, onClick }: TabProps) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
        active
          ? "border-violet-500 text-violet-400 bg-violet-500/10"
          : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
      }`}>
      <span>{icon}</span>{label}
    </button>
  );
}

// ─── OLED Designer ─────────────────────────────────────────────────────────────
const OLED_W = 128, OLED_H = 64, SCALE = 5;

type OLEDTool = "pen" | "eraser" | "line" | "rect" | "circle" | "fill";
type DitherMode = "none" | "floyd" | "ordered";
type ScaleMode  = "fit"  | "fill"  | "stretch";

interface OLEDDesign { id: string; name: string; frames: number[][]; fps: number; }

// ─── Image processing helpers ──────────────────────────────────────────────────
function applyBC(lum: number, brightness: number, contrast: number): number {
  lum = ((lum / 255 - 0.5) * contrast + 0.5) * 255 + brightness;
  return Math.max(0, Math.min(255, lum));
}

function floydSteinberg(grays: Float32Array, w: number, h: number): number[] {
  const buf = new Float32Array(grays);
  const out = new Array(w * h).fill(0);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const old = buf[i];
      const nv  = old < 128 ? 0 : 255;
      out[i] = nv === 0 ? 1 : 0;
      const err = old - nv;
      if (x + 1 < w)               buf[i + 1]     += err * 7 / 16;
      if (y + 1 < h) {
        if (x > 0)                  buf[i + w - 1] += err * 3 / 16;
                                    buf[i + w]     += err * 5 / 16;
        if (x + 1 < w)             buf[i + w + 1] += err * 1 / 16;
      }
    }
  }
  return out;
}

const BAYER4 = [0,8,2,10, 12,4,14,6, 3,11,1,9, 15,7,13,5].map(v => v * 17);

function pixelsFromImageData(
  data: ImageData,
  opts: { threshold: number; brightness: number; contrast: number; invert: boolean; dither: DitherMode }
): number[] {
  const { threshold, brightness, contrast, invert, dither } = opts;
  const grays = new Float32Array(OLED_W * OLED_H);
  for (let i = 0; i < OLED_W * OLED_H; i++) {
    const r = data.data[i * 4], g = data.data[i * 4 + 1], b = data.data[i * 4 + 2];
    grays[i] = applyBC(0.299 * r + 0.587 * g + 0.114 * b, brightness, contrast);
  }
  let bits: number[];
  if (dither === "floyd") {
    bits = floydSteinberg(grays, OLED_W, OLED_H);
  } else if (dither === "ordered") {
    bits = Array.from(grays).map((v, i) => {
      const bv = BAYER4[(Math.floor(i / OLED_W) % 4) * 4 + (i % OLED_W) % 4];
      return v < bv ? 1 : 0;
    });
  } else {
    bits = Array.from(grays).map(v => v < threshold ? 1 : 0);
  }
  return invert ? bits.map(v => v ^ 1) : bits;
}

function drawSourceToCanvas(
  ctx: CanvasRenderingContext2D,
  src: HTMLImageElement | HTMLVideoElement,
  scaleMode: ScaleMode
) {
  const sw = src instanceof HTMLImageElement ? src.naturalWidth  : (src as HTMLVideoElement).videoWidth;
  const sh = src instanceof HTMLImageElement ? src.naturalHeight : (src as HTMLVideoElement).videoHeight;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, OLED_W, OLED_H);
  if (!sw || !sh) return;
  if (scaleMode === "stretch") {
    ctx.drawImage(src, 0, 0, OLED_W, OLED_H);
  } else if (scaleMode === "fit") {
    const s = Math.min(OLED_W / sw, OLED_H / sh);
    ctx.drawImage(src, (OLED_W - sw * s) / 2, (OLED_H - sh * s) / 2, sw * s, sh * s);
  } else { // fill
    const s = Math.max(OLED_W / sw, OLED_H / sh);
    ctx.drawImage(src, (OLED_W - sw * s) / 2, (OLED_H - sh * s) / 2, sw * s, sh * s);
  }
}

// ─── MediaImporter component ───────────────────────────────────────────────────
interface ImportOpts {
  threshold: number; brightness: number; contrast: number;
  invert: boolean; dither: DitherMode; scaleMode: ScaleMode;
  fps: number; maxFrames: number;
  videoStart: number; videoEnd: number;
}

const DEFAULT_IMPORT_OPTS: ImportOpts = {
  threshold: 128, brightness: 0, contrast: 1.2,
  invert: false, dither: "floyd", scaleMode: "fit",
  fps: 10, maxFrames: 48,
  videoStart: 0, videoEnd: 0,
};

interface MediaImporterProps {
  onApply: (frames: number[][], fps: number) => void;
  onClose: () => void;
}

function MediaImporter({ onApply, onClose }: MediaImporterProps) {
  const [opts, setOpts] = useState<ImportOpts>(DEFAULT_IMPORT_OPTS);
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [preview, setPreview] = useState<number[] | null>(null);   // first frame pixels
  const [frames, setFrames] = useState<number[][]>([]);
  const [fileType, setFileType] = useState<"image" | "gif" | "video" | null>(null);
  const [fileName, setFileName] = useState("");
  const [videoDuration, setVideoDuration] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileRef  = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const setOpt = <K extends keyof ImportOpts>(k: K, v: ImportOpts[K]) =>
    setOpts(o => ({ ...o, [k]: v }));

  // Re-process when opts change and we have a source loaded
  const srcRef = useRef<HTMLImageElement | HTMLVideoElement | null>(null);

  const renderPreview = useCallback((px: number[]) => {
    const pc = previewCanvasRef.current;
    if (!pc) return;
    const ctx = pc.getContext("2d")!;
    const img = ctx.createImageData(OLED_W, OLED_H);
    for (let i = 0; i < OLED_W * OLED_H; i++) {
      const v = px[i] ? 0 : 255;
      img.data[i * 4] = v; img.data[i * 4 + 1] = v;
      img.data[i * 4 + 2] = v; img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }, []);

  const processSource = useCallback(async (src: HTMLImageElement | HTMLVideoElement, type: "image" | "gif" | "video") => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    if (type === "image" || type === "gif") {
      // For still image OR single-frame GIF: capture immediately
      drawSourceToCanvas(ctx, src, opts.scaleMode);
      const data = ctx.getImageData(0, 0, OLED_W, OLED_H);
      const px = pixelsFromImageData(data, opts);
      renderPreview(px);
      setPreview(px);

      if (type === "gif") {
        // Capture multiple frames from animated GIF by interval sampling
        setStatusMsg("Capturing GIF frames…");
        const captured: number[][] = [];
        const interval = Math.round(1000 / opts.fps);
        let lastHash = "";
        await new Promise<void>(res => {
          const id = setInterval(() => {
            drawSourceToCanvas(ctx, src, opts.scaleMode);
            const d = ctx.getImageData(0, 0, OLED_W, OLED_H);
            const p = pixelsFromImageData(d, opts);
            // Simple hash: sample 32 pixels evenly
            const hash = Array.from({ length: 32 }, (_, i) => p[Math.floor(i * OLED_W * OLED_H / 32)]).join("");
            if (hash !== lastHash) { captured.push(p); lastHash = hash; }
            if (captured.length >= opts.maxFrames) { clearInterval(id); res(); }
          }, interval);
          // Stop after 4 seconds max
          setTimeout(() => { clearInterval(id); res(); }, 4000);
        });
        const result = captured.length > 0 ? captured : [px];
        setFrames(result);
        setStatusMsg(`✅ ${result.length} frame${result.length !== 1 ? "s" : ""} captured`);
        renderPreview(result[0]);
      } else {
        setFrames([px]);
        setStatusMsg("✅ Image converted");
      }
    } else {
      // VIDEO: seek to each timestamp
      const video = src as HTMLVideoElement;
      const start = opts.videoStart || 0;
      const end   = opts.videoEnd > start ? opts.videoEnd : video.duration;
      const duration = end - start;
      const total = Math.min(opts.maxFrames, Math.ceil(duration * opts.fps));
      const captured: number[][] = [];

      setStatusMsg(`Extracting ${total} frames…`);
      for (let i = 0; i < total; i++) {
        video.currentTime = start + (i / opts.fps);
        await new Promise<void>(res => { video.onseeked = () => res(); });
        drawSourceToCanvas(ctx, video, opts.scaleMode);
        const d = ctx.getImageData(0, 0, OLED_W, OLED_H);
        captured.push(pixelsFromImageData(d, opts));
        if (i === 0) { renderPreview(captured[0]); }
        setStatusMsg(`Extracting frame ${i + 1} / ${total}…`);
      }
      setFrames(captured);
      setStatusMsg(`✅ ${captured.length} frames extracted`);
      if (captured.length > 0) renderPreview(captured[0]);
    }
    setStatus("done");
  }, [opts, renderPreview]);

  const loadFile = useCallback(async (file: File) => {
    setStatus("processing");
    setFrames([]); setPreview(null);
    setFileName(file.name);

    const isGif   = file.type === "image/gif";
    const isVideo = file.type.startsWith("video/");
    const type: "image" | "gif" | "video" = isVideo ? "video" : isGif ? "gif" : "image";
    setFileType(type);

    const url = URL.createObjectURL(file);

    if (type === "video") {
      const video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.preload = "metadata";
      video.src = url;
      srcRef.current = video;
      video.onloadedmetadata = () => {
        setVideoDuration(video.duration);
        setOpt("videoEnd", Math.round(video.duration * 10) / 10);
        processSource(video, "video");
      };
      video.onerror = () => { setStatus("error"); setStatusMsg("Could not load video"); };
    } else {
      const img = new Image();
      img.crossOrigin = "anonymous";
      srcRef.current = img;
      img.onload = () => processSource(img, type);
      img.onerror = () => { setStatus("error"); setStatusMsg("Could not load image"); };
      img.src = url;
    }
  }, [processSource]);

  // Re-process when options change and source is available
  useEffect(() => {
    if (srcRef.current && fileType) {
      processSource(srcRef.current, fileType);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.threshold, opts.brightness, opts.contrast, opts.invert, opts.dither, opts.scaleMode]);

  const SLIDER = "w-full h-1.5 rounded-full accent-violet-500";
  const OPT_LABEL = "text-[9px] text-zinc-500 uppercase tracking-wider font-bold";
  const BADGE = (active: boolean) =>
    `px-2 py-0.5 rounded-lg text-[9px] font-bold border transition-all cursor-pointer ${
      active ? "bg-violet-500/20 border-violet-500/50 text-violet-300"
             : "border-[#2a2a32] text-zinc-500 hover:border-zinc-600"
    }`;

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Drop zone */}
      <div
        className={`rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-all ${
          dragOver ? "border-violet-400 bg-violet-500/10" : "border-[#2d2d35] bg-[#0c0c10] hover:border-zinc-600"
        }`}
        onClick={() => fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) loadFile(f); }}
      >
        <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); }} />
        {fileName
          ? <p className="text-xs font-semibold text-zinc-300">{fileName}</p>
          : <>
              <p className="text-2xl mb-1">📷</p>
              <p className="text-xs font-semibold text-zinc-300">Drop image, GIF, or video here</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">PNG · JPG · GIF · MP4 · WebM</p>
            </>
        }
      </div>

      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} width={OLED_W} height={OLED_H} className="hidden" />

      <div className="flex gap-3 flex-1 min-h-0 overflow-y-auto">
        {/* Options */}
        <div className="flex flex-col gap-2.5 w-48 flex-shrink-0">
          {/* Scale */}
          <div>
            <p className={OPT_LABEL + " mb-1"}>Scale Mode</p>
            <div className="flex gap-1">
              {(["fit","fill","stretch"] as ScaleMode[]).map(m => (
                <span key={m} className={BADGE(opts.scaleMode === m)} onClick={() => setOpt("scaleMode", m)}>
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Dither */}
          <div>
            <p className={OPT_LABEL + " mb-1"}>Dithering</p>
            <div className="flex gap-1 flex-wrap">
              {([["none","Off"],["floyd","Floyd"],["ordered","Ordered"]] as [DitherMode,string][]).map(([m,l]) => (
                <span key={m} className={BADGE(opts.dither === m)} onClick={() => setOpt("dither", m)}>{l}</span>
              ))}
            </div>
          </div>

          {/* Threshold (only shown when dither = none) */}
          {opts.dither === "none" && (
            <div>
              <div className="flex justify-between mb-1">
                <p className={OPT_LABEL}>Threshold</p>
                <span className="text-[9px] font-mono text-violet-400">{opts.threshold}</span>
              </div>
              <input type="range" min={0} max={255} value={opts.threshold}
                onChange={e => setOpt("threshold", +e.target.value)} className={SLIDER} />
            </div>
          )}

          {/* Brightness */}
          <div>
            <div className="flex justify-between mb-1">
              <p className={OPT_LABEL}>Brightness</p>
              <span className="text-[9px] font-mono text-violet-400">{opts.brightness > 0 ? "+" : ""}{opts.brightness}</span>
            </div>
            <input type="range" min={-128} max={128} value={opts.brightness}
              onChange={e => setOpt("brightness", +e.target.value)} className={SLIDER} />
          </div>

          {/* Contrast */}
          <div>
            <div className="flex justify-between mb-1">
              <p className={OPT_LABEL}>Contrast</p>
              <span className="text-[9px] font-mono text-violet-400">{opts.contrast.toFixed(1)}×</span>
            </div>
            <input type="range" min={0.1} max={4} step={0.1} value={opts.contrast}
              onChange={e => setOpt("contrast", +e.target.value)} className={SLIDER} />
          </div>

          {/* Invert */}
          <div className="flex items-center justify-between">
            <p className={OPT_LABEL}>Invert</p>
            <button onClick={() => setOpt("invert", !opts.invert)}
              className={`w-8 h-4 rounded-full transition-all relative ${opts.invert ? "bg-violet-500" : "bg-[#2a2a32]"}`}>
              <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${opts.invert ? "left-4" : "left-0.5"}`} />
            </button>
          </div>

          {/* GIF/Video controls */}
          {(fileType === "gif" || fileType === "video") && (
            <>
              <div className="h-px bg-[#2a2a32]" />
              <div>
                <div className="flex justify-between mb-1">
                  <p className={OPT_LABEL}>Capture FPS</p>
                  <span className="text-[9px] font-mono text-violet-400">{opts.fps}</span>
                </div>
                <input type="range" min={1} max={24} value={opts.fps}
                  onChange={e => setOpt("fps", +e.target.value)} className={SLIDER} />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <p className={OPT_LABEL}>Max Frames</p>
                  <span className="text-[9px] font-mono text-violet-400">{opts.maxFrames}</span>
                </div>
                <input type="range" min={1} max={120} value={opts.maxFrames}
                  onChange={e => setOpt("maxFrames", +e.target.value)} className={SLIDER} />
              </div>
              {fileType === "video" && videoDuration > 0 && (
                <>
                  <div>
                    <div className="flex justify-between mb-1">
                      <p className={OPT_LABEL}>Start (s)</p>
                      <span className="text-[9px] font-mono text-violet-400">{opts.videoStart.toFixed(1)}</span>
                    </div>
                    <input type="range" min={0} max={Math.max(0, videoDuration - 0.1)} step={0.1}
                      value={opts.videoStart} onChange={e => setOpt("videoStart", +e.target.value)} className={SLIDER} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <p className={OPT_LABEL}>End (s)</p>
                      <span className="text-[9px] font-mono text-violet-400">{opts.videoEnd.toFixed(1)}</span>
                    </div>
                    <input type="range" min={opts.videoStart + 0.1} max={videoDuration} step={0.1}
                      value={opts.videoEnd} onChange={e => setOpt("videoEnd", +e.target.value)} className={SLIDER} />
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Preview */}
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <p className={OPT_LABEL}>Preview — 128×64 OLED</p>
          <div className="rounded-xl border border-[#2a2a32] bg-black overflow-hidden flex items-center justify-center"
            style={{ aspectRatio: "2/1" }}>
            {status === "processing"
              ? <div className="text-[10px] text-zinc-500 flex flex-col items-center gap-2">
                  <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                  <span>{statusMsg || "Processing…"}</span>
                </div>
              : preview
                ? <canvas ref={previewCanvasRef} width={OLED_W} height={OLED_H}
                    style={{ width: "100%", imageRendering: "pixelated" }} />
                : <div className="text-[10px] text-zinc-700">Upload a file to see preview</div>
            }
          </div>
          {/* Status */}
          {statusMsg && status !== "processing" && (
            <p className={`text-[10px] font-semibold ${status === "done" ? "text-green-400" : "text-red-400"}`}>
              {statusMsg}
            </p>
          )}
          {frames.length > 1 && (
            <p className="text-[10px] text-zinc-500">
              {frames.length} frames · {opts.fps} fps · ~{(frames.length / opts.fps).toFixed(1)}s loop
            </p>
          )}
          {/* Apply button */}
          <button
            onClick={() => { if (frames.length > 0) { onApply(frames, opts.fps); onClose(); } }}
            disabled={frames.length === 0 || status === "processing"}
            className="mt-auto w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:from-violet-600 hover:to-fuchsia-600 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            {frames.length > 1
              ? `Apply ${frames.length} Frames to Designer`
              : "Apply to Designer"}
          </button>
          <button onClick={onClose} className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors text-center">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const hex = bytes.map((b) => `\\x${b.toString(16).padStart(2, "0")}`).join("");
  return hex;
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

  const lines = [header,
    `import time`,
    `_frames_${name} = [`];
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

function OLEDDesigner({ onAddNode }: { onAddNode?: (type: string, data: Record<string, unknown>) => void }) {
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

  // Draw canvas
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

  // Playback
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

        {/* Name */}
        <div>
          <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1 font-bold">Name</div>
          <input value={designName} onChange={(e) => setDesignName(e.target.value)}
            className="w-full text-[10px] font-mono bg-[#0c0c10] border border-[#1e1e26] rounded-lg px-2 py-1.5 text-white outline-none" />
        </div>

        {/* FPS */}
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
        {/* Frame bar */}
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

          {/* Import Media */}
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

        {/* Import Media Panel */}
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

        {/* Canvas */}
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

// ─── NeoPixel Designer ─────────────────────────────────────────────────────────
function wheel(pos: number): [number, number, number] {
  pos = 255 - (pos % 256);
  if (pos < 85) return [255 - pos * 3, 0, pos * 3];
  if (pos < 170) { pos -= 85; return [0, pos * 3, 255 - pos * 3]; }
  pos -= 170; return [pos * 3, 255 - pos * 3, 0];
}

type RGB = [number, number, number];
const PALETTE: RGB[] = [
  [255,0,0],[255,165,0],[255,255,0],[0,255,0],[0,255,255],
  [0,0,255],[128,0,255],[255,0,255],[255,255,255],[128,128,128],[0,0,0],
];

const NEOPIXEL_EFFECTS = [
  { id: "rainbow_wave", name: "🌈 Rainbow Wave" },
  { id: "pulse_red", name: "❤️ Pulse Red" },
  { id: "chase_white", name: "⚡ Chase White" },
  { id: "twinkle", name: "✨ Twinkle" },
  { id: "fire", name: "🔥 Fire" },
  { id: "ocean", name: "🌊 Ocean" },
];

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
  const lines = [header,
    `import time`,
    `_frames_${safeName} = [`];
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

function NeoPixelDesigner({ onAddNode }: { onAddNode?: (type: string, data: Record<string, unknown>) => void }) {
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
    const ef = buildEffectFrames(id, effectiveLedCount);
    setFrames(ef);
    setCurFrame(0);
    setPlaying(false);
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
        </div>
        <div>
          <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1 font-bold">FPS: {fps}</div>
          <input type="range" min={1} max={30} value={fps} onChange={(e) => setFps(+e.target.value)} className="w-full accent-violet-500" />
        </div>
      </div>

      {/* Center: LED canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Frame bar */}
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

        {/* LEDs */}
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

// ─── Matrix Designer (MAX7219) ─────────────────────────────────────────────────
const FONT5: Record<string, number[]> = {
  " ":[0,0,0,0,0],"A":[126,17,17,17,126],"B":[127,73,73,73,54],"C":[62,65,65,65,34],
  "D":[127,65,65,34,28],"E":[127,73,73,73,65],"F":[127,9,9,9,1],"G":[62,65,73,73,122],
  "H":[127,8,8,8,127],"I":[0,65,127,65,0],"J":[32,64,65,63,1],"K":[127,8,20,34,65],
  "L":[127,64,64,64,64],"M":[127,2,4,2,127],"N":[127,4,8,16,127],"O":[62,65,65,65,62],
  "P":[127,9,9,9,6],"Q":[62,65,81,33,94],"R":[127,9,25,41,70],"S":[70,73,73,73,49],
  "T":[1,1,127,1,1],"U":[63,64,64,64,63],"V":[31,32,64,32,31],"W":[63,64,32,64,63],
  "X":[99,20,8,20,99],"Y":[7,8,112,8,7],"Z":[97,81,73,69,67],
  "0":[62,81,73,69,62],"1":[0,66,127,64,0],"2":[66,97,81,73,70],"3":[33,65,69,75,49],
  "4":[24,20,18,127,16],"5":[39,69,69,69,57],"6":[60,74,73,73,48],"7":[1,113,9,5,3],
  "8":[54,73,73,73,54],"9":[6,73,73,41,30],"!":[0,0,95,0,0],".":[0,96,96,0,0],
  ",":[0,80,48,0,0],"?":[2,1,81,9,6],
};

function textToMatrixFrames(text: string, modules: number): number[][] {
  const cols = text.toUpperCase().split("").flatMap((c) => [...(FONT5[c] ?? FONT5[" "]), 0]);
  const frames: number[][] = [];
  const totalCols = modules * 8;
  for (let offset = 0; offset < cols.length; offset++) {
    const frame = new Array(modules * 8 * 8).fill(0);
    for (let col = 0; col < totalCols; col++) {
      const srcCol = cols[offset + col] ?? 0;
      for (let row = 0; row < 8; row++) {
        if (srcCol & (1 << row)) frame[row * totalCols + col] = 1;
      }
    }
    frames.push(frame);
    if (offset + totalCols >= cols.length) break;
  }
  return frames.length > 0 ? frames : [new Array(modules * 8 * 8).fill(0)];
}

const MATRIX_ANIMS = [
  { id: "flash", name: "Flash" },
  { id: "checker", name: "Checkerboard" },
  { id: "row_wipe", name: "Row Wipe" },
  { id: "col_wipe", name: "Column Wipe" },
  { id: "rain", name: "Rain" },
  { id: "spiral", name: "Spiral" },
];

function buildMatrixAnim(id: string, modules: number): number[][] {
  const W = modules * 8, H = 8, blank = new Array(W * H).fill(0);
  const full = new Array(W * H).fill(1);
  switch (id) {
    case "flash":
      return Array.from({ length: 6 }, (_, i) => i % 2 === 0 ? [...full] : [...blank]);
    case "checker":
      return [
        Array.from({ length: W * H }, (_, i) => ((Math.floor(i / W) + i % W) % 2) as 0 | 1),
        Array.from({ length: W * H }, (_, i) => (((Math.floor(i / W) + i % W) + 1) % 2) as 0 | 1),
      ];
    case "row_wipe":
      return Array.from({ length: H * 2 }, (_, s) =>
        Array.from({ length: W * H }, (__, i) => Math.floor(i / W) <= (s < H ? s : H - 1 - (s - H)) ? 1 : 0));
    case "col_wipe":
      return Array.from({ length: W * 2 }, (_, s) =>
        Array.from({ length: W * H }, (__, i) => (i % W) <= (s < W ? s : W - 1 - (s - W)) ? 1 : 0));
    case "rain":
      return Array.from({ length: 20 }, (_, frame) =>
        Array.from({ length: W * H }, (__, i) => {
          const col = i % W, row = Math.floor(i / W);
          return ((col * 3 + frame) % H) === row ? 1 : 0;
        }));
    case "spiral": {
      const frames: number[][] = [];
      const order: number[] = [];
      let [tl, tr, bl, br] = [0, W-1, (H-1)*W, H*W-1];
      while (tl < br) {
        for (let i=tl%W;i<=tr%W;i++) order.push(Math.floor(tl/W)*W+i);
        for (let i=Math.floor(tl/W)+1;i<=Math.floor(br/W);i++) order.push(i*W+tr%W);
        if (Math.floor(tl/W) < Math.floor(br/W)) { for (let i=br%W-1;i>=bl%W;i--) order.push(Math.floor(br/W)*W+i); }
        if (tl%W < br%W) { for (let i=Math.floor(br/W)-1;i>Math.floor(tl/W);i--) order.push(i*W+bl%W); }
        tl+=W+1; tr+=W-1; bl-=W-1; br-=W+1;
      }
      for (let s=0;s<order.length;s++) {
        const f=new Array(W*H).fill(0);
        for (let i=0;i<=s;i++) f[order[i]]=1;
        frames.push(f);
      }
      return frames;
    }
    default: return [blank];
  }
}

function generateMatrixCode(frames: number[][], modules: number, fps: number, name: string): string {
  const W = modules * 8;
  // Board SPI wiring for MAX7219: sck=11, mosi=10, miso=12, cs=13
  const lines = [
    `# MAX7219 Matrix — ${name} (${modules} module${modules > 1 ? "s" : ""}, ${W}×8, ${fps} fps)`,
    `from machine import SPI, Pin`,
    `import max7219, time`,
    `_spi = SPI(1, baudrate=10_000_000, polarity=0, phase=0, sck=Pin(11), mosi=Pin(10), miso=Pin(12))`,
    `_cs  = Pin(13, Pin.OUT)`,
    `_mat = max7219.Matrix8x8(_spi, _cs, ${modules})`,
    `_mat.brightness(8)`,
    `_frames = [`];
  frames.slice(0, 60).forEach((f) => {
    const rows = Array.from({ length: 8 }, (_, r) => {
      let byte = 0;
      for (let c = 0; c < W; c++) if (f[r * W + c]) byte |= (1 << c);
      return byte;
    });
    lines.push(`    bytes([${rows.join(", ")}]),`);
  });
  lines.push(`]`);
  lines.push(`while True:`);
  lines.push(`    for _f in _frames:`);
  lines.push(`        _mat.fill(0)`);
  lines.push(`        for _r in range(8): _mat.row(_r, _f[_r])`);
  lines.push(`        _mat.show()`);
  lines.push(`        time.sleep_ms(${Math.round(1000 / fps)})`);
  return lines.join("\n");
}

function MatrixDesigner({ onAddNode }: { onAddNode?: (type: string, data: Record<string, unknown>) => void }) {
  const [modules, setModules] = useState(1);
  const [frames, setFrames] = useState<number[][]>([new Array(64).fill(0)]);
  const [curFrame, setCurFrame] = useState(0);
  const [fps, setFps] = useState(8);
  const [playing, setPlaying] = useState(false);
  const [playFrame, setPlayFrame] = useState(0);
  const [tab, setTab] = useState<"draw" | "anims" | "text">("draw");
  const [scrollText, setScrollText] = useState("KAKOON ");
  const [designName, setDesignName] = useState("MatrixAnim");
  const [copied, setCopied] = useState(false);
  const [addedToCanvas, setAddedToCanvas] = useState(false);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const W = modules * 8;

  useEffect(() => {
    setFrames([new Array(W * 8).fill(0)]);
  }, [W]);

  useEffect(() => {
    if (playing) {
      playRef.current = setInterval(() => setPlayFrame((p) => p + 1), 1000 / fps);
    } else {
      if (playRef.current) clearInterval(playRef.current);
    }
    return () => { if (playRef.current) clearInterval(playRef.current); };
  }, [playing, fps]);

  const togglePixel = (x: number, y: number) => {
    setFrames((prev) => {
      const u = [...prev], f = [...u[curFrame]];
      f[y * W + x] ^= 1;
      u[curFrame] = f;
      return u;
    });
  };

  const displayFrame = playing ? frames[playFrame % frames.length] : frames[curFrame];

  const code = generateMatrixCode(frames, modules, fps, designName);

  return (
    <div className="flex h-full">
      {/* Left: tabs + controls */}
      <div className="w-[160px] flex-shrink-0 border-r border-[#1a1a20] flex flex-col">
        <div className="flex flex-col border-b border-[#1a1a20]">
          {(["draw","anims","text"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-[10px] font-bold px-3 py-2 text-left transition-all ${tab===t ? "bg-violet-500/15 text-violet-400 border-l-2 border-violet-500" : "text-zinc-500 hover:text-zinc-300 border-l-2 border-transparent"}`}>
              {t === "draw" ? "✏️ Draw" : t === "anims" ? "🎬 Animations" : "📝 Scroll Text"}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
          <div>
            <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1 font-bold">Modules</div>
            <div className="flex gap-1">
              {[1,2,3,4].map((n) => (
                <button key={n} onClick={() => setModules(n)}
                  className={`flex-1 py-1 text-[10px] font-bold rounded transition-all ${n===modules ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "text-zinc-500 border border-[#2a2a32]"}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {tab === "anims" && (
            <div className="flex flex-col gap-1">
              {MATRIX_ANIMS.map((a) => (
                <button key={a.id} onClick={() => { const f = buildMatrixAnim(a.id, modules); setFrames(f); setCurFrame(0); setPlaying(false); }}
                  className="text-left text-[10px] text-zinc-400 hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/5 transition-all">
                  {a.name}
                </button>
              ))}
            </div>
          )}

          {tab === "text" && (
            <div className="flex flex-col gap-2">
              <div>
                <div className="text-[9px] text-zinc-600 mb-1">Text to scroll</div>
                <input value={scrollText} onChange={(e) => setScrollText(e.target.value)}
                  className="w-full text-[10px] font-mono bg-[#0c0c10] border border-[#1e1e26] rounded px-2 py-1.5 text-amber-400 uppercase outline-none" />
              </div>
              <button onClick={() => { const f = textToMatrixFrames(scrollText, modules); setFrames(f); setCurFrame(0); setPlaying(false); }}
                className="py-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold transition-all hover:bg-amber-500/30">
                Generate Scroll
              </button>
            </div>
          )}

          <div>
            <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1 font-bold">FPS: {fps}</div>
            <input type="range" min={1} max={30} value={fps} onChange={(e) => setFps(+e.target.value)} className="w-full accent-amber-500" />
          </div>
          <div>
            <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-1 font-bold">Name</div>
            <input value={designName} onChange={(e) => setDesignName(e.target.value)}
              className="w-full text-[10px] bg-[#0c0c10] border border-[#1e1e26] rounded px-2 py-1 text-white outline-none" />
          </div>
        </div>
      </div>

      {/* Center: grid */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Frame bar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[#1a1a20]">
          {frames.slice(0, 30).map((_, i) => (
            <button key={i} onClick={() => { setCurFrame(i); setPlaying(false); }}
              className={`px-2 py-0.5 rounded text-[9px] font-bold ${i===curFrame ? "bg-amber-500/20 text-amber-400" : "text-zinc-600"}`}>
              {i+1}
            </button>
          ))}
          {frames.length > 30 && <span className="text-[9px] text-zinc-600">+{frames.length-30}</span>}
          <button onClick={() => setFrames((p) => [...p, [...p[p.length-1]]])}
            className="px-2 py-0.5 rounded text-[9px] text-zinc-500 hover:text-green-400 border border-[#2a2a32]">
            + Frame
          </button>
          {frames.length > 1 && (
            <button onClick={() => setPlaying(!playing)}
              className={`ml-auto flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold ${playing ? "bg-amber-500/20 text-amber-400" : "bg-amber-500/20 text-amber-300"}`}>
              {playing ? <><Pause className="w-3 h-3" /> Stop</> : <><Play className="w-3 h-3" /> Play</>}
            </button>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col gap-1">
            {Array.from({ length: 8 }, (_, row) => (
              <div key={row} className="flex gap-1">
                {Array.from({ length: W }, (_, col) => {
                  const on = displayFrame[row * W + col];
                  return (
                    <button key={col}
                      onClick={() => tab === "draw" && togglePixel(col, row)}
                      className="rounded transition-all hover:scale-110"
                      style={{
                        width: Math.max(12, Math.min(28, Math.floor(360 / W))),
                        height: Math.max(12, Math.min(28, Math.floor(360 / W))),
                        background: on ? "#fbbf24" : "#1a1208",
                        boxShadow: on ? "0 0 8px #fbbf2480" : "none",
                        border: on ? "1px solid #f59e0b" : "1px solid #2a2010",
                      }} />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
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
        <pre className="flex-1 overflow-auto p-3 text-[9px] font-mono text-amber-400 leading-relaxed bg-[#050507]">
          {code}
        </pre>
        {onAddNode && (
          <div className="px-3 py-2.5 border-t border-[#1a1a20]">
            <button
              onClick={() => {
                onAddNode("max7219", { modules, width: modules, height: 1 });
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

// ─── DesignerHub Modal ─────────────────────────────────────────────────────────
interface DesignerHubProps {
  onClose: () => void;
  onAddNode?: (type: string, data: Record<string, unknown>) => void;
}

export function DesignerHub({ onClose, onAddNode }: DesignerHubProps) {
  const [activeTab, setActiveTab] = useState<"oled" | "neopixel" | "matrix">("oled");

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-2">
      <div className="w-full h-full max-w-[1400px] max-h-[92vh] overflow-hidden rounded-2xl border border-[#2a2a32] bg-[#0a0a0d] shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a20] bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-sm">🎨</div>
            <div>
              <h2 className="text-sm font-bold text-white">Designer Hub</h2>
              <p className="text-[10px] text-zinc-500">Create pixel art, animations, and LED effects</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Tabs */}
            <div className="flex rounded-xl border border-[#2a2a32] overflow-hidden">
              <Tab label="OLED Display" icon="🖥️" active={activeTab === "oled"} onClick={() => setActiveTab("oled")} />
              <Tab label="NeoPixel LEDs" icon="💡" active={activeTab === "neopixel"} onClick={() => setActiveTab("neopixel")} />
              <Tab label="LED Matrix" icon="⬛" active={activeTab === "matrix"} onClick={() => setActiveTab("matrix")} />
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "oled" && <OLEDDesigner onAddNode={onAddNode} />}
          {activeTab === "neopixel" && <NeoPixelDesigner onAddNode={onAddNode} />}
          {activeTab === "matrix" && <MatrixDesigner onAddNode={onAddNode} />}
        </div>
      </div>
    </div>,
    document.body
  );
}
