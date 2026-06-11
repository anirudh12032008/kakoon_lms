import { Handle, Position } from "@xyflow/react";
import {
  BaseNode,
  NodeField,
  TextInput,
  NumberInput,
  SelectInput,
  ToggleInput,
  useNodeField,
  makeHandleStyle,
  AdvancedSection,
  COLORS,
} from "./BaseNode";
import { ChipIcon } from "./_shared";

const PORT_OPTIONS = [
  { label: "Port 1", value: "1" },
  { label: "Port 2", value: "2" },
  { label: "Port 3", value: "3" },
  { label: "Port 4", value: "4" },
];

const outHS = { ...makeHandleStyle(COLORS.green), top: "50%", transform: "translateY(-50%)" };

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
      <NodeField label="Duty Cycle"><NumberInput value={duty} onChange={setDuty} /></NodeField>
      <AdvancedSection>
        <NodeField label="Frequency"><NumberInput value={freq} onChange={setFreq} /></NodeField>
      </AdvancedSection>
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

      <AdvancedSection>
        {/* Frequency with quick presets */}
        <div className="px-3 py-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[var(--k-muted)] font-medium">Frequency</span>
            <NumberInput value={freq} onChange={setFreq} />
          </div>
          <div className="flex gap-1 mt-1 flex-wrap">
            {[50, 500, 1000, 5000, 20000, 40000].map(v => (
              <button key={v} onClick={() => freqPreset(v)}
                className={`nodrag px-1.5 py-0.5 rounded text-[9px] font-mono border transition-all ${
                  freq === v ? "border-purple-500/60 text-purple-300 bg-purple-500/10" : "border-[var(--k-border)] text-[var(--k-muted)] hover:border-[var(--k-dim)] bg-[var(--k-base-200)]"
                }`}
              >{v >= 1000 ? `${v / 1000}k` : v}Hz</button>
            ))}
          </div>
          <p className="text-[9px] text-[var(--k-dim)] mt-1">Range: 1 Hz – 40 kHz</p>
        </div>
      </AdvancedSection>

      {/* Duty cycle slider */}
      <div className="px-3 py-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[var(--k-muted)] font-medium">Duty Cycle</span>
          <span className="text-[10px] font-mono text-purple-400">{duty} %</span>
        </div>
        <input type="range" min={0} max={100} step={1} value={duty}
          onChange={e => setDuty(Number(e.target.value))}
          className="nodrag w-full h-1 cursor-pointer" style={{ accentColor: COLORS.purple }} />
        <div className="flex justify-between mt-0.5">
          <span className="text-[8px] text-[var(--k-dim)]">0%</span>
          <span className="text-[8px] text-[var(--k-dim)]">100%</span>
        </div>
      </div>

      <AdvancedSection>
        {/* PWM waveform mini-preview */}
        <div className="px-3 pb-1">
          <svg width="100%" height="28" viewBox="0 0 200 28" preserveAspectRatio="none" className="rounded-lg overflow-hidden border border-[var(--k-border)]" style={{ background: "var(--k-base-100)" }}>
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
          <span className="text-[9px] uppercase tracking-wider text-[var(--k-muted)] font-bold">Auto-modulate from Sensor</span>
        </div>
        <NodeField label="Sensor var">
          <TextInput value={sensorBind} onChange={setSensorBind} />
        </NodeField>
        {sensorBind.trim() !== "" && (
          <>
            <NodeField label="Sensor min"><NumberInput value={sensorMin} onChange={setSensorMin} /></NodeField>
            <NodeField label="Sensor max"><NumberInput value={sensorMax} onChange={setSensorMax} /></NodeField>
            <p className="text-[9px] text-[var(--k-dim)] px-3 pb-1">Maps <span className="font-mono text-[var(--k-muted)]">{sensorBind}</span> ({sensorMin}–{sensorMax}) → duty 0–100%</p>
          </>
        )}
      </AdvancedSection>
    </BaseNode>
  );
}
