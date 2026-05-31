import { useState, useRef, useCallback, useEffect } from "react";
import { PlusCircle } from "lucide-react";
import {
  OLED_W, OLED_H,
  type DitherMode, type ScaleMode,
  pixelsFromImageData, drawSourceToCanvas,
} from "../../../lib/imageUtils";

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

export interface MediaImporterProps {
  onApply: (frames: number[][], fps: number) => void;
  onClose: () => void;
}

export function MediaImporter({ onApply, onClose }: MediaImporterProps) {
  const [opts, setOpts] = useState<ImportOpts>(DEFAULT_IMPORT_OPTS);
  const [status, setStatus] = useState<"idle" | "processing" | "done" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");
  const [preview, setPreview] = useState<number[] | null>(null);
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
      drawSourceToCanvas(ctx, src, opts.scaleMode);
      const data = ctx.getImageData(0, 0, OLED_W, OLED_H);
      const px = pixelsFromImageData(data, opts);
      renderPreview(px);
      setPreview(px);

      if (type === "gif") {
        setStatusMsg("Capturing GIF frames…");
        const captured: number[][] = [];
        const interval = Math.round(1000 / opts.fps);
        let lastHash = "";
        await new Promise<void>(res => {
          const id = setInterval(() => {
            drawSourceToCanvas(ctx, src, opts.scaleMode);
            const d = ctx.getImageData(0, 0, OLED_W, OLED_H);
            const p = pixelsFromImageData(d, opts);
            const hash = Array.from({ length: 32 }, (_, i) => p[Math.floor(i * OLED_W * OLED_H / 32)]).join("");
            if (hash !== lastHash) { captured.push(p); lastHash = hash; }
            if (captured.length >= opts.maxFrames) { clearInterval(id); res(); }
          }, interval);
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

      <canvas ref={canvasRef} width={OLED_W} height={OLED_H} className="hidden" />

      <div className="flex gap-3 flex-1 min-h-0 overflow-y-auto">
        <div className="flex flex-col gap-2.5 w-48 flex-shrink-0">
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

          <div>
            <p className={OPT_LABEL + " mb-1"}>Dithering</p>
            <div className="flex gap-1 flex-wrap">
              {([["none","Off"],["floyd","Floyd"],["ordered","Ordered"]] as [DitherMode,string][]).map(([m,l]) => (
                <span key={m} className={BADGE(opts.dither === m)} onClick={() => setOpt("dither", m)}>{l}</span>
              ))}
            </div>
          </div>

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

          <div>
            <div className="flex justify-between mb-1">
              <p className={OPT_LABEL}>Brightness</p>
              <span className="text-[9px] font-mono text-violet-400">{opts.brightness > 0 ? "+" : ""}{opts.brightness}</span>
            </div>
            <input type="range" min={-128} max={128} value={opts.brightness}
              onChange={e => setOpt("brightness", +e.target.value)} className={SLIDER} />
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <p className={OPT_LABEL}>Contrast</p>
              <span className="text-[9px] font-mono text-violet-400">{opts.contrast.toFixed(1)}×</span>
            </div>
            <input type="range" min={0.1} max={4} step={0.1} value={opts.contrast}
              onChange={e => setOpt("contrast", +e.target.value)} className={SLIDER} />
          </div>

          <div className="flex items-center justify-between">
            <p className={OPT_LABEL}>Invert</p>
            <button onClick={() => setOpt("invert", !opts.invert)}
              className={`w-8 h-4 rounded-full transition-all relative ${opts.invert ? "bg-violet-500" : "bg-[#2a2a32]"}`}>
              <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${opts.invert ? "left-4" : "left-0.5"}`} />
            </button>
          </div>

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
          <button
            onClick={() => { if (frames.length > 0) { onApply(frames, opts.fps); onClose(); } }}
            disabled={frames.length === 0 || status === "processing"}
            className="mt-auto w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:from-violet-600 hover:to-fuchsia-600 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            {frames.length > 1 ? `Apply ${frames.length} Frames to Designer` : "Apply to Designer"}
          </button>
          <button onClick={onClose} className="text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors text-center">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
