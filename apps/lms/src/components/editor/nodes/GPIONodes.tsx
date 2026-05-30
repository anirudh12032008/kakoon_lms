import { useState, useCallback } from "react";
import { Handle, Position } from "@xyflow/react";
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

function ChipIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
      <rect x="9" y="9" width="6" height="6"/>
      <line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/>
      <line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/>
      <line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/>
      <line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>
    </svg>
  );
}

const PORT_OPTIONS = [
  { label: "Port 1", value: "1" },
  { label: "Port 2", value: "2" },
  { label: "Port 3", value: "3" },
  { label: "Port 4", value: "4" },
];

const outHS = {
  width: 12, height: 12, background: "#111113", border: "2.5px solid #22c55e",
  borderRadius: "50%", zIndex: 10, top: "50%", transform: "translateY(-50%)",
};

// ─── GPIO Pin ─────────────────────────────────────────────────────────────────
export function GPIOPinNode() {
  const [pin, setPin] = useNodeField<number>("pin", 2);
  const [mode, setMode] = useNodeField<string>("mode", "OUT");
  return (
    <BaseNode title="GPIO Pin" color={COLORS.green} icon={<ChipIcon />} width="200px">
      <NodeField label="Pin"><NumberInput value={pin} onChange={setPin} /></NodeField>
      <NodeField label="Mode">
        <SelectInput value={mode} onChange={setMode} options={[{ label: "OUT", value: "OUT" }, { label: "IN", value: "IN" }]} compact />
      </NodeField>
    </BaseNode>
  );
}

// ─── Pin Write ────────────────────────────────────────────────────────────────
export function PinWriteNode() {
  const [port, setPort] = useNodeField<string>("port", "1");
  const [pin, setPin] = useNodeField<number>("pin", 4);
  const [value, setValue] = useNodeField<boolean>("value", false);
  return (
    <BaseNode title="Pin Write" color={COLORS.orange} icon={<ChipIcon />} width="210px">
      <NodeField label="Port"><SelectInput value={port} onChange={setPort} options={PORT_OPTIONS} compact /></NodeField>
      <NodeField label="Pin"><NumberInput value={pin} onChange={setPin} /></NodeField>
      <NodeField label="Value"><ToggleInput value={value} onChange={setValue} leftLabel="0" rightLabel="1" /></NodeField>
    </BaseNode>
  );
}

// ─── Pin Read ─────────────────────────────────────────────────────────────────
export function PinReadNode() {
  const [port, setPort] = useNodeField<string>("port", "1");
  const [pin, setPin] = useNodeField<number>("pin", 4);
  const [varName, setVarName] = useNodeField<string>("varName", "value");
  return (
    <BaseNode title="Pin Read" color={COLORS.indigo} icon={<ChipIcon />} width="220px">
      <NodeField label="Port"><SelectInput value={port} onChange={setPort} options={PORT_OPTIONS} compact /></NodeField>
      <NodeField label="Pin"><NumberInput value={pin} onChange={setPin} /></NodeField>
      <NodeField label="Value">
        <TextInput value={varName} onChange={setVarName} green />
        <Handle type="source" position={Position.Right} id="value" style={{ ...outHS, right: -6 }} />
      </NodeField>
    </BaseNode>
  );
}

// ─── PWM ──────────────────────────────────────────────────────────────────────
export function PWMNode() {
  const [pin, setPin] = useNodeField<number>("pin", 2);
  const [freq, setFreq] = useNodeField<number>("freq", 1000);
  const [duty, setDuty] = useNodeField<number>("duty", 512);
  return (
    <BaseNode title="PWM" color={COLORS.purple} icon={<ChipIcon />} width="210px">
      <NodeField label="Pin"><NumberInput value={pin} onChange={setPin} /></NodeField>
      <NodeField label="Frequency"><NumberInput value={freq} onChange={setFreq} /></NodeField>
      <NodeField label="Duty Cycle"><NumberInput value={duty} onChange={setDuty} /></NodeField>
    </BaseNode>
  );
}

// ─── ADC ──────────────────────────────────────────────────────────────────────
export function ADCNode() {
  const [pin, setPin] = useNodeField<number>("pin", 34);
  const [varName, setVarName] = useNodeField<string>("varName", "value");
  return (
    <BaseNode title="ADC" color={COLORS.green} icon={<ChipIcon />} width="220px">
      <NodeField label="Pin"><NumberInput value={pin} onChange={setPin} /></NodeField>
      <NodeField label="Store In">
        <TextInput value={varName} onChange={setVarName} green />
        <Handle type="source" position={Position.Right} id="value" style={{ ...outHS, right: -6 }} />
      </NodeField>
    </BaseNode>
  );
}

// ─── Push Button ──────────────────────────────────────────────────────────────
export function PushButtonNode() {
  const [port, setPort] = useNodeField<string>("port", "1");
  const [pin, setPin] = useNodeField<number>("pin", 4);
  const [varName, setVarName] = useNodeField<string>("varName", "value");
  return (
    <BaseNode title="Push Button" color={COLORS.pink} icon={<ChipIcon />} width="230px">
      <NodeField label="Port"><SelectInput value={port} onChange={setPort} options={PORT_OPTIONS} compact /></NodeField>
      <NodeField label="Data Pin"><NumberInput value={pin} onChange={setPin} /></NodeField>
      <NodeField label="Button Value">
        <TextInput value={varName} onChange={setVarName} green />
        <Handle type="source" position={Position.Right} id="value" style={{ ...outHS, right: -6 }} />
      </NodeField>
    </BaseNode>
  );
}

// ─── Buzzer Tone ──────────────────────────────────────────────────────────────
export function BuzzerToneNode() {
  const [port, setPort] = useNodeField<string>("port", "1");
  const [pin, setPin] = useNodeField<number>("pin", 46);
  const [tone, setTone] = useNodeField<string>("tone", "1");
  return (
    <BaseNode title="Buzzer Tone" color={COLORS.green} icon={<ChipIcon />} width="210px">
      <NodeField label="Port"><SelectInput value={port} onChange={setPort} options={PORT_OPTIONS} compact /></NodeField>
      <NodeField label="Buzzer pin"><NumberInput value={pin} onChange={setPin} /></NodeField>
      <NodeField label="Tone">
        <SelectInput value={tone} onChange={setTone} compact
          options={[1,2,3,4,5,6,7,8].map(n => ({ label: String(n), value: String(n) }))} />
      </NodeField>
    </BaseNode>
  );
}

// ─── NeoPixel LED ─────────────────────────────────────────────────────────────
export function NeoPixelLEDNode() {
  const [numLeds, setNumLeds] = useNodeField<number>("numLeds", 8);
  const [brightness, setBrightness] = useNodeField<number>("brightness", 50);
  const [color, setColor] = useNodeField<string>("color", "#ff0000");
  return (
    <BaseNode title="NeoPixel LED" color={COLORS.cyan} icon={<ChipIcon />} width="230px">
      <div className="mx-3 mb-1 px-2.5 py-1.5 rounded-lg border border-[#2d2d35] bg-[#111116]">
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">On-board Ring — GPIO 48</span>
          <span className="text-[9px] font-mono text-cyan-400">fixed</span>
        </div>
      </div>
      <NodeField label="LED Count"><NumberInput value={numLeds} onChange={setNumLeds} /></NodeField>
      <NodeField label="Brightness"><NumberInput value={brightness} onChange={setBrightness} /></NodeField>
      <NodeField label="Color">
        <input type="color" value={color} onChange={e => setColor(e.target.value)}
          className="nodrag w-10 h-6 rounded border border-[#2d2d35] cursor-pointer bg-transparent" />
      </NodeField>
    </BaseNode>
  );
}

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
        <>
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
        </>
      )}
    </BaseNode>
  );
}

// ─── PWM Output ───────────────────────────────────────────────────────────────
export function PWMOutputNode() {
  const [pin, setPin] = useNodeField<number>("pin", 2);
  const [freq, setFreq] = useNodeField<number>("freq", 1000);
  const [duty, setDuty] = useNodeField<number>("duty", 50);
  const [sensorBind, setSensorBind] = useNodeField<string>("sensorBind", "");
  const [sensorMin, setSensorMin] = useNodeField<number>("sensorMin", 0);
  const [sensorMax, setSensorMax] = useNodeField<number>("sensorMax", 4095);

  const freqPreset = (v: number) => setFreq(v);

  return (
    <BaseNode title="PWM Output" color={COLORS.purple} icon={<ChipIcon />} width="260px">
      <NodeField label="GPIO Pin"><NumberInput value={pin} onChange={setPin} /></NodeField>

      {/* Frequency with quick presets */}
      <div className="px-3 py-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[#9ca3af] font-medium">Frequency</span>
          <NumberInput value={freq} onChange={setFreq} />
        </div>
        <div className="flex gap-1 mt-1 flex-wrap">
          {[50, 500, 1000, 5000, 20000, 40000].map(v => (
            <button key={v} onClick={() => freqPreset(v)}
              className={`nodrag px-1.5 py-0.5 rounded text-[9px] font-mono border transition-all ${
                freq === v ? "border-purple-500/60 text-purple-300 bg-purple-500/10" : "border-[#2d2d35] text-zinc-500 hover:border-zinc-600 bg-[#111116]"
              }`}
            >{v >= 1000 ? `${v / 1000}k` : v}Hz</button>
          ))}
        </div>
        <p className="text-[9px] text-zinc-600 mt-1">Range: 1 Hz – 40 kHz</p>
      </div>

      {/* Duty cycle slider */}
      <div className="px-3 py-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[#9ca3af] font-medium">Duty Cycle</span>
          <span className="text-[10px] font-mono text-purple-400">{duty} %</span>
        </div>
        <input type="range" min={0} max={100} step={1} value={duty}
          onChange={e => setDuty(Number(e.target.value))}
          className="nodrag w-full h-1 cursor-pointer" style={{ accentColor: COLORS.purple }} />
        <div className="flex justify-between mt-0.5">
          <span className="text-[8px] text-zinc-600">0%</span>
          <span className="text-[8px] text-zinc-600">100%</span>
        </div>
      </div>

      {/* PWM waveform mini-preview */}
      <div className="px-3 pb-1">
        <svg width="100%" height="28" viewBox="0 0 200 28" preserveAspectRatio="none" className="rounded-lg overflow-hidden border border-[#2d2d35]" style={{ background: "#0a0a0d" }}>
          {/* One cycle */}
          {[0, 100].map(offset => {
            const onW = duty * 2;
            const offW = 200 - onW;
            return (
              <g key={offset}>
                <polyline
                  points={`${offset},24 ${offset},4 ${offset + onW},4 ${offset + onW},24 ${offset + onW + offW},24`}
                  fill="none" stroke={COLORS.purple} strokeWidth="1.5" opacity="0.8"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Sensor input binding */}
      <div className="px-3 pt-1 pb-0.5">
        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Auto-modulate from Sensor</span>
      </div>
      <NodeField label="Sensor var">
        <TextInput value={sensorBind} onChange={setSensorBind} />
      </NodeField>
      {sensorBind.trim() !== "" && (
        <>
          <NodeField label="Sensor min"><NumberInput value={sensorMin} onChange={setSensorMin} /></NodeField>
          <NodeField label="Sensor max"><NumberInput value={sensorMax} onChange={setSensorMax} /></NodeField>
          <p className="text-[9px] text-zinc-600 px-3 pb-1">Maps <span className="font-mono text-zinc-400">{sensorBind}</span> ({sensorMin}–{sensorMax}) → duty 0–100%</p>
        </>
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
      <div className="mx-3 mb-1 px-2.5 py-1.5 rounded-lg border border-[#2d2d35] bg-[#111116]">
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">On-board Ring — GPIO 48</span>
          <span className="text-[9px] font-mono text-violet-400">fixed</span>
        </div>
      </div>
      <NodeField label="LED Count"><NumberInput value={numLeds} onChange={setNumLeds} /></NodeField>
      <NodeField label="Brightness"><NumberInput value={brightness} onChange={setBrightness} /></NodeField>
      <NodeField label="Red (0–255)"><NumberInput value={red} onChange={setRed} /></NodeField>
      <NodeField label="Green (0–255)"><NumberInput value={green} onChange={setGreen} /></NodeField>
      <NodeField label="Blue (0–255)"><NumberInput value={blue} onChange={setBlue} /></NodeField>
    </BaseNode>
  );
}
