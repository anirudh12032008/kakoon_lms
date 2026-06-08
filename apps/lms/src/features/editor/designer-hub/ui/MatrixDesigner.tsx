import { useState, useRef, useEffect } from "react";
import { Play, Pause, Copy, PlusCircle } from "lucide-react";

function copyText(s: string) { navigator.clipboard.writeText(s).catch(() => {}); }

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
  { id: "flash",    name: "Flash" },
  { id: "checker",  name: "Checkerboard" },
  { id: "row_wipe", name: "Row Wipe" },
  { id: "col_wipe", name: "Column Wipe" },
  { id: "rain",     name: "Rain" },
  { id: "spiral",   name: "Spiral" },
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
  const lines = [
    `# MAX7219 Matrix — ${name} (${modules} module${modules > 1 ? "s" : ""}, ${W}×8, ${fps} fps)`,
    `from machine import SPI, Pin`,
    `import max7219, time`,
    `_spi = SPI(1, baudrate=10_000_000, polarity=0, phase=0, sck=Pin(11), mosi=Pin(10))`,
    `_cs  = Pin(13, Pin.OUT)`,
    `_mat = max7219.Matrix8x8(_spi, _cs, ${modules})`,
    `_mat.brightness(8)`,
    `# Each frame: ${modules * 8} bytes — layout [row0_mod0, row0_mod1, ..., row7_mod${modules - 1}]`,
    `_frames = [`,
  ];
  // Encode: byte[row * modules + mod] = 8 pixels (always 0-255)
  frames.slice(0, 60).forEach((f) => {
    const bytes: number[] = [];
    for (let row = 0; row < 8; row++) {
      for (let mod = 0; mod < modules; mod++) {
        let b = 0;
        for (let bit = 0; bit < 8; bit++) {
          if (f[row * W + mod * 8 + bit]) b |= (1 << bit);
        }
        bytes.push(b);
      }
    }
    lines.push(`    bytes([${bytes.join(", ")}]),`);
  });
  lines.push(`]`);
  lines.push(`while True:`);
  lines.push(`    for _f in _frames:`);
  lines.push(`        _mat.fill(0)`);
  lines.push(`        for _r in range(8):`);
  lines.push(`            for _m in range(${modules}):`);
  lines.push(`                _b = _f[_r * ${modules} + _m]`);
  lines.push(`                _px = ${modules - 1} - _m`);
  lines.push(`                for _bit in range(8):`);
  lines.push(`                    if _b & (1 << _bit): _mat.pixel(_px * 8 + (7 - _bit), _r, 1)`);
  lines.push(`        _mat.show()`);
  lines.push(`        time.sleep_ms(${Math.round(1000 / fps)})`);
  return lines.join("\n");
}

export function MatrixDesigner({ onAddNode }: { onAddNode?: (type: string, data: Record<string, unknown>) => void }) {
  const [modules, setModules] = useState(1);
  const [frames, setFrames] = useState<number[][]>([new Array(64).fill(0)]);
  const [curFrame, setCurFrame] = useState(0);
  const [fps, setFps] = useState(8);
  const [playing, setPlaying] = useState(false);
  const [playFrame, setPlayFrame] = useState(0);
  const [tab, setTab] = useState<"draw" | "anims" | "text">("draw");
  const [scrollText, setScrollText] = useState("KOKOON ");
  const [designName, setDesignName] = useState("MatrixAnim");
  const [copied, setCopied] = useState(false);
  const [addedToCanvas, setAddedToCanvas] = useState(false);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dragFrame = useRef<number | null>(null);

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

  const removeFrame = (idx: number) => {
    setFrames((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((_, i) => i !== idx);
      setCurFrame((c) => Math.min(c >= idx ? c - 1 : c, next.length - 1));
      return next;
    });
    setPlaying(false);
  };

  const duplicateFrame = (idx: number) => {
    setFrames((prev) => [...prev.slice(0, idx + 1), [...prev[idx]], ...prev.slice(idx + 1)]);
    setCurFrame(idx + 1);
    setPlaying(false);
  };

  const moveFrame = (from: number, to: number) => {
    if (from === to) return;
    setFrames((prev) => {
      const next = [...prev];
      const [m] = next.splice(from, 1);
      next.splice(to, 0, m);
      return next;
    });
    setCurFrame(to);
    setPlaying(false);
  };

  const displayFrame = playing ? frames[playFrame % frames.length] : frames[curFrame];
  const code = generateMatrixCode(frames, modules, fps, designName);

  return (
    <div className="flex h-full">
      {/* Left: tabs + controls */}
      <div className="w-[160px] flex-shrink-0 border-r border-[var(--k-border)] flex flex-col">
        <div className="flex flex-col border-b border-[var(--k-border)]">
          {(["draw","anims","text"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-[10px] font-bold px-3 py-2 text-left transition-all ${tab===t ? "bg-violet-500/15 text-violet-400 border-l-2 border-violet-500" : "text-zinc-500 hover:text-[var(--k-text)] border-l-2 border-transparent"}`}>
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
                  className={`flex-1 py-1 text-[10px] font-bold rounded transition-all ${n===modules ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "text-zinc-500 border border-[var(--k-border)]"}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {tab === "anims" && (
            <div className="flex flex-col gap-1">
              {MATRIX_ANIMS.map((a) => (
                <button key={a.id} onClick={() => { const f = buildMatrixAnim(a.id, modules); setFrames(f); setCurFrame(0); setPlaying(false); }}
                  className="text-left text-[10px] text-[var(--k-muted)] hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/5 transition-all">
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
                  className="w-full text-[10px] font-mono bg-[var(--k-base-100)] border border-[var(--k-base-400)] rounded px-2 py-1.5 text-amber-400 uppercase outline-none" />
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
              className="w-full text-[10px] bg-[var(--k-base-100)] border border-[var(--k-base-400)] rounded px-2 py-1 text-white outline-none" />
          </div>
        </div>
      </div>

      {/* Center: grid */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--k-border)]">
          {frames.slice(0, 30).map((_, i) => (
            <div key={i} draggable
              onDragStart={() => { dragFrame.current = i; }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => { if (dragFrame.current !== null) moveFrame(dragFrame.current, i); dragFrame.current = null; }}
              title="Drag to reorder"
              className="flex items-center gap-0.5 cursor-move">
              <button onClick={() => { setCurFrame(i); setPlaying(false); }}
                className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${i===curFrame ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" : "text-zinc-600 hover:text-[var(--k-muted)]"}`}>
                {i+1}
              </button>
              {frames.length > 1 && (
                <button onClick={() => removeFrame(i)} title="Delete frame"
                  className="text-zinc-700 hover:text-red-400 text-[10px]">×</button>
              )}
            </div>
          ))}
          {frames.length > 30 && <span className="text-[9px] text-zinc-600">+{frames.length-30}</span>}
          <button onClick={() => { setFrames((p) => [...p, [...p[p.length-1]]]); setCurFrame(frames.length); setPlaying(false); }}
            className="px-2 py-0.5 rounded text-[9px] text-zinc-500 hover:text-green-400 border border-[var(--k-border)]">
            + Frame
          </button>
          <button onClick={() => duplicateFrame(curFrame)} title="Duplicate current frame"
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[9px] text-zinc-500 hover:text-amber-400 border border-[var(--k-border)] hover:border-amber-500/30">
            <Copy className="w-3 h-3" /> Dup
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
      <div className="w-[260px] flex-shrink-0 border-l border-[var(--k-border)] flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--k-border)]">
          <span className="text-[10px] text-[var(--k-muted)] font-bold uppercase tracking-wider">MicroPython Code</span>
          <button onClick={() => { copyText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold transition-all ${copied ? "bg-green-500/20 text-green-400" : "bg-white/5 text-[var(--k-muted)] border border-[var(--k-border)]"}`}>
            <Copy className="w-3 h-3" />{copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <pre className="flex-1 overflow-auto p-3 text-[9px] font-mono text-amber-400 leading-relaxed bg-[var(--k-base-100)]">
          {code}
        </pre>
        {onAddNode && (
          <div className="px-3 py-2.5 border-t border-[var(--k-border)] space-y-2">
            <button
              onClick={() => {
                onAddNode("max7219", {
                  modules,
                  matrixFrames: frames,
                  fps,
                  brightness: 8,
                  designName,
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
            <p className="text-[8px] text-zinc-700 text-center">
              {frames.length} frame{frames.length !== 1 ? "s" : ""} · {modules} module{modules !== 1 ? "s" : ""} · {fps} fps
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
