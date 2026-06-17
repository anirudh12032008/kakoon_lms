import { useState, useRef, useEffect } from "react";
import { Play, Pause, Copy, PlusCircle } from "lucide-react";
import { textToColumns } from "../lib/font5";

function copyText(s: string) { navigator.clipboard.writeText(s).catch(() => {}); }

function textToMatrixFrames(text: string, modules: number): number[][] {
  const cols = textToColumns(text);
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
  { id: "flash",    name: "⚡ Flash" },
  { id: "checker",  name: "🏁 Checkerboard" },
  { id: "row_wipe", name: "↕️ Row Wipe" },
  { id: "col_wipe", name: "↔️ Column Wipe" },
  { id: "rain",     name: "🌧 Rain" },
  { id: "spiral",   name: "🌀 Spiral" },
  { id: "heart",    name: "💓 Heartbeat" },
  { id: "bounce",   name: "🏀 Bouncing Ball" },
  { id: "wave",     name: "🌊 Wave" },
];

/** 8×8 heart shape (small + large) for the heartbeat preset. */
const HEART_SMALL = [
  "00000000",
  "00100100",
  "01111110",
  "01111110",
  "00111100",
  "00011000",
  "00000000",
  "00000000",
];
const HEART_BIG = [
  "01100110",
  "11111111",
  "11111111",
  "11111111",
  "01111110",
  "00111100",
  "00011000",
  "00000000",
];

function stampShape(shape: string[], modules: number, modIndex: number): number[] {
  const W = modules * 8;
  const f = new Array(W * 8).fill(0);
  shape.forEach((rowStr, row) => {
    rowStr.split("").forEach((ch, col) => {
      if (ch === "1") f[row * W + modIndex * 8 + col] = 1;
    });
  });
  return f;
}

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
    case "heart": {
      const mid = Math.floor(modules / 2);
      const small = stampShape(HEART_SMALL, modules, mid);
      const big = stampShape(HEART_BIG, modules, mid);
      return [small, small, big, big, small, big, small, small, blank.slice()];
    }
    case "bounce":
      return Array.from({ length: W * 2 - 2 }, (_, s) => {
        const x = s < W ? s : 2 * W - 2 - s;
        const y = Math.round(Math.abs(Math.sin((s / (W - 1)) * Math.PI * 2)) * (H - 2));
        const f = new Array(W * H).fill(0);
        const yy = H - 1 - y;
        f[yy * W + x] = 1;
        if (x > 0) f[yy * W + x - 1] = 1;
        if (yy > 0) f[(yy - 1) * W + x] = 1;
        return f;
      });
    case "wave":
      return Array.from({ length: 16 }, (_, frame) =>
        Array.from({ length: W * H }, (__, i) => {
          const col = i % W, row = Math.floor(i / W);
          const crest = Math.round(((Math.sin((col + frame) * 0.55) + 1) / 2) * (H - 1));
          return row >= crest ? 1 : 0;
        }));
    default: return [blank];
  }
}

/** Per-frame edit ops shared by the toolbar. */
function transformFrame(f: number[], W: number, op: "invert" | "clear" | "fill" | "left" | "right" | "up" | "down"): number[] {
  const H = f.length / W;
  switch (op) {
    case "invert": return f.map((p) => (p ? 0 : 1));
    case "clear":  return new Array(f.length).fill(0);
    case "fill":   return new Array(f.length).fill(1);
    case "left":   return f.map((_, i) => f[Math.floor(i / W) * W + ((i % W) + 1) % W]);
    case "right":  return f.map((_, i) => f[Math.floor(i / W) * W + ((i % W) + W - 1) % W]);
    case "up":     return f.map((_, i) => f[((Math.floor(i / W) + 1) % H) * W + (i % W)]);
    case "down":   return f.map((_, i) => f[((Math.floor(i / W) + H - 1) % H) * W + (i % W)]);
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
  // Drag-to-paint: the value (0/1) being painted while the mouse is held down.
  const paintValue = useRef<number | null>(null);
  const [onionSkin, setOnionSkin] = useState(true);

  const W = modules * 8;

  useEffect(() => {
    const up = () => { paintValue.current = null; };
    window.addEventListener("mouseup", up);
    return () => window.removeEventListener("mouseup", up);
  }, []);

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

  const setPixel = (x: number, y: number, value: number) => {
    setFrames((prev) => {
      const u = [...prev], f = [...u[curFrame]];
      if (f[y * W + x] === value) return prev;
      f[y * W + x] = value;
      u[curFrame] = f;
      return u;
    });
  };

  const applyOp = (op: Parameters<typeof transformFrame>[2]) => {
    setFrames((prev) => {
      const u = [...prev];
      u[curFrame] = transformFrame(u[curFrame], W, op);
      return u;
    });
    setPlaying(false);
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
      <div className="w-[272px] flex-shrink-0 border-r border-[var(--k-border)] bg-[var(--k-base-200)] flex flex-col">
        <div className="flex flex-col border-b border-[var(--k-border)]">
          {(["draw","anims","text"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-xs font-bold px-4 py-3 text-left transition-all ${tab===t ? "bg-violet-500/15 text-violet-400 border-l-[3px] border-violet-500" : "text-[var(--k-muted)] hover:text-[var(--k-text)] hover:bg-[var(--k-base-400)] border-l-[3px] border-transparent"}`}>
              {t === "draw" ? "✏️ Draw" : t === "anims" ? "🎬 Animations" : "📝 Scroll Text"}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--k-muted)] uppercase tracking-wider mb-2 font-bold before:content-[''] before:h-3 before:w-[3px] before:rounded-full before:bg-amber-500">Modules</div>
            <div className="flex gap-1">
              {[1,2,3,4].map((n) => (
                <button key={n} onClick={() => setModules(n)}
                  className={`flex-1 py-1 text-xs font-bold rounded transition-all ${n===modules ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "text-[var(--k-muted)] border border-[var(--k-border)]"}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {tab === "draw" && (
            <>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-[var(--k-muted)] uppercase tracking-wider mb-2 font-bold before:content-[''] before:h-3 before:w-[3px] before:rounded-full before:bg-amber-500">Edit Frame</div>
                <div className="grid grid-cols-3 gap-1">
                  {([
                    ["invert", "◑"], ["fill", "■"], ["clear", "□"],
                  ] as const).map(([op, icon]) => (
                    <button key={op} onClick={() => applyOp(op)} title={op}
                      className="py-1 rounded text-[11px] text-[var(--k-muted)] hover:text-amber-400 border border-[var(--k-border)] hover:border-amber-500/30 transition-all capitalize">
                      {icon}
                    </button>
                  ))}
                  {([
                    ["left", "←"], ["up", "↑"], ["right", "→"],
                  ] as const).map(([op, icon]) => (
                    <button key={op} onClick={() => applyOp(op)} title={`Shift ${op}`}
                      className="py-1 rounded text-[11px] text-[var(--k-muted)] hover:text-amber-400 border border-[var(--k-border)] hover:border-amber-500/30 transition-all">
                      {icon}
                    </button>
                  ))}
                  <div />
                  <button onClick={() => applyOp("down")} title="Shift down"
                    className="py-1 rounded text-[11px] text-[var(--k-muted)] hover:text-amber-400 border border-[var(--k-border)] hover:border-amber-500/30 transition-all">
                    ↓
                  </button>
                  <div />
                </div>
              </div>
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[11px] text-[var(--k-dim)] uppercase tracking-wider font-bold">Onion skin</span>
                <input type="checkbox" checked={onionSkin} onChange={(e) => setOnionSkin(e.target.checked)}
                  className="accent-amber-500" />
              </label>
            </>
          )}

          {tab === "anims" && (
            <div className="flex flex-col gap-1">
              {MATRIX_ANIMS.map((a) => (
                <button key={a.id} onClick={() => { const f = buildMatrixAnim(a.id, modules); setFrames(f); setCurFrame(0); setPlaying(false); }}
                  className="text-left text-xs text-[var(--k-muted)] hover:text-[var(--k-text)] px-2 py-1.5 rounded-lg border border-[var(--k-border)] hover:bg-[var(--k-base-400)] hover:border-[var(--k-dim)] transition-all">
                  {a.name}
                </button>
              ))}
            </div>
          )}

          {tab === "text" && (
            <div className="flex flex-col gap-2">
              <div>
                <div className="text-[11px] text-[var(--k-dim)] mb-1">Text to scroll</div>
                <input value={scrollText} onChange={(e) => setScrollText(e.target.value)}
                  className="w-full text-xs font-mono bg-[var(--k-base-100)] border border-[var(--k-base-400)] rounded px-2 py-1.5 text-amber-400 uppercase outline-none" />
              </div>
              <button onClick={() => { const f = textToMatrixFrames(scrollText, modules); setFrames(f); setCurFrame(0); setPlaying(false); }}
                className="py-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition-all hover:bg-amber-500/30">
                Generate Scroll
              </button>
            </div>
          )}

          <div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--k-muted)] uppercase tracking-wider mb-2 font-bold before:content-[''] before:h-3 before:w-[3px] before:rounded-full before:bg-amber-500">FPS: {fps}</div>
            <input type="range" min={1} max={30} value={fps} onChange={(e) => setFps(+e.target.value)} className="w-full accent-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-[var(--k-muted)] uppercase tracking-wider mb-2 font-bold before:content-[''] before:h-3 before:w-[3px] before:rounded-full before:bg-amber-500">Name</div>
            <input value={designName} onChange={(e) => setDesignName(e.target.value)}
              className="w-full text-xs bg-[var(--k-base-100)] border border-[var(--k-base-400)] rounded-lg px-2.5 py-2 text-white outline-none" />
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
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${i===curFrame ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" : "text-[var(--k-dim)] hover:text-[var(--k-muted)]"}`}>
                {i+1}
              </button>
              {frames.length > 1 && (
                <button onClick={() => removeFrame(i)} title="Delete frame"
                  className="text-[var(--k-dim)] hover:text-red-400 text-xs">×</button>
              )}
            </div>
          ))}
          {frames.length > 30 && <span className="text-[11px] text-[var(--k-dim)]">+{frames.length-30}</span>}
          <button onClick={() => { setFrames((p) => [...p, [...p[p.length-1]]]); setCurFrame(frames.length); setPlaying(false); }}
            className="px-2 py-0.5 rounded text-[11px] text-[var(--k-muted)] hover:text-green-400 border border-[var(--k-border)]">
            + Frame
          </button>
          <button onClick={() => duplicateFrame(curFrame)} title="Duplicate current frame"
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-[var(--k-muted)] hover:text-amber-400 border border-[var(--k-border)] hover:border-amber-500/30">
            <Copy className="w-3 h-3" /> Dup
          </button>
          {frames.length > 1 && (
            <button onClick={() => setPlaying(!playing)}
              className={`ml-auto flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${playing ? "bg-amber-500/20 text-amber-400" : "bg-amber-500/20 text-amber-300"}`}>
              {playing ? <><Pause className="w-3 h-3" /> Stop</> : <><Play className="w-3 h-3" /> Play</>}
            </button>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center p-6 select-none">
          <div className="flex flex-col gap-1">
            {Array.from({ length: 8 }, (_, row) => (
              <div key={row} className="flex gap-1">
                {Array.from({ length: W }, (_, col) => {
                  const on = displayFrame[row * W + col];
                  // Onion skin: faint ghost of the previous frame while drawing
                  const ghost = !playing && onionSkin && curFrame > 0 && !on
                    ? frames[curFrame - 1][row * W + col]
                    : 0;
                  return (
                    <button key={col}
                      onMouseDown={(e) => {
                        if (tab !== "draw" || playing) return;
                        e.preventDefault();
                        const v = on ? 0 : 1;
                        paintValue.current = v;
                        setPixel(col, row, v);
                      }}
                      onMouseEnter={() => {
                        if (tab !== "draw" || playing || paintValue.current === null) return;
                        setPixel(col, row, paintValue.current);
                      }}
                      className="rounded transition-colors"
                      style={{
                        width: Math.max(12, Math.min(28, Math.floor(360 / W))),
                        height: Math.max(12, Math.min(28, Math.floor(360 / W))),
                        background: on ? "#fbbf24" : ghost ? "#4a3a12" : "#1a1208",
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
          <span className="text-xs text-[var(--k-muted)] font-bold uppercase tracking-wider">MicroPython Code</span>
          <button onClick={() => { copyText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${copied ? "bg-green-500/20 text-green-400" : "bg-[var(--k-base-400)] text-[var(--k-muted)] border border-[var(--k-border)]"}`}>
            <Copy className="w-3 h-3" />{copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <pre className="flex-1 overflow-auto p-3 text-[11px] font-mono text-amber-400 leading-relaxed bg-[var(--k-base-100)]">
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
              className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                addedToCanvas
                  ? "bg-green-500/20 border-green-500/40 text-green-400"
                  : "bg-violet-500/15 border-violet-500/40 text-violet-400 hover:bg-violet-500/25"
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              {addedToCanvas ? "Added to Canvas! ✓" : "Add to Canvas"}
            </button>
            <p className="text-[10px] text-[var(--k-dim)] text-center">
              {frames.length} frame{frames.length !== 1 ? "s" : ""} · {modules} module{modules !== 1 ? "s" : ""} · {fps} fps
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
