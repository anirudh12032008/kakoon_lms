import {
  BaseNode,
  NodeField,
  SelectInput,
  ToggleInput,
  useNodeField,
  AdvancedSection,
  COLORS,
} from "./BaseNode";
import { MotorIcon } from "./_shared";

// ─── Board hardware constants ──────────────────────────────────────────────────
const MOTOR_PORTS = {
  L1: { pwm: 17, dir: 18, label: "L1 - Front Left"  },
  L2: { pwm: 37, dir: 38, label: "L2 - Rear Left"   },
  R1: { pwm: 45, dir: 46, label: "R1 - Front Right" },
  R2: { pwm: 15, dir: 16, label: "R2 - Rear Right"  },
} as const;

type MotorKey = keyof typeof MOTOR_PORTS;
type RobotMove = typeof ROBOT_MOVES[number]["value"];

const MOTOR_OPTIONS = (Object.keys(MOTOR_PORTS) as MotorKey[]).map(k => ({ label: MOTOR_PORTS[k].label, value: k }));

const DIR_OPTIONS = [
  { label: "Forward", value: "Forward" },
  { label: "Reverse", value: "Reverse" },
  { label: "Brake",   value: "Brake"   },
  { label: "Coast",   value: "Coast"   },
];

const ROBOT_MOVES = [
  { value: "forward",    label: "Forward",    icon: "↑" },
  { value: "backward",   label: "Backward",   icon: "↓" },
  { value: "left",       label: "Turn Left",  icon: "↖" },
  { value: "right",      label: "Turn Right", icon: "↗" },
  { value: "spin_left",  label: "Spin Left",  icon: "↺" },
  { value: "spin_right", label: "Spin Right", icon: "↻" },
  { value: "stop",       label: "Stop",       icon: "■" },
] as const;

function MotorPinInfo({ motorKey }: { motorKey: MotorKey }) {
  const m = MOTOR_PORTS[motorKey];
  return (
    <div className="mx-3 mb-1 px-2.5 py-1.5 rounded-lg border border-[var(--k-border)] bg-[var(--k-base-200)]">
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">DRV8833 — fixed GPIO</span>
        <span className="text-[9px] font-mono text-orange-400">locked</span>
      </div>
      <div className="flex gap-3 mt-0.5">
        <span className="text-[10px] text-zinc-500">PWM <span className="text-[var(--k-text)] font-mono">{m.pwm}</span></span>
        <span className="text-[10px] text-zinc-500">DIR <span className="text-[var(--k-text)] font-mono">{m.dir}</span></span>
      </div>
    </div>
  );
}

// ─── Robot Arrow ──────────────────────────────────────────────────────────────
function RobotArrow({ move }: { move: RobotMove }) {
  const W = 80, H = 64;
  const wheelColor = (fwd: boolean | null) =>
    fwd === null ? "var(--k-base-400)" : fwd ? "#22c55e" : "#ef4444";

  type WheelState = { L: boolean | null; R: boolean | null };
  const states: Record<RobotMove, WheelState> = {
    forward:    { L: true,  R: true  },
    backward:   { L: false, R: false },
    left:       { L: null,  R: true  },
    right:      { L: true,  R: null  },
    spin_left:  { L: false, R: true  },
    spin_right: { L: true,  R: false },
    stop:       { L: null,  R: null  },
  };
  const { L, R } = states[move];

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="mx-auto">
      {/* Body */}
      <rect x={20} y={14} width={40} height={36} rx={5} fill="var(--k-base-300)" stroke="var(--k-base-400)" strokeWidth={1.5} />
      {/* Direction arrow on body */}
      {move !== "stop" && (
        <text x={40} y={36} textAnchor="middle" fontSize={18} fill={move.includes("spin") ? "#a78bfa" : "#f97316"}>
          {ROBOT_MOVES.find(m => m.value === move)?.icon ?? "?"}
        </text>
      )}
      {move === "stop" && (
        <rect x={32} y={27} width={16} height={11} rx={2} fill="#ef4444" opacity={0.7} />
      )}
      {/* Left wheels */}
      <rect x={8} y={16} width={12} height={8} rx={2} fill={wheelColor(L)} />
      <rect x={8} y={40} width={12} height={8} rx={2} fill={wheelColor(L)} />
      {/* Right wheels */}
      <rect x={60} y={16} width={12} height={8} rx={2} fill={wheelColor(R)} />
      <rect x={60} y={40} width={12} height={8} rx={2} fill={wheelColor(R)} />
      {/* Wheel direction arrows */}
      {L !== null && (
        <>
          <text x={14} y={15}  textAnchor="middle" fontSize={8} fill={L ? "#22c55e" : "#ef4444"}>{L ? "↑" : "↓"}</text>
          <text x={14} y={57}  textAnchor="middle" fontSize={8} fill={L ? "#22c55e" : "#ef4444"}>{L ? "↑" : "↓"}</text>
        </>
      )}
      {R !== null && (
        <>
          <text x={66} y={15}  textAnchor="middle" fontSize={8} fill={R ? "#22c55e" : "#ef4444"}>{R ? "↑" : "↓"}</text>
          <text x={66} y={57}  textAnchor="middle" fontSize={8} fill={R ? "#22c55e" : "#ef4444"}>{R ? "↑" : "↓"}</text>
        </>
      )}
    </svg>
  );
}

// ─── Robot Drive ──────────────────────────────────────────────────────────────
export function RobotDriveNode() {
  const [move, setMove]   = useNodeField<RobotMove>("move", "forward");
  const [speed, setSpeed] = useNodeField<number>("speed", 75);

  const current = ROBOT_MOVES.find(m => m.value === move) ?? ROBOT_MOVES[0];
  const isStop  = move === "stop";
  const isSpin  = move.includes("spin");

  return (
    <BaseNode title="Robot Drive" color={COLORS.orange} icon={<MotorIcon />} width="260px">
      {/* Direction grid */}
      <div className="px-3 pb-1 pt-0.5">
        <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Direction</span>
        <div className="grid grid-cols-4 gap-1 mt-1.5">
          {ROBOT_MOVES.map(m => (
            <button key={m.value} onClick={() => setMove(m.value)}
              title={m.label}
              className={`nodrag py-1.5 rounded-lg border text-sm font-bold transition-all ${
                move === m.value
                  ? m.value === "stop"
                    ? "border-red-500/60 bg-red-500/15 text-red-400"
                    : m.value.includes("spin")
                      ? "border-purple-500/60 bg-purple-500/15 text-purple-300"
                      : "border-orange-500/60 bg-orange-500/15 text-orange-300"
                  : "border-[var(--k-border)] bg-[var(--k-base-200)] text-zinc-500 hover:border-zinc-500 hover:text-[var(--k-text)]"
              }`}
            >
              {m.icon}
            </button>
          ))}
        </div>
        <div className="text-center mt-1">
          <span className="text-[10px] font-semibold text-[var(--k-muted)]">{current.label}</span>
        </div>
      </div>

      {/* Robot diagram */}
      <div className="pb-1">
        <RobotArrow move={move} />
      </div>

      {/* Speed */}
      {!isStop && (
        <div className="px-3 pb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-[var(--k-muted)] font-medium">Speed</span>
            <span className={`text-[10px] font-mono ${isSpin ? "text-purple-400" : "text-orange-400"}`}>{speed}%</span>
          </div>
          <input type="range" min={0} max={100} step={1} value={speed}
            onChange={e => setSpeed(Number(e.target.value))}
            className="nodrag w-full h-1 cursor-pointer"
            style={{ accentColor: isSpin ? "#a78bfa" : COLORS.orange }} />
        </div>
      )}

      <AdvancedSection>
        {/* Hardware info */}
        <div className="mx-3 mb-2 px-2.5 py-1.5 rounded-lg border border-[var(--k-border)] bg-[var(--k-base-200)]">
          <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">2× DRV8833 — all 4 motors</span>
          <div className="flex gap-3 mt-0.5 flex-wrap">
            <span className="text-[10px] text-zinc-500">L1·L2 <span className="text-[var(--k-muted)] font-mono">left</span></span>
            <span className="text-[10px] text-zinc-500">R1·R2 <span className="text-[var(--k-muted)] font-mono">right</span></span>
          </div>
        </div>
      </AdvancedSection>
    </BaseNode>
  );
}

// ─── DC Motor (Single port) ───────────────────────────────────────────────────
export function DCMotorSingleNode() {
  const [motorPort, setMotorPort] = useNodeField<MotorKey>("motorPort", "L1");
  const [speed, setSpeed]         = useNodeField<number>("speed", 50);
  const [direction, setDirection] = useNodeField<string>("direction", "Forward");

  return (
    <BaseNode title="DC Motor" color={COLORS.orange} icon={<MotorIcon />} width="260px">
      <NodeField label="Motor Port">
        <SelectInput value={motorPort} onChange={v => setMotorPort(v as MotorKey)} compact options={MOTOR_OPTIONS} />
      </NodeField>
      <AdvancedSection><MotorPinInfo motorKey={motorPort} /></AdvancedSection>

      <div className="px-3 py-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-[var(--k-muted)] font-medium">Speed</span>
          <span className="text-[10px] font-mono text-orange-400">{speed}%</span>
        </div>
        <input type="range" min={0} max={100} step={1} value={speed}
          onChange={e => setSpeed(Number(e.target.value))}
          className="nodrag w-full h-1 cursor-pointer" style={{ accentColor: COLORS.orange }} />
      </div>

      <div className="px-3 pb-2">
        <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Direction</span>
        <div className="grid grid-cols-4 gap-1 mt-1">
          {DIR_OPTIONS.map(d => (
            <button key={d.value} onClick={() => setDirection(d.value)}
              className={`nodrag py-1 rounded-lg border text-[9px] font-bold transition-all ${
                direction === d.value
                  ? "border-orange-500/60 bg-orange-500/15 text-orange-300"
                  : "border-[var(--k-border)] bg-[var(--k-base-200)] text-zinc-500 hover:border-zinc-600"
              }`}
            >{d.label[0]}{d.label === "Coast" ? "st" : ""}</button>
          ))}
        </div>
        <div className="text-center mt-1">
          <span className="text-[10px] text-[var(--k-muted)] font-semibold">{direction}</span>
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

  const motors = syncMode
    ? [{ label: "All Motors (synced)", speed: l1speed, setSpeed: setL1speed, dir: l1dir, setDir: setL1dir }]
    : [
        { label: "L1 – Front Left",  speed: l1speed, setSpeed: setL1speed, dir: l1dir, setDir: setL1dir },
        { label: "L2 – Rear Left",   speed: l2speed, setSpeed: setL2speed, dir: l2dir, setDir: setL2dir },
        { label: "R1 – Front Right", speed: r1speed, setSpeed: setR1speed, dir: r1dir, setDir: setR1dir },
        { label: "R2 – Rear Right",  speed: r2speed, setSpeed: setR2speed, dir: r2dir, setDir: setR2dir },
      ];

  const SpeedRow = ({ label, speed, setSpeed, dir, setDir }: {
    label: string; speed: number; setSpeed: (v: number) => void; dir: string; setDir: (v: string) => void;
  }) => (
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
              dir === d.value ? "border-orange-500/60 text-orange-300 bg-orange-500/10" : "border-[var(--k-border)] text-zinc-500 hover:border-zinc-600 bg-[var(--k-base-200)]"
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
            <ToggleInput value={syncMode} onChange={setSyncMode} leftLabel="Indep." rightLabel="Sync" />
          </NodeField>
        </div>
        <div className="flex-1">
          <NodeField label="View">
            <ToggleInput value={pairMode} onChange={setPairMode} leftLabel="4-motor" rightLabel="L/R" />
          </NodeField>
        </div>
      </div>

      {pairMode && !syncMode ? (
        <>
          <SpeedRow label="Left (L1+L2)" speed={leftSpeed} setSpeed={setLeftSpeed} dir={leftDir} setDir={setLeftDir} />
          <SpeedRow label="Right (R1+R2)" speed={rightSpeed} setSpeed={setRightSpeed} dir={rightDir} setDir={setRightDir} />
        </>
      ) : (
        motors.map(m => <SpeedRow key={m.label} {...m} />)
      )}

      <AdvancedSection>
        <div className="mx-3 mt-2 mb-2 px-2.5 py-1.5 rounded-lg border border-[var(--k-border)] bg-[var(--k-base-200)]">
          <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">2× DRV8833 — shared driver</span>
          <div className="flex gap-3 mt-0.5 flex-wrap">
            <span className="text-[10px] text-zinc-500">L1 <span className="font-mono text-[var(--k-muted)]">17/18</span></span>
            <span className="text-[10px] text-zinc-500">L2 <span className="font-mono text-[var(--k-muted)]">37/38</span></span>
            <span className="text-[10px] text-zinc-500">R1 <span className="font-mono text-[var(--k-muted)]">45/46</span></span>
            <span className="text-[10px] text-zinc-500">R2 <span className="font-mono text-[var(--k-muted)]">15/16</span></span>
          </div>
        </div>
      </AdvancedSection>
    </BaseNode>
  );
}

// ─── L298N Motor Driver (deprecated — kept for backward compat) ───────────────
export function L298NMotorDriverNode() {
  const [direction, setDirection] = useNodeField<string>("direction", "Forward");
  return (
    <BaseNode title="L298N Motor Driver" color={COLORS.red} icon={<MotorIcon />} width="220px">
      <div className="mx-3 mb-2 px-2.5 py-1.5 rounded-lg border border-amber-500/20 bg-amber-500/5">
        <p className="text-[10px] text-amber-400">⚠️ Deprecated — use Multi-Motor Controller (DRV8833) instead.</p>
      </div>
      <NodeField label="Direction">
        <SelectInput value={direction} onChange={setDirection} compact
          options={["Forward","Backward","Left","Right","Stop"].map(v => ({ label: v, value: v }))} />
      </NodeField>
    </BaseNode>
  );
}
