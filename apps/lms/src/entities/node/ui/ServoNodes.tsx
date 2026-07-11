import { useState, useEffect, useRef, useCallback } from "react";
import { useNodes } from "@xyflow/react";
import {
  BaseNode,
  NodeField,
  NumberInput,
  TextInput,
  SelectInput,
  ToggleInput,
  useNodeField,
  AdvancedSection,
  COLORS,
} from "./BaseNode";
import { AngleDial, MotorIcon, SmoothSlider, SpeedVarInput } from "./_shared";
import { SERVO_MODELS, SERVO_MODEL_ORDER, OLED } from "@/entities/board";
import type { ServoModelId, ServoType } from "@/entities/board";

// ─── Board hardware constants ──────────────────────────────────────────────────
const SERVO_PORTS = {
  S1: { pin: 21, label: "S1 (GPIO 21)" },
  S2: { pin: 47, label: "S2 (GPIO 47)" },
  S3: { pin: 39, label: "S3 (GPIO 39)" },
  S4: { pin: 40, label: "S4 (GPIO 40)" },
} as const;

type ServoKey = keyof typeof SERVO_PORTS;

const SERVO_OPTIONS = (Object.keys(SERVO_PORTS) as ServoKey[]).map(k => ({ label: SERVO_PORTS[k].label, value: k }));

const SERVO_MODEL_OPTIONS = SERVO_MODEL_ORDER.map(k => ({ label: SERVO_MODELS[k].label, value: k }));
const SERVO_PRIMARY = "var(--k-warning)";
const SERVO_SECONDARY = "var(--k-info)";
const SERVO_TERTIARY = "var(--k-success)";
const SEQUENCER_ACCENT = "var(--k-primary)";

// Servo model + travel-type selector, shared by the servo nodes.
function ServoModelFields({
  model, onModelChange, servoType, onTypeChange,
}: {
  model: ServoModelId;
  onModelChange: (v: ServoModelId) => void;
  servoType: ServoType;
  onTypeChange: (v: ServoType) => void;
}) {
  return (
    <>
      <NodeField label="Servo Model">
        <SelectInput value={model} onChange={v => onModelChange(v as ServoModelId)} compact options={SERVO_MODEL_OPTIONS} />
      </NodeField>
      <NodeField label="Type">
        <ToggleInput
          value={servoType === "360"}
          onChange={on => onTypeChange(on ? "360" : "180")}
          leftLabel="180° pos"
          rightLabel="360° cont"
        />
      </NodeField>
    </>
  );
}

// Continuous-rotation (360°) speed slider: -100…100, 0 = stop.
// `speedVar` optionally binds the speed to a runtime variable (slider becomes a
// dimmed default while the variable drives the value).
function ContinuousSpeed({ speed, onChange, color, speedVar, onVarChange }: {
  speed: number; onChange: (v: number) => void; color: string;
  speedVar?: string; onVarChange?: (v: string) => void;
}) {
  const [disp, setDisp] = useState(speed);
  useEffect(() => { setDisp(speed); }, [speed]);
  const usingVar = !!speedVar?.trim();
  const liveLabel = usingVar
    ? speedVar!.trim()
    : (disp === 0 ? "STOP" : disp > 0 ? `+${disp}%` : `${disp}%`);
  return (
    <div className="px-3 py-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[var(--k-muted)] font-medium">Speed</span>
        <span className="text-[10px] font-mono" style={{ color: usingVar ? "#22d3ee" : "var(--k-warning)" }}>
          {liveLabel}
        </span>
      </div>
      <SmoothSlider value={speed} onChange={onChange} onLiveChange={setDisp}
        min={-100} max={100} step={5} color={color} disabled={usingVar} />
      <div className="flex justify-between mt-0.5">
        <span className="text-[8px] text-[var(--k-dim)]">← Reverse</span>
        <span className="text-[8px] text-[var(--k-dim)]">Forward →</span>
      </div>
      {onVarChange && <SpeedVarInput value={speedVar ?? ""} onChange={onVarChange} />}
    </div>
  );
}

function ServoPinInfo({ servoKey }: { servoKey: ServoKey }) {
  return (
    <div className="mx-3 mb-1 px-2.5 py-1.5 rounded-lg border border-[var(--k-border)] bg-[var(--k-base-200)]">
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-wider text-[var(--k-muted)] font-bold">Signal pin — fixed GPIO</span>
        <span className="text-[9px] font-mono text-[var(--k-warning)]">locked</span>
      </div>
      <div className="flex gap-2 mt-0.5">
        <span className="text-[10px] text-[var(--k-muted)]">GPIO <span className="text-[var(--k-text)] font-mono">{SERVO_PORTS[servoKey].pin}</span></span>
      </div>
    </div>
  );
}

// ─── Servo Motor ──────────────────────────────────────────────────────────────
export function ServoMotorNode() {
  const [servoPort, setServoPort]   = useNodeField<ServoKey>("servoPort", "S1");
  const [servoModel, setServoModel] = useNodeField<ServoModelId>("servoModel", "mg90s");
  const [servoType, setServoType]   = useNodeField<ServoType>("servoType", "180");
  const [angle, setAngle]           = useNodeField<number | string>("angle", 90);
  const [contSpeed, setContSpeed]   = useNodeField<number>("contSpeed", 0);
  const [contSpeedVar, setContSpeedVar] = useNodeField<string>("contSpeedVar", "");
  const angleNum = Number(angle);
  const dialAngle = Number.isFinite(angleNum) ? Math.max(0, Math.min(180, angleNum)) : 90;
  return (
    <BaseNode title="Servo Motor" color={SERVO_PRIMARY} icon={<MotorIcon />} width="240px">
      <NodeField label="Servo Port">
        <SelectInput value={servoPort} onChange={v => setServoPort(v as ServoKey)} compact options={SERVO_OPTIONS} />
      </NodeField>
      <AdvancedSection>
        <ServoPinInfo servoKey={servoPort} />
        <ServoModelFields model={servoModel} onModelChange={setServoModel} servoType={servoType} onTypeChange={setServoType} />
      </AdvancedSection>
      {servoType === "360"
        ? <ContinuousSpeed speed={contSpeed} onChange={setContSpeed} color={SERVO_PRIMARY} speedVar={contSpeedVar} onVarChange={setContSpeedVar} />
        : (
          <>
            <AngleDial angle={dialAngle} onChange={setAngle} color={SERVO_PRIMARY} />
            <NodeField label="Set Angle (°)">
              <TextInput value={String(angle ?? "")} onChange={setAngle} />
            </NodeField>
          </>
        )}
    </BaseNode>
  );
}

// ─── Servo Motor Advance ──────────────────────────────────────────────────────
export function ServoMotorAdvanceNode() {
  const [servoPort, setServoPort] = useNodeField<ServoKey>("servoPort", "S1");
  const [servoModel, setServoModel] = useNodeField<ServoModelId>("servoModel", "mg90s");
  const [servoType, setServoType]   = useNodeField<ServoType>("servoType", "180");
  const [startAngle, setStartAngle] = useNodeField<number>("startAngle", 0);
  const [endAngle, setEndAngle]     = useNodeField<number>("endAngle", 90);
  const [speed, setSpeed]           = useNodeField<number>("speed", 50);
  const [steps, setSteps]           = useNodeField<number>("steps", 10);
  const [contSpeed, setContSpeed]   = useNodeField<number>("contSpeed", 60);
  const [contSpeedVar, setContSpeedVar] = useNodeField<string>("contSpeedVar", "");
  const [sweepPeriod, setSweepPeriod] = useNodeField<number>("sweepPeriod", 1000);
  const [sweepSpeedDisp, setSweepSpeedDisp] = useState(speed);
  const [bounce, setBounce]         = useNodeField<boolean>("bounce", false);
  const [loop, setLoop]             = useNodeField<boolean>("loop", false);
  useEffect(() => { setSweepSpeedDisp(speed); }, [speed]);

  return (
    <BaseNode title="Servo Sweep" color={SERVO_PRIMARY} icon={<MotorIcon />} width="240px">
      <NodeField label="Servo Port">
        <SelectInput value={servoPort} onChange={v => setServoPort(v as ServoKey)} compact options={SERVO_OPTIONS} />
      </NodeField>
      <AdvancedSection>
        <ServoPinInfo servoKey={servoPort} />
        <ServoModelFields model={servoModel} onModelChange={setServoModel} servoType={servoType} onTypeChange={setServoType} />
      </AdvancedSection>

      {servoType === "360" ? (
        <>
          {/* Continuous servo: oscillate forward ↔ reverse */}
          <ContinuousSpeed speed={contSpeed} onChange={setContSpeed} color={SERVO_PRIMARY} speedVar={contSpeedVar} onVarChange={setContSpeedVar} />
          <NodeField label="Period (ms)"><NumberInput value={sweepPeriod} onChange={setSweepPeriod} /></NodeField>
          <div className="mx-3 mb-1 px-2.5 py-1 rounded-lg border border-[var(--k-border)] bg-[var(--k-base-100)]">
            <p className="text-[9px] text-[var(--k-muted)]">Oscillates {Math.abs(contSpeed)}% forward then reverse, {sweepPeriod}ms each way.</p>
          </div>
        </>
      ) : (
        <>
          {/* Dual dial preview */}
          <div className="flex px-2 gap-2 pb-1">
            <div className="flex flex-col items-center flex-1">
              <span className="text-[9px] text-[var(--k-muted)] mb-0.5">Start</span>
              <AngleDial angle={startAngle} onChange={setStartAngle} max={endAngle} color={SERVO_SECONDARY} />
            </div>
            <div className="flex flex-col items-center flex-1">
              <span className="text-[9px] text-[var(--k-muted)] mb-0.5">End</span>
              <AngleDial angle={endAngle} onChange={setEndAngle} min={startAngle} color={SERVO_PRIMARY} />
            </div>
          </div>

          <div className="px-3 pb-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[var(--k-muted)] font-medium">Speed</span>
              <span className="text-[10px] font-mono text-[var(--k-warning)]">{sweepSpeedDisp}%</span>
            </div>
            <SmoothSlider value={speed} onChange={setSpeed} onLiveChange={setSweepSpeedDisp}
              min={1} max={100} step={1} color={SERVO_PRIMARY} />
          </div>

          {/* Bounce & Loop toggles */}
          <NodeField label="Bounce back">
            <ToggleInput value={bounce} onChange={setBounce} leftLabel="One-way" rightLabel="↩ Return" />
          </NodeField>
          <NodeField label="Loop">
            <ToggleInput value={loop} onChange={setLoop} leftLabel="Once" rightLabel="∞ Loop" />
          </NodeField>

          {/* Pattern hint */}
          <div className="mx-3 mb-1.5 px-2.5 py-1 rounded-lg border border-[var(--k-border)] bg-[var(--k-base-100)]">
            <p className="text-[9px] text-[var(--k-muted)] font-mono">
              {bounce
                ? `${startAngle}° → ${endAngle}° → ${startAngle}°${loop ? " (repeating)" : ""}`
                : `${startAngle}° → ${endAngle}°${loop ? " (repeating)" : ""}`}
            </p>
          </div>

          <AdvancedSection><NodeField label="Steps"><NumberInput value={steps} onChange={setSteps} /></NodeField></AdvancedSection>
        </>
      )}
    </BaseNode>
  );
}

// ─── Servo Controller ─────────────────────────────────────────────────────────
export function ServoControllerNode() {
  const [servoPort, setServoPort]   = useNodeField<ServoKey>("servoPort", "S1");
  const [servoModel, setServoModel] = useNodeField<ServoModelId>("servoModel", "mg90s");
  const [servoType, setServoType]   = useNodeField<ServoType>("servoType", "180");
  const [mode, setMode]             = useNodeField<string>("mode", "standard");
  const [angle, setAngle]           = useNodeField<number | string>("angle", 90);
  const [sweepMin, setSweepMin]     = useNodeField<number>("sweepMin", 0);
  const [sweepMax, setSweepMax]     = useNodeField<number>("sweepMax", 180);
  const [sweepPeriod, setSweepPeriod] = useNodeField<number>("sweepPeriod", 1000);
  const [contSpeed, setContSpeed]   = useNodeField<number>("contSpeed", 50);
  const [contSpeedVar, setContSpeedVar] = useNodeField<string>("contSpeedVar", "");
  const [pulseMin, setPulseMin]     = useNodeField<number>("pulseMin", 600);
  const [pulseMax, setPulseMax]     = useNodeField<number>("pulseMax", 2400);

  const angleNum = Number(angle);
  const dialAngle = Number.isFinite(angleNum) ? Math.max(0, Math.min(180, angleNum)) : 90;
  const pulseUs = Number.isFinite(angleNum)
    ? Math.round(pulseMin + (angleNum / 180) * (pulseMax - pulseMin))
    : null;

  // Picking a model presets the pulse-width fine-tune fields to that servo's range.
  const applyModel = (m: ServoModelId) => {
    setServoModel(m);
    setPulseMin(SERVO_MODELS[m].pulseMin);
    setPulseMax(SERVO_MODELS[m].pulseMax);
  };

  return (
    <BaseNode title="Servo Controller" color={SERVO_PRIMARY} icon={<MotorIcon />} width="260px">
      <NodeField label="Servo Port">
        <SelectInput value={servoPort} onChange={v => setServoPort(v as ServoKey)} compact options={SERVO_OPTIONS} />
      </NodeField>
      <AdvancedSection>
        <ServoPinInfo servoKey={servoPort} />
        <ServoModelFields model={servoModel} onModelChange={applyModel} servoType={servoType} onTypeChange={setServoType} />
      </AdvancedSection>

      {/* 360° continuous servos are speed-controlled — mode selection only applies to 180° */}
      {servoType === "180" && (
        <NodeField label="Mode">
          <SelectInput value={mode} onChange={setMode} compact
            options={[
              { label: "Standard (0–180°)", value: "standard" },
              { label: "Sweep Animation", value: "sweep" },
            ]} />
        </NodeField>
      )}

      {servoType === "180" && mode === "standard" && (
        <>
          <AngleDial angle={dialAngle} onChange={setAngle} color={SERVO_PRIMARY} />
          <NodeField label="Set Angle (°)">
            <TextInput value={String(angle ?? "")} onChange={setAngle} />
          </NodeField>
          <div className="mx-3 mb-1 px-2.5 py-1 rounded-lg border border-[var(--k-border)] bg-[var(--k-base-100)] flex items-center justify-between">
            <span className="text-[9px] text-[var(--k-muted)]">Pulse @ {String(angle)}°</span>
            <span className="text-[10px] font-mono text-[var(--k-warning)]">{pulseUs == null ? "auto" : `${pulseUs} µs`}</span>
          </div>
        </>
      )}

      {servoType === "360" && (
        <ContinuousSpeed speed={contSpeed} onChange={setContSpeed} color={SERVO_PRIMARY}
          speedVar={contSpeedVar} onVarChange={setContSpeedVar} />
      )}

      {servoType === "180" && mode === "sweep" && (
        <>
          <div className="px-3 pb-1 flex gap-4">
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-[var(--k-muted)] mb-0.5">Min</span>
              <AngleDial angle={sweepMin} onChange={setSweepMin} max={sweepMax} color={SERVO_SECONDARY} />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-[var(--k-muted)] mb-0.5">Max</span>
              <AngleDial angle={sweepMax} onChange={setSweepMax} min={sweepMin} color={SERVO_PRIMARY} />
            </div>
          </div>
          <NodeField label="Period (ms)"><NumberInput value={sweepPeriod} onChange={setSweepPeriod} /></NodeField>
        </>
      )}

      <AdvancedSection>
        <div className="px-3 pt-1 pb-0.5">
          <span className="text-[9px] uppercase tracking-wider text-[var(--k-muted)] font-bold">Pulse Width Fine-tune</span>
        </div>
        <NodeField label="Min (µs)"><NumberInput value={pulseMin} onChange={setPulseMin} /></NodeField>
        <NodeField label="Max (µs)"><NumberInput value={pulseMax} onChange={setPulseMax} /></NodeField>
        <div className="mx-3 mb-2 px-2.5 py-1 rounded-lg border border-[var(--k-border)] bg-[var(--k-base-100)]">
          <div className="flex justify-between text-[9px]">
            <span className="text-[var(--k-muted)]">{pulseMin} µs @ 0°</span>
            <span className="text-[var(--k-muted)]">{pulseMax} µs @ 180°</span>
          </div>
          <p className="text-[9px] text-[var(--k-dim)] mt-0.5">Standard: 600–2400 µs · SG90: 500–2400 µs</p>
        </div>
      </AdvancedSection>
    </BaseNode>
  );
}

// ─── Multi-Servo Sequencer ─────────────────────────────────────────────────────
interface Keyframe { time: number; angles: number[] }

function defaultKeyframes(): Keyframe[] {
  return [
    { time: 0,    angles: [90, 90, 90] },
    { time: 500,  angles: [0,  90, 180] },
    { time: 1000, angles: [180, 0, 90] },
    { time: 1500, angles: [90, 90, 90] },
  ];
}

export function MultiServoSequencerNode() {
  const [s1port, setS1port] = useNodeField<ServoKey>("s1port", "S1");
  const [s2port, setS2port] = useNodeField<ServoKey>("s2port", "S2");
  const [s3port, setS3port] = useNodeField<ServoKey>("s3port", "S3");
  const [keyframeDelay, setKeyframeDelay] = useNodeField<number>("keyframeDelay", 500);
  const [loop, setLoop]   = useNodeField<boolean>("loop", true);
  const [keyframes, setKeyframes] = useNodeField<Keyframe[]>("keyframes", defaultKeyframes());

  const [playing, setPlaying] = useState(false);
  const [playIdx, setPlayIdx] = useState(0);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalDuration = keyframes.length > 0 ? keyframes[keyframes.length - 1].time + keyframeDelay : 0;

  const startPlay = () => {
    setPlaying(true); setPlayIdx(0);
    playRef.current = setInterval(() => {
      setPlayIdx(i => {
        const next = i + 1;
        if (next >= keyframes.length) {
          if (!loop) { stopPlay(); return i; }
          return 0;
        }
        return next;
      });
    }, keyframeDelay);
  };
  const stopPlay = () => { setPlaying(false); if (playRef.current) clearInterval(playRef.current); };

  const updateAngle = useCallback((kfIdx: number, servoIdx: number, val: number) => {
    setKeyframes(keyframes.map((kf, i) => i === kfIdx
      ? { ...kf, angles: kf.angles.map((a, j) => j === servoIdx ? val : a) }
      : kf));
  }, [keyframes, setKeyframes]);

  const addKeyframe = () => {
    const lastTime = keyframes.length > 0 ? keyframes[keyframes.length - 1].time : 0;
    setKeyframes([...keyframes, { time: lastTime + keyframeDelay, angles: [90, 90, 90] }]);
  };

  const removeKeyframe = (idx: number) => {
    if (keyframes.length <= 1) return;
    setKeyframes(keyframes.filter((_, i) => i !== idx));
  };

  const SERVO_COLORS = [SERVO_PRIMARY, SERVO_SECONDARY, SERVO_TERTIARY];
  const currentAngles = playing ? keyframes[playIdx]?.angles ?? [90,90,90] : keyframes[0]?.angles ?? [90,90,90];

  return (
    <BaseNode title="Multi-Servo Sequencer" color={SEQUENCER_ACCENT} icon={<MotorIcon />} width="290px">
      {([s1port, s2port, s3port] as ServoKey[]).map((p, i) => {
        const setters = [setS1port, setS2port, setS3port];
        return (
          <NodeField key={i} label={`Servo ${i + 1}`}>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: SERVO_COLORS[i] }} />
              <SelectInput value={p} onChange={v => setters[i](v as ServoKey)} compact options={SERVO_OPTIONS} />
            </div>
          </NodeField>
        );
      })}

      <NodeField label="Step delay (ms)"><NumberInput value={keyframeDelay} onChange={setKeyframeDelay} /></NodeField>
      <NodeField label="Playback"><ToggleInput value={loop} onChange={setLoop} leftLabel="One-shot" rightLabel="Loop" /></NodeField>

      <AdvancedSection>
      <div className="px-3 pt-2 pb-0.5">
        <span className="text-[9px] uppercase tracking-wider text-[var(--k-muted)] font-bold">Timeline ({keyframes.length} keyframes · {totalDuration}ms)</span>
      </div>

      <div className="px-3 pb-1">
        <div className="relative h-6 rounded-lg bg-[var(--k-base-100)] border border-[var(--k-border)] overflow-hidden">
          {keyframes.map((kf, i) => {
            const pct = totalDuration > 0 ? (kf.time / totalDuration) * 100 : (i / keyframes.length) * 100;
            const isActive = playing && i === playIdx;
            return (
              <div key={i} className="absolute top-0 h-full flex flex-col justify-center"
                style={{ left: `${pct}%`, transform: "translateX(-50%)" }}>
                <div
                  className={`w-1.5 h-4 rounded-sm transition-all ${isActive ? "bg-[var(--k-primary)]" : "bg-[var(--k-base-400)]"}`}
                  style={isActive ? { boxShadow: "0 0 6px color-mix(in srgb, var(--k-primary) 80%, transparent)" } : undefined}
                />
              </div>
            );
          })}
          {playing && (
            <div className="absolute top-0 bottom-0 w-0.5 transition-all"
              style={{ backgroundColor: "color-mix(in srgb, var(--k-primary) 70%, transparent)",
                left: `${(playIdx / Math.max(1, keyframes.length - 1)) * 100}%` }}
            />
          )}
        </div>
      </div>

      <div className="max-h-48 overflow-y-auto px-3 flex flex-col gap-1.5 pb-1">
        {keyframes.map((kf, kfIdx) => (
          <div
            key={kfIdx}
            className="rounded-lg border p-2 transition-all"
            style={playing && kfIdx === playIdx
              ? {
                borderColor: "color-mix(in srgb, var(--k-primary) 60%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--k-primary) 6%, transparent)",
              }
              : undefined}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-bold text-[var(--k-muted)]">KF {kfIdx + 1} @ {kf.time}ms</span>
              <button onClick={() => removeKeyframe(kfIdx)}
                className="nodrag text-[9px] text-[var(--k-dim)] transition-colors px-1 hover:text-[var(--k-error)]">✕</button>
            </div>
            <div className="flex gap-2">
              {kf.angles.map((a, sIdx) => (
                <div key={sIdx} className="flex flex-col items-center gap-0.5 flex-1">
                  <span className="text-[8px] font-bold" style={{ color: SERVO_COLORS[sIdx] }}>S{sIdx + 1}</span>
                  <input type="range" min={0} max={180} step={1} value={a}
                    onChange={e => updateAngle(kfIdx, sIdx, Number(e.target.value))}
                    className="nodrag w-full h-1 cursor-pointer"
                    style={{ accentColor: SERVO_COLORS[sIdx] }} />
                  <span className="text-[9px] font-mono text-[var(--k-muted)]">{a}°</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="px-3 pb-1 pt-0.5">
        <div className="rounded-lg border border-[var(--k-border)] bg-[var(--k-base-100)] p-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] text-[var(--k-muted)] uppercase tracking-wider font-bold">Preview</span>
            <button onClick={playing ? stopPlay : startPlay}
              className="nodrag px-2 py-0.5 rounded text-[9px] font-bold border transition-all"
              style={playing
                ? {
                  borderColor: "color-mix(in srgb, var(--k-error) 40%, transparent)",
                  color: "var(--k-error)",
                  backgroundColor: "color-mix(in srgb, var(--k-error) 10%, transparent)",
                }
                : {
                  borderColor: "color-mix(in srgb, var(--k-primary) 40%, transparent)",
                  color: "var(--k-primary)",
                  backgroundColor: "color-mix(in srgb, var(--k-primary) 10%, transparent)",
                }}
            >{playing ? "⏹ Stop" : "▶ Play"}</button>
          </div>
          <div className="flex justify-around">
            {currentAngles.map((a, i) => {
              const pct = a / 180;
              const r = 18, cx = 22, cy = 22;
              const START = 225, TOTAL = 270;
              const aDeg = START + pct * TOTAL;
              const aRad = (aDeg * Math.PI) / 180;
              const kx = cx + r * Math.cos(aRad), ky = cy + r * Math.sin(aRad);
              const a1r = (START * Math.PI) / 180;
              const x1 = cx + r * Math.cos(a1r), y1 = cy + r * Math.sin(a1r);
              const largeArc = pct * TOTAL > 180 ? 1 : 0;
              return (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <svg width={44} height={44}>
                    <path d={`M${x1},${y1} A${r},${r},0,${largeArc},1,${kx},${ky}`}
                      fill="none" stroke={SERVO_COLORS[i]} strokeWidth={3} strokeLinecap="round" opacity={0.7} />
                    <circle cx={kx} cy={ky} r={3} fill={SERVO_COLORS[i]} />
                    <text x={cx} y={cy + 4} textAnchor="middle" fill="var(--k-text)" fontSize={9} fontFamily="monospace">{a}°</text>
                  </svg>
                  <span className="text-[8px]" style={{ color: SERVO_COLORS[i] }}>S{i + 1}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-3 pb-2 flex gap-2">
        <button onClick={addKeyframe}
          className="nodrag flex-1 py-1 rounded-lg border text-[10px] font-bold transition-all"
          style={{
            borderColor: "color-mix(in srgb, var(--k-primary) 40%, transparent)",
            color: "var(--k-primary)",
            backgroundColor: "color-mix(in srgb, var(--k-primary) 10%, transparent)",
          }}>
          + Add Keyframe
        </button>
        <button
          onClick={() => {
            const arr = keyframes.map(kf => `{t:${kf.time}, a:[${kf.angles.join(",")}]}`).join(", ");
            navigator.clipboard.writeText(`[${arr}]`).catch(() => {});
          }}
          className="nodrag flex-1 py-1 rounded-lg border border-[var(--k-border)] text-[var(--k-muted)] text-[10px] font-bold hover:border-[var(--k-dim)] hover:text-[var(--k-text)] transition-all">
          ⎘ Export
        </button>
      </div>
      </AdvancedSection>
    </BaseNode>
  );
}

// ─── Shadow Arm (pots on GPIO ADC pins → variables) ─────────────────────────────
export function ShadowArmNode() {
  const [prefix, setPrefix]   = useNodeField<string>("varPrefix", "j");
  const [potPins, setPotPins] = useNodeField<number[]>("potPins", [4, 5, 1, 2]);
  const [shadowInv, setShadowInv] = useNodeField<boolean[]>("shadowInv", [false, false, false, false]);
  const [potMin, setPotMin]   = useNodeField<number[]>("potMin", [0, 0, 0, 0]);
  const [potMax, setPotMax]   = useNodeField<number[]>("potMax", [65535, 65535, 65535, 65535]);
  const [alpha, setAlpha]     = useNodeField<number>("shadowAlpha", 25);
  const [oversample, setOversample] = useNodeField<number>("oversample", 2);
  const [deadband, setDeadband]     = useNodeField<number>("deadband", 1);

  const setAt = (arr: number[], set: (v: number[]) => void) =>
    (i: number, v: number) => set(arr.map((x, j) => (j === i ? v : x)));
  const setPin = setAt(potPins, setPotPins);
  const setMin = setAt(potMin, setPotMin);
  const setMax = setAt(potMax, setPotMax);
  const toggleInv = (i: number) => setShadowInv(shadowInv.map((x, j) => (j === i ? !x : x)));
  const pre = /^[A-Za-z_]\w*$/.test(prefix) ? prefix : "j";
  const JOINT_NAMES = ["base", "gripper", "bottom elbow", "top elbow"];

  return (
    <BaseNode title="Shadow Arm (Pots)" color={COLORS.cyan} icon={<MotorIcon />} width="260px">
      <div className="mx-3 mb-1.5 px-2.5 py-1 rounded-lg border border-[var(--k-border)] bg-[var(--k-base-100)]">
        <p className="text-[9px] text-[var(--k-muted)]">4 pots wired straight to GPIO ADC pins → defines <span className="font-mono text-cyan-400">read_shadow()</span> for the <span className="text-orange-400">Main Arm</span>. Just drop both on the canvas — no loop needed.</p>
      </div>
      <NodeField label="Variable prefix">
        <TextInput value={prefix} onChange={setPrefix}  />
      </NodeField>

      <div className="px-3 pt-1 pb-0.5">
        <span className="text-[9px] uppercase tracking-wider text-[var(--k-muted)] font-bold">Joint → GPIO pin</span>
      </div>
      {[0, 1, 2, 3].map(i => (
        <NodeField key={i} label={`${pre}${i + 1} · ${JOINT_NAMES[i]}`}>
          <div className="flex items-center gap-1.5">
            <NumberInput value={potPins[i]} onChange={v => setPin(i, Math.max(0, Math.round(v)))} />
            <button onClick={() => toggleInv(i)} title="Invert direction"
              className={`nodrag px-1.5 py-0.5 rounded text-[9px] font-bold border transition-all ${
                shadowInv[i] ? "border-cyan-500/50 text-cyan-400 bg-cyan-500/10" : "border-[var(--k-border)] text-[var(--k-dim)]"
              }`}>⇄</button>
          </div>
        </NodeField>
      ))}

      <AdvancedSection>
        <div className="mx-3 mb-1 px-2.5 py-1 rounded-lg border border-[var(--k-border)] bg-[var(--k-base-200)]">
          <span className="text-[9px] text-[var(--k-muted)]">Pots read via <span className="font-mono text-[var(--k-text)]">read_u16()</span> (0–65535, 11 dB atten). Default pins 4/5/1/2 = the two sensor ports.</span>
        </div>
        <div className="px-3 pt-1 pb-0.5">
          <span className="text-[9px] uppercase tracking-wider text-[var(--k-muted)] font-bold">Calibration (ADC min → max)</span>
        </div>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="px-3 pb-1 flex items-center gap-1.5">
            <span className="text-[9px] w-7 text-[var(--k-muted)] font-mono">{pre}{i + 1}</span>
            <NumberInput value={potMin[i]} onChange={v => setMin(i, v)} />
            <span className="text-[8px] text-[var(--k-dim)]">→</span>
            <NumberInput value={potMax[i]} onChange={v => setMax(i, v)} />
          </div>
        ))}
        <div className="px-3 py-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[var(--k-muted)] font-medium">Smoothing</span>
            <span className="text-[10px] font-mono text-cyan-400">{alpha}%</span>
          </div>
          <input type="range" min={1} max={100} step={1} value={alpha}
            onChange={e => setAlpha(Number(e.target.value))}
            className="nodrag w-full h-1 cursor-pointer" style={{ accentColor: COLORS.cyan }} />
          <div className="flex justify-between mt-0.5">
            <span className="text-[8px] text-[var(--k-dim)]">Smoother</span>
            <span className="text-[8px] text-[var(--k-dim)]">Snappier</span>
          </div>
        </div>
        <NodeField label="Oversampling">
          <NumberInput value={oversample} onChange={v => setOversample(Math.max(1, Math.round(v)))} />
        </NodeField>
        <NodeField label="Deadband (°)">
          <NumberInput value={deadband} onChange={v => setDeadband(Math.max(0, Math.round(v)))} />
        </NodeField>
        <div className="mx-3 mb-1 px-2.5 py-1 rounded-lg border border-[var(--k-border)] bg-[var(--k-base-100)]">
          <p className="text-[9px] text-[var(--k-muted)]">More oversampling = less noise but slower. Deadband stops servo buzz when holding still. ⇄ flips a joint's direction.</p>
        </div>
      </AdvancedSection>
    </BaseNode>
  );
}

// ─── Shadow Arm Calibration (one-shot) ──────────────────────────────────────────
// Flash this ALONE, sweep each joint to its extremes, tap the button to lock its
// min/max. Writes /shadow_calib.json which the Shadow Arm auto-loads on startup.
export function ArmCalibrationNode() {
  const [prefix, setPrefix]   = useNodeField<string>("varPrefix", "j");
  const [potPins, setPotPins] = useNodeField<number[]>("potPins", [4, 5, 1, 2]);
  const [calBtnPin, setCalBtnPin] = useNodeField<number>("calBtnPin", 10);

  const setPin = (i: number, v: number) => setPotPins(potPins.map((x, j) => (j === i ? v : x)));
  const pre = /^[A-Za-z_]\w*$/.test(prefix) ? prefix : "j";
  const JOINT_NAMES = ["base", "gripper", "bottom elbow", "top elbow"];

  return (
    <BaseNode title="Arm Calibration" color={COLORS.cyan} icon={<MotorIcon />} width="260px">
      <div className="mx-3 mb-1.5 px-2.5 py-1 rounded-lg border border-cyan-500/30 bg-cyan-500/5">
        <p className="text-[9px] text-[var(--k-muted)]">Run this <span className="text-cyan-400 font-bold">once, alone</span>. Sweep each joint fully both ways, then tap BTN{calBtnPin} to lock. Saves <span className="font-mono text-cyan-400">/shadow_calib.json</span> — the Shadow Arm loads it automatically. Watch values on the <span className="text-cyan-400">dashboard</span>.</p>
      </div>
      <NodeField label="Variable prefix">
        <TextInput value={prefix} onChange={setPrefix} />
      </NodeField>
      <NodeField label="Advance button (GPIO)">
        <NumberInput value={calBtnPin} onChange={v => setCalBtnPin(Math.max(0, Math.round(v)))} />
      </NodeField>
      <div className="px-3 pt-1 pb-0.5">
        <span className="text-[9px] uppercase tracking-wider text-[var(--k-muted)] font-bold">Joint → GPIO pin</span>
      </div>
      {[0, 1, 2, 3].map(i => (
        <NodeField key={i} label={`${pre}${i + 1} · ${JOINT_NAMES[i]}`}>
          <NumberInput value={potPins[i]} onChange={v => setPin(i, Math.max(0, Math.round(v)))} />
        </NodeField>
      ))}
      <div className="mx-3 my-1.5 px-2.5 py-1 rounded-lg border border-[var(--k-border)] bg-[var(--k-base-100)]">
        <p className="text-[9px] text-[var(--k-muted)]">Pins must match your Shadow Arm node. After the last joint locks, re-flash your normal program.</p>
      </div>
    </BaseNode>
  );
}

// A control that can be driven by a variable, a physical switch (active-low
// GPIO), or both — used for the Main Arm's Mode and Record controls.
// Shared servo-output config (ports / limits / invert / slew / frame rate).
// Self-contained — reads its own node fields.
function ArmServoConfig({ pre }: { pre: string }) {
  const [servoPorts, setServoPorts] = useNodeField<string[]>("servoPorts", ["S1", "S2", "S3", "S4"]);
  const [slew, setSlew]       = useNodeField<number>("slew", 0);
  const [frameMs, setFrameMs] = useNodeField<number>("frameMs", 20);
  const [servoLo, setServoLo] = useNodeField<number[]>("servoLo", [0, 0, 0, 0]);
  const [servoHi, setServoHi] = useNodeField<number[]>("servoHi", [180, 180, 180, 180]);
  const [servoInv, setServoInv] = useNodeField<boolean[]>("servoInv", [false, false, false, false]);

  const setNumAt = (arr: number[], set: (v: number[]) => void) =>
    (i: number, v: number) => set(arr.map((x, j) => (j === i ? v : x)));
  const setLo = setNumAt(servoLo, setServoLo);
  const setHi = setNumAt(servoHi, setServoHi);
  const setPort = (i: number, v: string) => setServoPorts(servoPorts.map((x, j) => (j === i ? v : x)));
  const toggleInv = (i: number) => setServoInv(servoInv.map((x, j) => (j === i ? !x : x)));

  return (
    <>
      <div className="px-3 pt-1 pb-0.5">
        <span className="text-[9px] uppercase tracking-wider text-[var(--k-muted)] font-bold">Joint → servo port</span>
      </div>
      {[0, 1, 2, 3].map(i => (
        <NodeField key={i} label={`${pre}${i + 1}`}>
          <SelectInput value={servoPorts[i]} onChange={v => setPort(i, v)} compact options={SERVO_OPTIONS} />
        </NodeField>
      ))}
      <NodeField label="Frame rate (ms)"><NumberInput value={frameMs} onChange={v => setFrameMs(Math.max(5, v))} /></NodeField>
      <NodeField label="Slew limit (°/frame)"><NumberInput value={slew} onChange={v => setSlew(Math.max(0, Math.round(v)))} /></NodeField>
      <div className="px-3 pt-1 pb-0.5">
        <span className="text-[9px] uppercase tracking-wider text-[var(--k-muted)] font-bold">Servo limits (lo / hi / invert)</span>
      </div>
      {[0, 1, 2, 3].map(i => (
        <div key={i} className="px-3 pb-1 flex items-center gap-1.5">
          <span className="text-[9px] w-12 text-[var(--k-muted)] font-mono">{pre}{i + 1}·{servoPorts[i]}</span>
          <NumberInput value={servoLo[i]} onChange={v => setLo(i, Math.max(0, Math.min(180, v)))} />
          <span className="text-[8px] text-[var(--k-dim)]">→</span>
          <NumberInput value={servoHi[i]} onChange={v => setHi(i, Math.max(0, Math.min(180, v)))} />
          <button onClick={() => toggleInv(i)}
            className={`nodrag px-1.5 py-0.5 rounded text-[9px] font-bold border transition-all ${
              servoInv[i] ? "border-orange-500/50 text-orange-400 bg-orange-500/10" : "border-[var(--k-border)] text-[var(--k-dim)]"
            }`}>⇄</button>
        </div>
      ))}
    </>
  );
}

// ─── Arm — Live (continuous shadow → servos) ────────────────────────────────────
// ─── Main Arm — single controller: Live + 2-button record/capture + OLED ───────
export function MainArmNode() {
  const [prefix, setPrefix]   = useNodeField<string>("varPrefix", "j");
  const [jointSource, setJointSource] = useNodeField<string>("jointSource", "shadow");
  const [btn1Pin, setBtn1Pin] = useNodeField<number>("btn1Pin", 10);
  const [btn2Pin, setBtn2Pin] = useNodeField<number>("btn2Pin", 11);
  const [moveMs, setMoveMs]   = useNodeField<number>("moveMs", 4000);
  const [oledAddress, setOledAddress] = useNodeField<string>("oledAddress", "0x3c");
  const [oledDriver, setOledDriver]   = useNodeField<boolean>("oledDriver", true);
  const pre = /^[A-Za-z_]\w*$/.test(prefix) ? prefix : "j";

  return (
    <BaseNode title="Main Arm" color={COLORS.orange} icon={<MotorIcon />} width="270px">
      <div className="mx-3 mb-1.5 px-2.5 py-1 rounded-lg border border-[var(--k-border)] bg-[var(--k-base-100)]">
        <p className="text-[9px] text-[var(--k-muted)]">One node: <b>Live</b> by default. BTN1 tap → record, BTN2 → capture a point, BTN1 tap → save, BTN1 hold &gt;3s → play. Status shows on the OLED.</p>
      </div>

      <NodeField label="Variable prefix"><TextInput value={prefix} onChange={setPrefix} /></NodeField>
      <NodeField label="Joints from">
        <ToggleInput value={jointSource === "manual"} onChange={on => setJointSource(on ? "manual" : "shadow")}
          leftLabel="Shadow" rightLabel="Variables" />
      </NodeField>
      <NodeField label="BTN1 (rec/save/play)"><NumberInput value={btn1Pin} onChange={v => setBtn1Pin(Math.max(0, Math.round(v)))} /></NodeField>
      <NodeField label="BTN2 (capture point)"><NumberInput value={btn2Pin} onChange={v => setBtn2Pin(Math.max(0, Math.round(v)))} /></NodeField>

      <div className="mx-3 my-1 px-2.5 py-1 rounded-lg border border-[var(--k-border)] bg-[var(--k-base-100)]">
        <p className="text-[9px] text-[var(--k-muted)] leading-relaxed">Buttons are active-low (to GND). Each leg moves over <b>{(moveMs / 1000).toFixed(1)}s</b> with all servos arriving together.</p>
      </div>

      <AdvancedSection>
        <NodeField label="Move time (ms / leg)"><NumberInput value={moveMs} onChange={v => setMoveMs(Math.max(100, Math.round(v)))} /></NodeField>
        <div className="px-3 pt-1 pb-0.5">
          <span className="text-[9px] uppercase tracking-wider text-[var(--k-muted)] font-bold">OLED display</span>
        </div>
        <NodeField label="Driver">
          <ToggleInput value={oledDriver} onChange={setOledDriver} leftLabel="SH1106" rightLabel="SSD1306" />
        </NodeField>
        <NodeField label="OLED address"><TextInput value={oledAddress} onChange={setOledAddress} /></NodeField>
        <div className="mx-3 mb-1 px-2.5 py-1 rounded-lg border border-[var(--k-border)] bg-[var(--k-base-200)]">
          <span className="text-[9px] text-[var(--k-muted)]">OLED bus — SCL <span className="font-mono text-[var(--k-text)]">{OLED.scl}</span> · SDA <span className="font-mono text-[var(--k-text)]">{OLED.sda}</span> (shared with ADS)</span>
        </div>
        <ArmServoConfig pre={pre} />
      </AdvancedSection>
    </BaseNode>
  );
}

// ─── Servo Calibration ────────────────────────────────────────────────────────
export function ServoCalibrationNode() {
  const allNodes = useNodes();
  const servoNodes = allNodes.filter(n =>
    n.type === "servo_motor" || n.type === "servo_motor_advance" || n.type === "servo_controller"
  );

  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const [centered, setCentered] = useState(false);
  const [pulseMin] = useState(600);
  const [pulseMax] = useState(2400);

  const setOverride = (id: string, val: number) => setOverrides(prev => ({ ...prev, [id]: val }));
  const getAngle = (id: string) => overrides[id] ?? 90;
  const getPulse = (id: string) => {
    const a = getAngle(id);
    return Math.round(pulseMin + (a / 180) * (pulseMax - pulseMin));
  };

  const centerAll = () => {
    const next: Record<string, number> = {};
    servoNodes.forEach(n => { next[n.id] = 90; });
    setOverrides(next);
    setCentered(true);
    setTimeout(() => setCentered(false), 1500);
  };

  const portLabel = (n: typeof servoNodes[0]) => {
    const port = (n.data as Record<string, unknown>)?.servoPort as string | undefined;
    return port ? `${port} (GPIO ${(SERVO_PORTS as Record<string, {pin:number}>)[port]?.pin ?? "?"})` : n.id.slice(0, 8);
  };

  return (
    <BaseNode title="Servo Calibration" color="var(--k-accent)" icon={
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    } width="280px">
      <div className="mx-3 mb-2 px-2.5 py-2 rounded-lg border border-[var(--k-border)] bg-[var(--k-base-200)]">
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-wider text-[var(--k-muted)] font-bold">Canvas Servo Nodes</span>
          <span className="text-[10px] font-mono text-[var(--k-accent)]">{servoNodes.length} found</span>
        </div>
        {servoNodes.length === 0 && (
          <p className="text-[10px] text-[var(--k-dim)] mt-1">Add Servo Motor or Servo Controller nodes to the canvas.</p>
        )}
      </div>

      <div className="px-3 pb-2">
        <button onClick={centerAll}
          className="nodrag w-full py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2"
          style={centered
            ? {
              borderColor: "color-mix(in srgb, var(--k-success) 40%, transparent)",
              backgroundColor: "color-mix(in srgb, var(--k-success) 10%, transparent)",
              color: "var(--k-success)",
            }
            : {
              borderColor: "color-mix(in srgb, var(--k-accent) 40%, transparent)",
              backgroundColor: "color-mix(in srgb, var(--k-accent) 10%, transparent)",
              color: "var(--k-accent)",
            }}
        >
          {centered ? "✓ All Centered!" : "Center All Servos (90°)"}
        </button>
      </div>

      {servoNodes.length > 0 && (
        <>
          <div className="px-3 pb-0.5">
            <span className="text-[9px] uppercase tracking-wider text-[var(--k-muted)] font-bold">Individual Override</span>
          </div>
          <div className="max-h-56 overflow-y-auto px-3 pb-2 flex flex-col gap-2">
            {servoNodes.map(n => {
              const a = getAngle(n.id);
              const pulse = getPulse(n.id);
              return (
                <div key={n.id} className="rounded-lg border border-[var(--k-border)] bg-[var(--k-base-300)] p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-[var(--k-text)]">{portLabel(n)}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono text-[var(--k-accent)]">{pulse} µs</span>
                      <span className="text-[10px] font-mono text-[var(--k-warning)]">{a}°</span>
                    </div>
                  </div>
                  <input type="range" min={0} max={180} step={1} value={a}
                    onChange={e => setOverride(n.id, Number(e.target.value))}
                    className="nodrag w-full h-1 cursor-pointer" style={{ accentColor: "var(--k-accent)" }} />
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="mx-3 mb-2 px-2.5 py-1.5 rounded-lg border"
        style={{
          borderColor: "color-mix(in srgb, var(--k-warning) 20%, transparent)",
          backgroundColor: "color-mix(in srgb, var(--k-warning) 5%, transparent)",
        }}>
        <p className="text-[9px]" style={{ color: "color-mix(in srgb, var(--k-warning) 80%, var(--k-text) 20%)" }}>
          Compile-time utility only — does not generate runtime code.
        </p>
      </div>
    </BaseNode>
  );
}
