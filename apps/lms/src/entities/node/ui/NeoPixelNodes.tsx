import { useState, useCallback } from "react";
import {
  BaseNode,
  NodeField,
  NumberInput,
  SelectInput,
  useNodeField,
  AdvancedSection,
  COLORS,
} from "./BaseNode";
import { ChipIcon } from "./_shared";

// ─── Per-pixel colour palette for small LED counts ────────────────────────────
function PixelPalette({ colors, onChange }: { colors: string[]; onChange: (c: string[]) => void }) {
  return (
    <div className="px-3 pb-1">
      <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block mb-1">Per-pixel Colors</span>
      <div className="flex flex-wrap gap-1">
        {colors.map((c, i) => (
          <div key={i} className="relative" title={`LED ${i}`}>
            <div className="w-5 h-5 rounded-full border-2 border-[#2d2d35] overflow-hidden cursor-pointer hover:scale-110 transition-transform"
              style={{ background: c }}>
              <input type="color" value={c} onChange={e => { const n = [...colors]; n[i] = e.target.value; onChange(n); }}
                className="absolute inset-0 opacity-0 cursor-pointer nodrag w-full h-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const PATTERN_DESCRIPTIONS: Record<string, string> = {
  Chase: "Lit pixels cycle around the strip",
  Fade: "All pixels fade in/out together",
  Rainbow: "Full spectrum rotates across LEDs",
  Blink: "All LEDs flash on/off at FPS rate",
  Solid: "All LEDs show a single color",
  Twinkle: "Random pixels flicker like stars",
};

// ─── NeoPixel LED ─────────────────────────────────────────────────────────────
export function NeoPixelLEDNode() {
  const [numLeds, setNumLeds] = useNodeField<number>("numLeds", 8);
  const [brightness, setBrightness] = useNodeField<number>("brightness", 50);
  const [color, setColor] = useNodeField<string>("color", "#ff0000");
  return (
    <BaseNode title="NeoPixel LED" color={COLORS.cyan} icon={<ChipIcon />} width="230px">
      <AdvancedSection>
        <div className="mx-3 mb-1 px-2.5 py-1.5 rounded-lg border border-[#2d2d35] bg-[#111116]">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">On-board Ring — GPIO 48</span>
            <span className="text-[9px] font-mono text-cyan-400">fixed</span>
          </div>
        </div>
      </AdvancedSection>
      <NodeField label="LED Count"><NumberInput value={numLeds} onChange={setNumLeds} /></NodeField>
      <NodeField label="Color">
        <input type="color" value={color} onChange={e => setColor(e.target.value)}
          className="nodrag w-10 h-6 rounded border border-[#2d2d35] cursor-pointer bg-transparent" />
      </NodeField>
      {/* Brightness slider */}
      <div className="px-3 py-1.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[#9ca3af] font-medium">Brightness</span>
          <span className="text-[10px] font-mono text-cyan-400">{brightness}%</span>
        </div>
        <input
          type="range" min={0} max={100} step={1} value={brightness}
          onChange={e => setBrightness(Number(e.target.value))}
          className="nodrag w-full h-1 cursor-pointer"
          style={{ accentColor: COLORS.cyan }}
        />
        <div className="flex justify-between mt-0.5">
          <span className="text-[8px] text-zinc-600">Off</span>
          <span className="text-[8px] text-zinc-600">Full</span>
        </div>
      </div>
    </BaseNode>
  );
}

// ─── RGB LED Matrix ───────────────────────────────────────────────────────────
export function RGBLEDMatrixNode() {
  const [pin, setPin] = useNodeField<number>("pin", 48);
  const [ledCount, setLedCount] = useNodeField<number>("ledCount", 16);
  const [topology, setTopology] = useNodeField<string>("topology", "strip");
  const [pattern, setPattern] = useNodeField<string>("pattern", "Chase");
  const [brightness, setBrightness] = useNodeField<number>("brightness", 128);
  const [fps, setFps] = useNodeField<number>("fps", 30);
  const [primaryColor, setPrimaryColor] = useNodeField<string>("primaryColor", "#ff0000");
  const [secondaryColor, setSecondaryColor] = useNodeField<string>("secondaryColor", "#0000ff");
  const [pixelColors, setPixelColors] = useNodeField<string[]>("pixelColors",
    Array.from({ length: 16 }, (_, i) => `hsl(${(i / 16) * 360}, 100%, 50%)`));
  const [showPixelEditor, setShowPixelEditor] = useState(false);

  const isStaticPattern = pattern === "Solid";
  const showPixelPalette = isStaticPattern && ledCount <= 64;

  // Keep pixelColors array in sync with ledCount
  const handleLedCountChange = useCallback((v: number) => {
    setLedCount(v);
    const clamped = Math.max(1, Math.min(v, 64));
    setPixelColors(Array.from({ length: clamped }, (_, i) =>
      pixelColors[i] ?? `hsl(${(i / clamped) * 360}, 100%, 50%)`));
  }, [pixelColors, setLedCount, setPixelColors]);

  // Mini topology preview
  const TopologyPreview = () => {
    const n = Math.min(ledCount, 24);
    if (topology === "ring") {
      const r = 28, cx = 36, cy = 36;
      return (
        <svg width={72} height={72} className="flex-shrink-0">
          {Array.from({ length: n }, (_, i) => {
            const a = (i / n) * 2 * Math.PI - Math.PI / 2;
            const x = cx + r * Math.cos(a), y = cy + r * Math.sin(a);
            const c = isStaticPattern ? (pixelColors[i] ?? primaryColor) : primaryColor;
            return <circle key={i} cx={x} cy={y} r={4} fill={c} opacity={0.85} />;
          })}
        </svg>
      );
    }
    if (topology === "grid") {
      const cols = Math.ceil(Math.sqrt(n));
      return (
        <svg width={cols * 10} height={Math.ceil(n / cols) * 10} className="flex-shrink-0">
          {Array.from({ length: n }, (_, i) => {
            const c = isStaticPattern ? (pixelColors[i] ?? primaryColor) : primaryColor;
            return <rect key={i} x={(i % cols) * 10 + 1} y={Math.floor(i / cols) * 10 + 1} width={8} height={8} rx={2} fill={c} opacity={0.85} />;
          })}
        </svg>
      );
    }
    return (
      <div className="flex gap-0.5 flex-wrap max-w-[120px]">
        {Array.from({ length: Math.min(n, 20) }, (_, i) => {
          const c = isStaticPattern ? (pixelColors[i] ?? primaryColor) : primaryColor;
          return <div key={i} className="w-2.5 h-2.5 rounded-sm" style={{ background: c, opacity: 0.85 }} />;
        })}
        {n > 20 && <span className="text-[8px] text-zinc-600 self-center">+{n - 20}</span>}
      </div>
    );
  };

  return (
    <BaseNode title="RGB LED Matrix" color={COLORS.cyan} icon={<ChipIcon />} width="270px">
      {/* Data pin */}
      <NodeField label="Data Pin"><NumberInput value={pin} onChange={setPin} /></NodeField>

      {/* LED count + topology */}
      <NodeField label="LED Count">
        <NumberInput value={ledCount} onChange={handleLedCountChange} />
      </NodeField>
      <NodeField label="Topology">
        <SelectInput value={topology} onChange={setTopology} compact
          options={[
            { label: "Linear Strip", value: "strip" },
            { label: "Circular Ring", value: "ring" },
            { label: "2D Grid", value: "grid" },
          ]} />
      </NodeField>

      {/* Topology preview */}
      <div className="px-3 pb-1 pt-0.5 flex items-center gap-3">
        <TopologyPreview />
        <div className="flex-1 min-w-0">
          <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-0.5">Preview</div>
          <div className="text-[10px] text-zinc-400">{ledCount} LED{ledCount !== 1 ? "s" : ""} · {topology}</div>
        </div>
      </div>

      {/* Pattern picker */}
      <div className="px-3 pt-1 pb-0.5">
        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Animation Pattern</span>
      </div>
      <div className="px-3 pb-1 grid grid-cols-3 gap-1">
        {["Chase", "Fade", "Rainbow", "Blink", "Solid", "Twinkle"].map(p => (
          <button key={p} onClick={() => setPattern(p)}
            className={`nodrag py-1 rounded-lg text-[10px] font-bold border transition-all ${
              pattern === p ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300" : "border-[#2d2d35] text-zinc-500 hover:border-[#3d3d45] bg-[#111116]"
            }`}
          >{p}</button>
        ))}
      </div>
      {/* Pattern description */}
      <div className="px-3 pb-1">
        <p className="text-[9px] text-zinc-600 italic">{PATTERN_DESCRIPTIONS[pattern]}</p>
      </div>

      {/* Color pickers */}
      <div className="px-3 pb-1 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-500">Primary</span>
          <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
            className="nodrag w-7 h-5 rounded border border-[#2d2d35] cursor-pointer bg-transparent" />
        </div>
        {pattern !== "Solid" && pattern !== "Rainbow" && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-500">Secondary</span>
            <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)}
              className="nodrag w-7 h-5 rounded border border-[#2d2d35] cursor-pointer bg-transparent" />
          </div>
        )}
      </div>

      {/* Brightness slider */}
      <div className="px-3 py-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[#9ca3af] font-medium">Brightness</span>
          <span className="text-[10px] font-mono text-cyan-400">{brightness}/255</span>
        </div>
        <input type="range" min={0} max={255} step={1} value={brightness}
          onChange={e => setBrightness(Number(e.target.value))}
          className="nodrag w-full h-1 cursor-pointer" style={{ accentColor: COLORS.cyan }} />
      </div>

      {/* FPS */}
      <div className="px-3 py-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[#9ca3af] font-medium">Animation FPS</span>
          <span className="text-[10px] font-mono text-cyan-400">{fps} fps</span>
        </div>
        <input type="range" min={1} max={120} step={1} value={fps}
          onChange={e => setFps(Number(e.target.value))}
          className="nodrag w-full h-1 cursor-pointer" style={{ accentColor: COLORS.cyan }} />
      </div>

      {/* Per-pixel editor (Solid pattern, ≤64 LEDs) */}
      {showPixelPalette && (
        <AdvancedSection>
          <div className="px-3 pt-1 pb-0.5 flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Per-pixel Colors</span>
            <button onClick={() => setShowPixelEditor(v => !v)}
              className="nodrag text-[9px] text-cyan-400 hover:text-cyan-300 transition-colors">
              {showPixelEditor ? "▲ hide" : "▼ show"}
            </button>
          </div>
          {showPixelEditor && (
            <PixelPalette colors={pixelColors.slice(0, ledCount)}
              onChange={c => setPixelColors(c)} />
          )}
        </AdvancedSection>
      )}
    </BaseNode>
  );
}

// ─── NeoPixel RGB Advanced ────────────────────────────────────────────────────
export function NeoPixelRGBNode() {
  const [numLeds, setNumLeds] = useNodeField<number>("numLeds", 8);
  const [brightness, setBrightness] = useNodeField<number>("brightness", 50);
  const [red, setRed] = useNodeField<number>("red", 255);
  const [green, setGreen] = useNodeField<number>("green", 0);
  const [blue, setBlue] = useNodeField<number>("blue", 0);
  return (
    <BaseNode title="NeoPixel RGB (Advanced)" color={COLORS.violet} icon={<ChipIcon />} width="250px">
      <AdvancedSection>
        <div className="mx-3 mb-1 px-2.5 py-1.5 rounded-lg border border-[#2d2d35] bg-[#111116]">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">On-board Ring — GPIO 48</span>
            <span className="text-[9px] font-mono text-violet-400">fixed</span>
          </div>
        </div>
      </AdvancedSection>
      <NodeField label="LED Count"><NumberInput value={numLeds} onChange={setNumLeds} /></NodeField>
      <NodeField label="Brightness"><NumberInput value={brightness} onChange={setBrightness} /></NodeField>
      <NodeField label="Red (0–255)"><NumberInput value={red} onChange={setRed} /></NodeField>
      <NodeField label="Green (0–255)"><NumberInput value={green} onChange={setGreen} /></NodeField>
      <NodeField label="Blue (0–255)"><NumberInput value={blue} onChange={setBlue} /></NodeField>
    </BaseNode>
  );
}

// ─── NeoPixel Designer Node ────────────────────────────────────────────────────
type RGB = [number, number, number];

export function NeoPixelDesignerNode() {
  const [pin, _setPin]         = useNodeField<number>("pin", 48);
  const [ledCount]             = useNodeField<number>("ledCount", 8);
  const [fps]                  = useNodeField<number>("fps", 10);
  const [frames]               = useNodeField<RGB[][]>("frames", []);
  const [effectName]           = useNodeField<string>("effectName", "Custom");
  const [mode]                 = useNodeField<string>("mode", "strip");

  // Preview: show first frame colours as a mini LED strip
  const firstFrame: RGB[] = frames[0] ?? [];
  const displayCount = Math.min(firstFrame.length, 24);

  return (
    <BaseNode title="NeoPixel Designer" color={COLORS.violet} icon={<ChipIcon />} width="270px">
      {/* Info bar */}
      <div className="mx-3 mb-1 px-2.5 py-1.5 rounded-lg border border-[#2d2d35] bg-[#111116]">
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">
            GPIO {pin} · {ledCount} LED{ledCount !== 1 ? "s" : ""} · {mode}
          </span>
          <span className="text-[9px] font-mono text-violet-400">
            {frames.length > 1 ? `${frames.length}f @ ${fps}fps` : "static"}
          </span>
        </div>
        <div className="text-[10px] text-violet-300 font-semibold mt-0.5">{effectName}</div>
      </div>

      {/* LED preview strip */}
      {firstFrame.length > 0 && (
        <div className="mx-3 mb-2">
          <div className="flex gap-0.5 flex-wrap">
            {firstFrame.slice(0, displayCount).map((rgb, i) => (
              <div
                key={i}
                className="rounded-full flex-shrink-0"
                style={{
                  width: mode === "strip" ? `${Math.min(20, Math.floor(240 / displayCount))}px` : "14px",
                  height: mode === "strip" ? "12px" : "14px",
                  background: `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`,
                  boxShadow: (rgb[0] + rgb[1] + rgb[2]) > 30
                    ? `0 0 4px rgb(${rgb[0]},${rgb[1]},${rgb[2]})`
                    : "none",
                  opacity: (rgb[0] + rgb[1] + rgb[2]) === 0 ? 0.15 : 1,
                }}
              />
            ))}
            {firstFrame.length > displayCount && (
              <span className="text-[8px] text-zinc-600 self-center ml-1">+{firstFrame.length - displayCount}</span>
            )}
          </div>
          {firstFrame.length === 0 && (
            <div className="text-[10px] text-zinc-600 italic">No LED data</div>
          )}
        </div>
      )}

      <div className="px-3 pb-2 text-[9px] text-zinc-600 leading-relaxed">
        Designed in Designer Hub — edit there to update
      </div>
    </BaseNode>
  );
}
