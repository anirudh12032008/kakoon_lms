import { useState } from "react";
import { Handle, Position } from "@xyflow/react";
import {
  BaseNode, NodeField, TextInput, NumberInput, SelectInput, ToggleInput,
  useNodeField, COLORS,
} from "./BaseNode";

const outHS = (color = "#22c55e") => ({
  width: 12, height: 12, background: "var(--k-base-200)",
  border: `2.5px solid ${color}`, borderRadius: "50%", zIndex: 10,
});

function SleepIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}
function OTAIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
  );
}
function SDIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="2"/><line x1="8" y1="2" x2="8" y2="10"/>
      <line x1="12" y1="2" x2="12" y2="10"/><line x1="16" y1="2" x2="16" y2="10"/>
    </svg>
  );
}

// ─── Deep Sleep / Power Node ──────────────────────────────────────────────────
const SLEEP_MODES = [
  { label: "Deep Sleep", value: "deep" },
  { label: "Light Sleep", value: "light" },
  { label: "Modem Sleep", value: "modem" },
];
const WAKE_TRIGGERS = [
  { label: "Timer", value: "timer" },
  { label: "GPIO (Ext0)", value: "gpio_ext0" },
  { label: "GPIO (Ext1)", value: "gpio_ext1" },
  { label: "Touch Pad", value: "touch" },
  { label: "ULP Co-processor", value: "ulp" },
];
const GPIO_LEVELS = [
  { label: "LOW (0V)", value: "low" },
  { label: "HIGH (3.3V)", value: "high" },
];

export function DeepSleepNode() {
  const [sleepMode, setSleepMode] = useNodeField<string>("sleepMode", "deep");
  const [wakeTrigger, setWakeTrigger] = useNodeField<string>("wakeTrigger", "timer");
  const [wakeAfter, setWakeAfter] = useNodeField<number>("wakeAfter", 10);
  const [wakeUnit, setWakeUnit] = useNodeField<string>("wakeUnit", "s");
  const [wakePin, setWakePin] = useNodeField<number>("wakePin", 33);
  const [wakeLevel, setWakeLevel] = useNodeField<string>("wakeLevel", "high");
  const [saveGpio, setSaveGpio] = useNodeField<boolean>("saveGpio", true);
  const [battMonitor, setBattMonitor] = useNodeField<boolean>("battMonitor", false);
  const [battVar, setBattVar] = useNodeField<string>("battVar", "battery_v");

  const usTimer = wakeTrigger === "timer";
  const useGpio = wakeTrigger === "gpio_ext0" || wakeTrigger === "gpio_ext1";
  const useTouch = wakeTrigger === "touch";

  const modeColor: Record<string, string> = { deep: "#ef4444", light: "#f97316", modem: "#eab308" };
  const mc = modeColor[sleepMode] ?? COLORS.red;

  return (
    <BaseNode title="Deep Sleep / Power" color={mc} icon={<SleepIcon />} width="270px">
      <NodeField label="Sleep Mode">
        <SelectInput value={sleepMode} onChange={setSleepMode} options={SLEEP_MODES} style={{ flex: 1 }} />
      </NodeField>

      {/* power mode info badge */}
      <div className="mx-3 mb-1 rounded-lg border px-2.5 py-1.5 flex items-center gap-2"
        style={{ borderColor: `${mc}44`, background: `${mc}11` }}>
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={mc} strokeWidth="2.5">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span className="text-[9px]" style={{ color: mc }}>
          {sleepMode === "deep" ? "CPU + RAM off. Wake restarts from setup()." :
           sleepMode === "light" ? "CPU paused. RAM retained. Fast wake." :
           "WiFi modem off. CPU running. Low-power."}
        </span>
      </div>

      <NodeField label="Wake on">
        <SelectInput value={wakeTrigger} onChange={setWakeTrigger} options={WAKE_TRIGGERS} style={{ flex: 1 }} />
      </NodeField>

      {usTimer && (
        <NodeField label="Wake after">
          <NumberInput value={wakeAfter} onChange={setWakeAfter} style={{ width: 70 }} />
          <SelectInput value={wakeUnit} onChange={setWakeUnit} compact style={{ width: 60 }}
            options={[{ label: "ms", value: "ms" }, { label: "s", value: "s" }, { label: "min", value: "min" }, { label: "hr", value: "hr" }]} />
        </NodeField>
      )}
      {useGpio && (<>
        <NodeField label="Wake GPIO"><NumberInput value={wakePin} onChange={setWakePin} /></NodeField>
        <NodeField label="Wake level">
          <SelectInput value={wakeLevel} onChange={setWakeLevel} compact options={GPIO_LEVELS} />
        </NodeField>
      </>)}
      {useTouch && (
        <div className="px-3 py-1">
          <div className="rounded-lg border border-[var(--k-base-300)] bg-[var(--k-base-100)] px-2.5 py-1.5 text-[9px] text-[var(--k-muted)]">
            Touch pad wake uses capacitive touch pins (T0–T9). Configure touch threshold in code.
          </div>
        </div>
      )}

      <div className="mx-3 mt-0.5 mb-1 border-t border-[var(--k-base-300)]" />

      <NodeField label="Hold GPIOs"><ToggleInput value={saveGpio} onChange={setSaveGpio} leftLabel="No" rightLabel="Yes" /></NodeField>
      <NodeField label="Battery mon"><ToggleInput value={battMonitor} onChange={setBattMonitor} leftLabel="Off" rightLabel="On" /></NodeField>
      {battMonitor && (
        <NodeField label="Batt var">
          <TextInput value={battVar} onChange={setBattVar} green />
          <Handle type="source" position={Position.Right} id="battery"
            style={{ ...outHS(COLORS.yellow), right: -6 }} />
        </NodeField>
      )}

      <div className="px-3 pb-2 pt-1">
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-2.5 py-1.5 text-[9px] text-red-400 font-medium">
          Place at end of flow. No code runs after sleep in deep mode.
        </div>
      </div>
    </BaseNode>
  );
}

// ─── OTA Update Node ───────────────────────────────────────────────────────────
export function OTAUpdateNode() {
  const [hostname, setHostname] = useNodeField<string>("hostname", "esp32-ota");
  const [usePassword, setUsePassword] = useNodeField<boolean>("usePassword", true);
  const [password, setPassword] = useNodeField<string>("password", "admin");
  const [port, setPort] = useNodeField<number>("port", 3232);
  const [progressVar, setProgressVar] = useNodeField<string>("progressVar", "ota_progress");
  const [onStart, setOnStart] = useNodeField<string>("onStart", "ota_started");
  const [onEnd, setOnEnd] = useNodeField<string>("onEnd", "ota_done");

  const [simProgress, setSimProgress] = useState<number | null>(null);

  const handleSim = () => {
    setSimProgress(0);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 18 + 4;
      if (p >= 100) { p = 100; clearInterval(iv); setTimeout(() => setSimProgress(null), 1200); }
      setSimProgress(Math.round(p));
    }, 200);
  };

  return (
    <BaseNode title="OTA Update" color={COLORS.cyan} icon={<OTAIcon />} width="265px">
      {/* WiFi dependency badge */}
      <div className="mx-3 mt-1 mb-0.5 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-cyan-500/8 border border-cyan-500/20">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#14b8a6" strokeWidth="2.5">
          <path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M5 12.55a11 11 0 0 1 14.08 0"/>
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>
        </svg>
        <span className="text-[9px] text-cyan-400">Requires WiFi Node to be connected</span>
      </div>

      <NodeField label="Hostname"><TextInput value={hostname} onChange={setHostname} wide /></NodeField>
      <NodeField label="Port"><NumberInput value={port} onChange={setPort} /></NodeField>
      <NodeField label="Password">
        <ToggleInput value={usePassword} onChange={setUsePassword} leftLabel="Off" rightLabel="On" />
      </NodeField>
      {usePassword && (
        <NodeField label="Secret"><TextInput value={password} onChange={setPassword} wide /></NodeField>
      )}

      <div className="mx-3 mt-0.5 mb-1 border-t border-[var(--k-base-300)]" />

      <NodeField label="Progress var">
        <TextInput value={progressVar} onChange={setProgressVar} green />
        <Handle type="source" position={Position.Right} id="progress"
          style={{ ...outHS(COLORS.cyan), right: -6, top: "auto" }} />
      </NodeField>
      <NodeField label="On Start var">
        <TextInput value={onStart} onChange={setOnStart} green />
        <Handle type="source" position={Position.Right} id="on_start"
          style={{ ...outHS(COLORS.green), right: -6 }} />
      </NodeField>
      <NodeField label="On Done var">
        <TextInput value={onEnd} onChange={setOnEnd} green />
        <Handle type="source" position={Position.Right} id="on_end"
          style={{ ...outHS(COLORS.yellow), right: -6 }} />
      </NodeField>

      {/* progress sim */}
      <div className="px-3 pb-2 pt-1">
        <button onClick={handleSim}
          className="nodrag w-full py-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 text-[10px] font-bold transition-all">
          Simulate OTA flash
        </button>
        {simProgress !== null && (
          <div className="mt-1.5">
            <div className="flex justify-between text-[9px] font-mono mb-0.5">
              <span className="text-[var(--k-muted)]">Flashing firmware…</span>
              <span className="text-cyan-400 font-bold">{simProgress}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-[var(--k-base-300)] border border-[var(--k-border)] overflow-hidden">
              <div className="h-full bg-cyan-500 rounded-full transition-all duration-200" style={{ width: `${simProgress}%` }} />
            </div>
            {simProgress === 100 && (
              <div className="mt-1 text-center text-[9px] text-green-400 font-bold">Flash complete! Rebooting…</div>
            )}
          </div>
        )}
      </div>
    </BaseNode>
  );
}

// ─── SD Card Node ──────────────────────────────────────────────────────────────
const CSV_COLS_DEFAULT = [
  { label: "timestamp", varName: "millis()" },
  { label: "sensor", varName: "sensor_val" },
];

export function SDCardNode() {
  const [mode, setMode] = useNodeField<string>("mode", "write");
  const [filename, setFilename] = useNodeField<string>("filename", "{yyyy}-{mm}-{dd}.csv");
  const [overwrite, setOverwrite] = useNodeField<boolean>("overwrite", false);
  const [flushMs, setFlushMs] = useNodeField<number>("flushMs", 5000);
  const [spiCs, setSpiCs] = useNodeField<number>("spiCs", 5);
  const [spiMosi, setSpiMosi] = useNodeField<number>("spiMosi", 23);
  const [spiMiso, setSpiMiso] = useNodeField<number>("spiMiso", 19);
  const [spiClk, setSpiClk] = useNodeField<number>("spiClk", 18);
  const [csvCols, setCsvCols] = useNodeField<typeof CSV_COLS_DEFAULT>("csvCols", CSV_COLS_DEFAULT);
  const [showPins, setShowPins] = useState(false);

  const addCol = () => setCsvCols([...csvCols, { label: `col${csvCols.length + 1}`, varName: "" }]);
  const removeCol = (i: number) => setCsvCols(csvCols.filter((_, idx) => idx !== i));
  const updateCol = (i: number, field: "label" | "varName", val: string) =>
    setCsvCols(csvCols.map((c, idx) => idx === i ? { ...c, [field]: val } : c));

  return (
    <BaseNode title="SD Card" color={COLORS.green} icon={<SDIcon />} width="275px">
      <NodeField label="Mode">
        <SelectInput value={mode} onChange={setMode} compact
          options={[{ label: "Write / Log", value: "write" }, { label: "Read config", value: "read" }, { label: "Both", value: "rw" }]} />
      </NodeField>
      <NodeField label="Filename"><TextInput value={filename} onChange={setFilename} wide /></NodeField>
      <div className="px-3">
        <div className="text-[8px] text-[var(--k-dim)] mb-1">Tokens: {"{yyyy}"} {"{mm}"} {"{dd}"} {"{hh}"} {"{min}"} {"{ss}"}</div>
      </div>

      {(mode === "write" || mode === "rw") && (<>
        <NodeField label="Write mode">
          <SelectInput value={overwrite ? "overwrite" : "append"} onChange={(v) => setOverwrite(v === "overwrite")} compact
            options={[{ label: "Append", value: "append" }, { label: "Overwrite", value: "overwrite" }]} />
        </NodeField>
        <NodeField label="Flush every">
          <NumberInput value={flushMs} onChange={setFlushMs} style={{ width: 70 }} />
          <span className="text-[10px] text-[var(--k-muted)] ml-1">ms</span>
        </NodeField>

        {/* CSV column mapper */}
        <div className="mx-3 mt-1 mb-0.5 rounded-lg border border-[var(--k-base-300)] bg-[var(--k-base-100)] overflow-hidden">
          <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-[var(--k-base-300)]">
            <span className="text-[9px] uppercase tracking-wider text-[var(--k-muted)] font-bold">CSV Columns</span>
            <button onClick={addCol}
              className="nodrag text-[9px] px-1.5 py-0.5 rounded border border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20 font-bold transition-all">
              + Add
            </button>
          </div>
          <div className="flex px-2.5 py-1 text-[8px] text-[var(--k-dim)] uppercase tracking-wider gap-2">
            <span className="w-[80px]">Header</span>
            <span className="flex-1">Variable</span>
          </div>
          {csvCols.map((col, i) => (
            <div key={i} className="flex items-center gap-1.5 px-2 py-1 border-t border-[var(--k-base-200)]">
              <input value={col.label} onChange={(e) => updateCol(i, "label", e.target.value)}
                className="nodrag w-[72px] text-[10px] font-mono bg-[var(--k-base-200)] border border-[var(--k-border)] rounded px-1.5 py-0.5 text-[var(--k-text)] outline-none" />
              <input value={col.varName} onChange={(e) => updateCol(i, "varName", e.target.value)}
                className="nodrag flex-1 text-[10px] font-mono bg-[var(--k-base-200)] border border-[var(--k-border)] rounded px-1.5 py-0.5 text-cyan-400 outline-none" />
              <button onClick={() => removeCol(i)}
                className="nodrag text-[var(--k-dim)] hover:text-red-400 transition-colors text-[10px] px-1">×</button>
            </div>
          ))}
          {csvCols.length === 0 && (
            <div className="px-3 py-2 text-center text-[9px] text-[var(--k-dim)]">No columns defined</div>
          )}
        </div>
      </>)}

      {/* SPI pins collapsible */}
      <div className="px-3 mt-0.5 mb-1">
        <button onClick={() => setShowPins(!showPins)}
          className="nodrag w-full flex items-center justify-between py-1 text-[9px] text-[var(--k-muted)] hover:text-[var(--k-text)] transition-colors">
          <span>SPI Pins (CS/MOSI/MISO/CLK)</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{ transform: showPins ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        {showPins && (
          <div className="grid grid-cols-2 gap-1.5 mt-1">
            {[["CS", spiCs, setSpiCs], ["MOSI", spiMosi, setSpiMosi], ["MISO", spiMiso, setSpiMiso], ["CLK", spiClk, setSpiClk]].map(([lbl, val, fn]) => (
              <div key={lbl as string} className="flex items-center gap-1">
                <span className="text-[9px] text-[var(--k-muted)] w-9">{lbl as string}</span>
                <NumberInput value={val as number} onChange={fn as (v: number) => void} style={{ width: 52 }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* status output */}
      <div className="px-3 pb-2">
        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[var(--k-base-100)] border border-[var(--k-base-300)]">
          <span className="text-[9px] text-[var(--k-muted)]">Write status →</span>
          <Handle type="source" position={Position.Right} id="status"
            style={{ ...outHS(COLORS.green), right: -22 }} />
          <span className="text-[9px] text-[var(--k-dim)] mr-2">ok/err</span>
        </div>
      </div>
    </BaseNode>
  );
}
