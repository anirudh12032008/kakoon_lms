import { useState, useRef, useCallback } from "react";
import { useNodes } from "@xyflow/react";
import {
  BaseNode,
  NodeField,
  NumberInput,
  SelectInput,
  ToggleInput,
  useNodeField,
  COLORS,
} from "./BaseNode";

// ─── Board hardware constants ──────────────────────────────────────────────────
const MOTOR_PORTS = {
  L1: { pwm: 15, dir: 16, label: "L1 – Front Left"  },
  L2: { pwm: 37, dir: 38, label: "L2 – Rear Left"   },
  R1: { pwm: 45, dir: 46, label: "R1 – Front Right" },
  R2: { pwm: 17, dir: 18, label: "R2 – Rear Right"  },
} as const;

const SERVO_PORTS = {
  S1: { pin: 21, label: "S1 (GPIO 21)" },
  S2: { pin: 47, label: "S2 (GPIO 47)" },
  S3: { pin: 39, label: "S3 (GPIO 39)" },
  S4: { pin: 40, label: "S4 (GPIO 40)" },
} as const;

type MotorKey = keyof typeof MOTOR_PORTS;
type ServoKey = keyof typeof SERVO_PORTS;

const MOTOR_OPTIONS = (Object.keys(MOTOR_PORTS) as MotorKey[]).map(k => ({ label: MOTOR_PORTS[k].label, value: k }));
const SERVO_OPTIONS = (Object.keys(SERVO_PORTS) as ServoKey[]).map(k => ({ label: SERVO_PORTS[k].label, value: k }));

const DIR_OPTIONS = [
  { label: "Forward", value: "Forward" },
  { label: "Reverse", value: "Reverse" },
  { label: "Brake",   value: "Brake"   },
  { label: "Coast",   value: "Coast"   },
];

function MotorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  );
}

function MotorPinInfo({ motorKey }: { motorKey: MotorKey }) {
  const m = MOTOR_PORTS[motorKey];
  return (
    <div className="mx-3 mb-1 px-2.5 py-1.5 rounded-lg border border-[#2d2d35] bg-[#111116]">
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">DRV8833 — fixed GPIO</span>
        <span className="text-[9px] font-mono text-orange-400">locked</span>
      </div>
      <div className="flex gap-3 mt-0.5">
        <span className="text-[10px] text-zinc-500">PWM <span className="text-zinc-300 font-mono">{m.pwm}</span></span>
        <span className="text-[10px] text-zinc-500">DIR <span className="text-zinc-300 font-mono">{m.dir}</span></span>
      </div>
    </div>
  );
}

function ServoPinInfo({ servoKey }: { servoKey: ServoKey }) {
  return (
    <div className="mx-3 mb-1 px-2.5 py-1.5 rounded-lg border border-[#2d2d35] bg-[#111116]">
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Signal pin — fixed GPIO</span>
        <span className="text-[9px] font-mono text-orange-400">locked</span>
      </div>
      <div className="flex gap-2 mt-0.5">
        <span className="text-[10px] text-zinc-500">GPIO <span className="text-zinc-300 font-mono">{SERVO_PORTS[servoKey].pin}</span></span>
      </div>
    </div>
  );
}

// ─── Angle Dial ───────────────────────────────────────────────────────────────
function AngleDial({ angle, onChange, min = 0, max = 180, color = COLORS.orange }: {
  angle: number; onChange: (v: number) => void; min?: number; max?: number; color?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState(false);

  const CX = 44, CY = 44, R = 34;
  // Arc spans 210° (from 255° to 465° / -105° to 105° offset from bottom)
  const START_DEG = 225, TOTAL_DEG = 270;
  const pct = (angle - min) / (max - min);
  const angleDeg = START_DEG + pct * TOTAL_DEG;
  const rad = (angleDeg * Math.PI) / 180;
  const knobX = CX + R * Math.cos(rad), knobY = CY + R * Math.sin(rad);

  const polarToValue = (clientX: number, clientY: number) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = clientX - rect.left - CX, y = clientY - rect.top - CY;
    let deg = (Math.atan2(y, x) * 180) / Math.PI;
    if (deg < 0) deg += 360;
    let rel = deg - START_DEG;
    if (rel < 0) rel += 360;
    if (rel > TOTAL_DEG) rel = rel > TOTAL_DEG + (360 - TOTAL_DEG) / 2 ? 0 : TOTAL_DEG;
    const v = Math.round(min + (rel / TOTAL_DEG) * (max - min));
    onChange(Math.max(min, Math.min(max, v)));
  };

  // Arc path helper
  const arcPath = (fromPct: number, toPct: number, c: string, w = 4) => {
    const a1 = ((START_DEG + fromPct * TOTAL_DEG) * Math.PI) / 180;
    const a2 = ((START_DEG + toPct * TOTAL_DEG) * Math.PI) / 180;
    const x1 = CX + R * Math.cos(a1), y1 = CY + R * Math.sin(a1);
    const x2 = CX + R * Math.cos(a2), y2 = CY + R * Math.sin(a2);
    const largeArc = (toPct - fromPct) * TOTAL_DEG > 180 ? 1 : 0;
    return <path d={`M${x1},${y1} A${R},${R},0,${largeArc},1,${x2},${y2}`} fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" />;
  };

  return (
    <div className="flex flex-col items-center gap-1 py-1">
      <svg ref={svgRef} width={88} height={88} style={{ cursor: "crosshair", userSelect: "none" }}
        onMouseDown={e => { e.stopPropagation(); setDragging(true); polarToValue(e.clientX, e.clientY); }}
        onMouseMove={e => { if (dragging) polarToValue(e.clientX, e.clientY); }}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
      >
        {/* Track */}
        {arcPath(0, 1, "#2d2d35", 5)}
        {/* Fill */}
        {arcPath(0, pct, color, 5)}
        {/* Knob */}
        <circle cx={knobX} cy={knobY} r={6} fill={color} />
        <circle cx={knobX} cy={knobY} r={3} fill="#0f0f12" />
        {/* Center readout */}
        <text x={CX} y={CY - 4} textAnchor="middle" fill="white" fontSize={14} fontWeight="bold" fontFamily="monospace">{angle}</text>
        <text x={CX} y={CY + 9} textAnchor="middle" fill="#6b7280" fontSize={8}>degrees</text>
      </svg>
      {/* Min/Max labels */}
      <div className="flex justify-between w-[88px] px-1">
        <span className="text-[8px] text-zinc-600">{min}°</span>
        <span className="text-[8px] text-zinc-600">{max}°</span>
      </div>
    </div>
  );
}

// ─── DC Motor (Single) ────────────────────────────────────────────────────────
export function DCMotorSingleNode() {
  const [motorPort, setMotorPort] = useNodeField<MotorKey>("motorPort", "L1");
  const [speed, setSpeed] = useNodeField<number>("speed", 50);
  const [direction, setDirection] = useNodeField<string>("direction", "Forward");
  const [pwmFreq, setPwmFreq] = useNodeField<number>("pwmFreq", 40000);

  return (
    <BaseNode title="DC Motor" color={COLORS.orange} icon={<MotorIcon />} width="260px">
      <NodeField label="Motor Port">
        <SelectInput value={motorPort} onChange={v => setMotorPort(v as MotorKey)} compact options={MOTOR_OPTIONS} />
      </NodeField>
      <MotorPinInfo motorKey={motorPort} />

      {/* Speed slider */}
      <div className="px-3 py-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[#9ca3af] font-medium">Speed</span>
          <span className="text-[10px] font-mono text-orange-400">{speed}%</span>
        </div>
        <input type="range" min={0} max={100} step={1} value={speed}
          onChange={e => setSpeed(Number(e.target.value))}
          className="nodrag w-full h-1 cursor-pointer" style={{ accentColor: COLORS.orange }} />
      </div>

      <NodeField label="Direction">
        <SelectInput value={direction} onChange={setDirection} compact options={DIR_OPTIONS} />
      </NodeField>

      {/* PWM frequency */}
      <div className="px-3 py-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[#9ca3af] font-medium">PWM Freq</span>
          <NumberInput value={pwmFreq} onChange={setPwmFreq} />
        </div>
        <div className="flex gap-1 flex-wrap mt-1">
          {[1000, 5000, 20000, 40000].map(v => (
            <button key={v} onClick={() => setPwmFreq(v)}
              className={`nodrag px-1.5 py-0.5 rounded text-[9px] font-mono border transition-all ${
                pwmFreq === v ? "border-orange-500/60 text-orange-300 bg-orange-500/10" : "border-[#2d2d35] text-zinc-500 hover:border-zinc-600 bg-[#111116]"
              }`}
            >{v >= 1000 ? `${v / 1000}kHz` : `${v}Hz`}</button>
          ))}
        </div>
      </div>
    </BaseNode>
  );
}

// ─── Multi-Motor Controller ───────────────────────────────────────────────────
export function MultiMotorControllerNode() {
  const [pairMode, setPairMode] = useNodeField<boolean>("pairMode", false);
  const [syncMode, setSyncMode] = useNodeField<boolean>("syncMode", false);

  const [l1speed, setL1speed] = useNodeField<number>("l1speed", 50);
  const [l1dir,   setL1dir]   = useNodeField<string>("l1dir",   "Forward");
  const [l2speed, setL2speed] = useNodeField<number>("l2speed", 50);
  const [l2dir,   setL2dir]   = useNodeField<string>("l2dir",   "Forward");
  const [r1speed, setR1speed] = useNodeField<number>("r1speed", 50);
  const [r1dir,   setR1dir]   = useNodeField<string>("r1dir",   "Forward");
  const [r2speed, setR2speed] = useNodeField<number>("r2speed", 50);
  const [r2dir,   setR2dir]   = useNodeField<string>("r2dir",   "Forward");

  const [leftSpeed,  setLeftSpeed]  = useNodeField<number>("leftSpeed",  50);
  const [rightSpeed, setRightSpeed] = useNodeField<number>("rightSpeed", 50);
  const [leftDir,    setLeftDir]    = useNodeField<string>("leftDir",    "Forward");
  const [rightDir,   setRightDir]   = useNodeField<string>("rightDir",   "Forward");

  // In sync mode motor 1 (L1) settings are mirrored to all
  const motors = syncMode
    ? [{ label: "All Motors (synced)", speed: l1speed, setSpeed: setL1speed, dir: l1dir, setDir: setL1dir }]
    : [
        { label: "L1 – Front Left",  speed: l1speed, setSpeed: setL1speed, dir: l1dir, setDir: setL1dir },
        { label: "L2 – Rear Left",   speed: l2speed, setSpeed: setL2speed, dir: l2dir, setDir: setL2dir },
        { label: "R1 – Front Right", speed: r1speed, setSpeed: setR1speed, dir: r1dir, setDir: setR1dir },
        { label: "R2 – Rear Right",  speed: r2speed, setSpeed: setR2speed, dir: r2dir, setDir: setR2dir },
      ];

  const SpeedRow = ({ label, speed, setSpeed, dir, setDir }: { label: string; speed: number; setSpeed: (v: number) => void; dir: string; setDir: (v: string) => void }) => (
    <div className="px-3 pt-1.5">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">{label}</span>
        <span className="text-[10px] font-mono text-orange-400">{speed}%</span>
      </div>
      <input type="range" min={0} max={100} step={1} value={speed}
        onChange={e => setSpeed(Number(e.target.value))}
        className="nodrag w-full h-1 cursor-pointer mb-1" style={{ accentColor: COLORS.orange }} />
      <div className="flex gap-1">
        {DIR_OPTIONS.map(d => (
          <button key={d.value} onClick={() => setDir(d.value)}
            className={`nodrag flex-1 py-0.5 rounded text-[9px] font-bold border transition-all ${
              dir === d.value ? "border-orange-500/60 text-orange-300 bg-orange-500/10" : "border-[#2d2d35] text-zinc-500 hover:border-zinc-600 bg-[#111116]"
            }`}
          >{d.value[0]}</button>
        ))}
      </div>
    </div>
  );

  return (
    <BaseNode title="Multi-Motor Controller" color={COLORS.red} icon={<MotorIcon />} width="270px">
      <div className="px-3 pt-1 pb-1 flex items-center gap-2">
        <div className="flex-1">
          <NodeField label="Sync all">
            <ToggleInput value={syncMode} onChange={setSyncMode} leftLabel="Independent" rightLabel="Sync" />
          </NodeField>
        </div>
        <div className="flex-1">
          <NodeField label="View">
            <ToggleInput value={pairMode} onChange={setPairMode} leftLabel="4-motor" rightLabel="L/R pair" />
          </NodeField>
        </div>
      </div>

      {pairMode && !syncMode ? (
        <>
          <SpeedRow label="Left Motors (L1+L2)" speed={leftSpeed} setSpeed={setLeftSpeed} dir={leftDir} setDir={setLeftDir} />
          <SpeedRow label="Right Motors (R1+R2)" speed={rightSpeed} setSpeed={setRightSpeed} dir={rightDir} setDir={setRightDir} />
        </>
      ) : (
        motors.map(m => <SpeedRow key={m.label} {...m} />)
      )}

      {/* Common driver info */}
      <div className="mx-3 mt-2 mb-1 px-2.5 py-1.5 rounded-lg border border-[#2d2d35] bg-[#111116]">
        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">2× DRV8833 — shared driver config</span>
        <div className="flex gap-3 mt-0.5 flex-wrap">
          <span className="text-[10px] text-zinc-500">L1: PWM<span className="text-zinc-300 font-mono">15</span>/DIR<span className="text-zinc-300 font-mono">16</span></span>
          <span className="text-[10px] text-zinc-500">R1: PWM<span className="text-zinc-300 font-mono">45</span>/DIR<span className="text-zinc-300 font-mono">46</span></span>
        </div>
      </div>
    </BaseNode>
  );
}

// ─── Servo Motor ──────────────────────────────────────────────────────────────
export function ServoMotorNode() {
  const [servoPort, setServoPort] = useNodeField<ServoKey>("servoPort", "S1");
  const [angle, setAngle] = useNodeField<number>("angle", 90);
  return (
    <BaseNode title="Servo Motor" color={COLORS.orange} icon={<MotorIcon />} width="240px">
      <NodeField label="Servo Port">
        <SelectInput value={servoPort} onChange={v => setServoPort(v as ServoKey)} compact options={SERVO_OPTIONS} />
      </NodeField>
      <ServoPinInfo servoKey={servoPort} />
      <AngleDial angle={angle} onChange={setAngle} color={COLORS.orange} />
    </BaseNode>
  );
}

// ─── Servo Motor Advance ──────────────────────────────────────────────────────
export function ServoMotorAdvanceNode() {
  const [servoPort, setServoPort] = useNodeField<ServoKey>("servoPort", "S1");
  const [startAngle, setStartAngle] = useNodeField<number>("startAngle", 0);
  const [endAngle, setEndAngle] = useNodeField<number>("endAngle", 90);
  const [speed, setSpeed] = useNodeField<number>("speed", 50);
  return (
    <BaseNode title="Servo Motor Advance" color={COLORS.orange} icon={<MotorIcon />} width="240px">
      <NodeField label="Servo Port">
        <SelectInput value={servoPort} onChange={v => setServoPort(v as ServoKey)} compact options={SERVO_OPTIONS} />
      </NodeField>
      <ServoPinInfo servoKey={servoPort} />
      <NodeField label="Start Angle"><NumberInput value={startAngle} onChange={setStartAngle} /></NodeField>
      <NodeField label="End Angle"><NumberInput value={endAngle} onChange={setEndAngle} /></NodeField>
      <NodeField label="Speed (1–100)"><NumberInput value={speed} onChange={setSpeed} /></NodeField>
    </BaseNode>
  );
}

// ─── Servo Controller ─────────────────────────────────────────────────────────
export function ServoControllerNode() {
  const [servoPort, setServoPort] = useNodeField<ServoKey>("servoPort", "S1");
  const [mode, setMode] = useNodeField<string>("mode", "standard");
  const [angle, setAngle] = useNodeField<number>("angle", 90);
  const [sweepMin, setSweepMin] = useNodeField<number>("sweepMin", 0);
  const [sweepMax, setSweepMax] = useNodeField<number>("sweepMax", 180);
  const [sweepPeriod, setSweepPeriod] = useNodeField<number>("sweepPeriod", 1000);
  const [contSpeed, setContSpeed] = useNodeField<number>("contSpeed", 50);
  const [pulseMin, setPulseMin] = useNodeField<number>("pulseMin", 600);
  const [pulseMax, setPulseMax] = useNodeField<number>("pulseMax", 2400);

  // Pulse width for current angle (for fine-tuning readout)
  const pulseUs = Math.round(pulseMin + (angle / 180) * (pulseMax - pulseMin));

  return (
    <BaseNode title="Servo Controller" color={COLORS.orange} icon={<MotorIcon />} width="260px">
      <NodeField label="Servo Port">
        <SelectInput value={servoPort} onChange={v => setServoPort(v as ServoKey)} compact options={SERVO_OPTIONS} />
      </NodeField>
      <ServoPinInfo servoKey={servoPort} />

      <NodeField label="Mode">
        <SelectInput value={mode} onChange={setMode} compact
          options={[
            { label: "Standard (0–180°)", value: "standard" },
            { label: "Continuous Rotation", value: "continuous" },
            { label: "Sweep Animation", value: "sweep" },
          ]} />
      </NodeField>

      {mode === "standard" && (
        <>
          <AngleDial angle={angle} onChange={setAngle} color={COLORS.orange} />
          {/* Pulse width readout */}
          <div className="mx-3 mb-1 px-2.5 py-1 rounded-lg border border-[#2d2d35] bg-[#0a0a0d] flex items-center justify-between">
            <span className="text-[9px] text-zinc-500">Pulse width at {angle}°</span>
            <span className="text-[10px] font-mono text-orange-400">{pulseUs} µs</span>
          </div>
        </>
      )}

      {mode === "continuous" && (
        <>
          <div className="px-3 py-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-[#9ca3af] font-medium">Speed</span>
              <span className="text-[10px] font-mono text-orange-400">
                {contSpeed === 0 ? "STOP" : contSpeed > 0 ? `+${contSpeed}%` : `${contSpeed}%`}
              </span>
            </div>
            <input type="range" min={-100} max={100} step={5} value={contSpeed}
              onChange={e => setContSpeed(Number(e.target.value))}
              className="nodrag w-full h-1 cursor-pointer" style={{ accentColor: COLORS.orange }} />
            <div className="flex justify-between mt-0.5">
              <span className="text-[8px] text-zinc-600">← Reverse</span>
              <span className="text-[8px] text-zinc-600">Forward →</span>
            </div>
          </div>
        </>
      )}

      {mode === "sweep" && (
        <>
          <div className="px-3 pb-1 flex gap-4">
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-zinc-500 mb-0.5">Min</span>
              <AngleDial angle={sweepMin} onChange={setSweepMin} max={sweepMax} color="#60a5fa" />
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-zinc-500 mb-0.5">Max</span>
              <AngleDial angle={sweepMax} onChange={setSweepMax} min={sweepMin} color={COLORS.orange} />
            </div>
          </div>
          <NodeField label="Period (ms)"><NumberInput value={sweepPeriod} onChange={setSweepPeriod} /></NodeField>
        </>
      )}

      {/* Pulse width fine-tune */}
      <div className="px-3 pt-1 pb-0.5">
        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Pulse Width Fine-tune</span>
      </div>
      <NodeField label="Min (µs)"><NumberInput value={pulseMin} onChange={setPulseMin} /></NodeField>
      <NodeField label="Max (µs)"><NumberInput value={pulseMax} onChange={setPulseMax} /></NodeField>
      <div className="mx-3 mb-2 px-2.5 py-1 rounded-lg border border-[#2d2d35] bg-[#0a0a0d]">
        <div className="flex justify-between text-[9px]">
          <span className="text-zinc-500">{pulseMin} µs @ 0°</span>
          <span className="text-zinc-500">{pulseMax} µs @ 180°</span>
        </div>
        <p className="text-[9px] text-zinc-600 mt-0.5">Standard: 600–2400 µs · SG90: 500–2400 µs</p>
      </div>
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
  const [loop, setLoop] = useNodeField<boolean>("loop", true);
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

  const SERVO_COLORS = [COLORS.orange, "#60a5fa", "#34d399"];
  const currentAngles = playing ? keyframes[playIdx]?.angles ?? [90,90,90] : keyframes[0]?.angles ?? [90,90,90];

  return (
    <BaseNode title="Multi-Servo Sequencer" color={COLORS.purple} icon={<MotorIcon />} width="290px">
      {/* Port selectors */}
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

      {/* Timeline */}
      <div className="px-3 pt-2 pb-0.5">
        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Timeline ({keyframes.length} keyframes · {totalDuration}ms)</span>
      </div>

      {/* Visual timeline bar */}
      <div className="px-3 pb-1">
        <div className="relative h-6 rounded-lg bg-[#0a0a0d] border border-[#2d2d35] overflow-hidden">
          {keyframes.map((kf, i) => {
            const pct = totalDuration > 0 ? (kf.time / totalDuration) * 100 : (i / keyframes.length) * 100;
            const isActive = playing && i === playIdx;
            return (
              <div key={i} className="absolute top-0 h-full flex flex-col justify-center"
                style={{ left: `${pct}%`, transform: "translateX(-50%)" }}>
                <div className={`w-1.5 h-4 rounded-sm transition-all ${isActive ? "bg-purple-400 shadow-[0_0_6px_rgba(168,85,247,0.8)]" : "bg-[#3d3d45]"}`} />
              </div>
            );
          })}
          {playing && (
            <div className="absolute top-0 bottom-0 w-0.5 bg-purple-400/70 transition-all"
              style={{ left: `${(playIdx / Math.max(1, keyframes.length - 1)) * 100}%` }} />
          )}
        </div>
      </div>

      {/* Keyframe editor rows */}
      <div className="max-h-48 overflow-y-auto px-3 flex flex-col gap-1.5 pb-1">
        {keyframes.map((kf, kfIdx) => (
          <div key={kfIdx} className={`rounded-lg border p-2 transition-all ${playing && kfIdx === playIdx ? "border-purple-500/60 bg-purple-500/5" : "border-[#2d2d35] bg-[#0d0d10]"}`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-bold text-zinc-400">KF {kfIdx + 1} @ {kf.time}ms</span>
              <button onClick={() => removeKeyframe(kfIdx)}
                className="nodrag text-[9px] text-zinc-600 hover:text-red-400 transition-colors px-1">✕</button>
            </div>
            <div className="flex gap-2">
              {kf.angles.map((a, sIdx) => (
                <div key={sIdx} className="flex flex-col items-center gap-0.5 flex-1">
                  <span className="text-[8px] font-bold" style={{ color: SERVO_COLORS[sIdx] }}>S{sIdx + 1}</span>
                  <input type="range" min={0} max={180} step={1} value={a}
                    onChange={e => updateAngle(kfIdx, sIdx, Number(e.target.value))}
                    className="nodrag w-full h-1 cursor-pointer"
                    style={{ accentColor: SERVO_COLORS[sIdx] }} />
                  <span className="text-[9px] font-mono text-zinc-400">{a}°</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Playback preview — shows current angles as mini dials */}
      <div className="px-3 pb-1 pt-0.5">
        <div className="rounded-lg border border-[#2d2d35] bg-[#0a0a0d] p-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Preview</span>
            <div className="flex gap-1.5">
              <button onClick={playing ? stopPlay : startPlay}
                className={`nodrag px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${
                  playing ? "border-red-500/40 text-red-400 bg-red-500/10" : "border-purple-500/40 text-purple-400 bg-purple-500/10"
                }`}
              >{playing ? "⏹ Stop" : "▶ Play"}</button>
            </div>
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
                    <text x={cx} y={cy + 4} textAnchor="middle" fill="white" fontSize={9} fontFamily="monospace">{a}°</text>
                  </svg>
                  <span className="text-[8px]" style={{ color: SERVO_COLORS[i] }}>S{i + 1}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add keyframe + export */}
      <div className="px-3 pb-2 flex gap-2">
        <button onClick={addKeyframe}
          className="nodrag flex-1 py-1 rounded-lg border border-purple-500/40 text-purple-400 text-[10px] font-bold hover:bg-purple-500/10 transition-all">
          + Add Keyframe
        </button>
        <button
          onClick={() => {
            const arr = keyframes.map(kf => `{t:${kf.time}, a:[${kf.angles.join(",")}]}`).join(", ");
            navigator.clipboard.writeText(`[${arr}]`).catch(() => {});
          }}
          className="nodrag flex-1 py-1 rounded-lg border border-[#2d2d35] text-zinc-400 text-[10px] font-bold hover:border-zinc-500 hover:text-white transition-all">
          ⎘ Export
        </button>
      </div>
    </BaseNode>
  );
}

// ─── Servo Calibration ────────────────────────────────────────────────────────
export function ServoCalibrationNode() {
  // Read all nodes on the canvas to find servo controllers
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
    <BaseNode title="Servo Calibration" color={COLORS.cyan} icon={
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
      </svg>
    } width="280px">

      {/* Canvas servo count */}
      <div className="mx-3 mb-2 px-2.5 py-2 rounded-lg border border-[#2d2d35] bg-[#111116]">
        <div className="flex items-center justify-between">
          <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Canvas Servo Nodes</span>
          <span className="text-[10px] font-mono text-cyan-400">{servoNodes.length} found</span>
        </div>
        {servoNodes.length === 0 && (
          <p className="text-[10px] text-zinc-600 mt-1">Add Servo Motor or Servo Controller nodes to the canvas.</p>
        )}
      </div>

      {/* Center all button */}
      <div className="px-3 pb-2">
        <button onClick={centerAll}
          className={`nodrag w-full py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            centered
              ? "border-green-500/40 bg-green-500/10 text-green-400"
              : "border-cyan-500/40 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
          }`}
        >
          {centered ? (
            <><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> All Centered!</>
          ) : (
            <><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Center All Servos (90°)</>
          )}
        </button>
      </div>

      {/* Per-servo override */}
      {servoNodes.length > 0 && (
        <>
          <div className="px-3 pb-0.5">
            <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Individual Override</span>
          </div>
          <div className="max-h-56 overflow-y-auto px-3 pb-2 flex flex-col gap-2">
            {servoNodes.map(n => {
              const a = getAngle(n.id);
              const pulse = getPulse(n.id);
              return (
                <div key={n.id} className="rounded-lg border border-[#2d2d35] bg-[#0d0d10] p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-zinc-300">{portLabel(n)}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] font-mono text-cyan-400">{pulse} µs</span>
                      <span className="text-[10px] font-mono text-orange-400">{a}°</span>
                    </div>
                  </div>
                  <input type="range" min={0} max={180} step={1} value={a}
                    onChange={e => setOverride(n.id, Number(e.target.value))}
                    className="nodrag w-full h-1 cursor-pointer" style={{ accentColor: COLORS.cyan }} />
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Compile-time only notice */}
      <div className="mx-3 mb-2 px-2.5 py-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5">
        <p className="text-[9px] text-amber-400/80">Compile-time utility only — does not generate runtime code.</p>
      </div>
    </BaseNode>
  );
}

// ─── L298N Motor Driver (legacy) ──────────────────────────────────────────────
export function L298NMotorDriverNode() {
  const [direction, setDirection] = useNodeField<string>("direction", "Forward");
  return (
    <BaseNode title="L298N Motor Driver" color={COLORS.red} icon={<MotorIcon />} width="220px">
      <div className="mx-3 mb-2 px-2.5 py-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5">
        <p className="text-[10px] text-amber-400">Use "Multi-Motor Controller" for the Kokoon board's 2× DRV8833 setup.</p>
      </div>
      <NodeField label="Direction">
        <SelectInput value={direction} onChange={setDirection} compact
          options={["Forward","Backward","Left","Right","Stop"].map(v => ({ label: v, value: v }))} />
      </NodeField>
    </BaseNode>
  );
}
