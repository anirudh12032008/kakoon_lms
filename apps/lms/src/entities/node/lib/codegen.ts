import type { Node, Edge } from "@xyflow/react";
import {
  ONBOARD_IMU, OLED, NEOPIXEL, SENSOR_PORTS,
  SERVO_PORTS, SERVO_PORT_ORDER, SERVO_MODELS, MOTORS,
  PIR_SENSOR, MATRIX,
} from "@/entities/board";

// All possible fields across every node type — each node only uses a subset.
interface NodeData {
  // General
  disabled?: boolean;
  text?: string;
  seconds?: number;
  name?: string;
  value?: number | string | null;
  tone?: number;
  // GPIO / sensor port
  pin?: number; pin1?: number; pin2?: number; pin3?: number; pin4?: number;
  port?: string; cs?: number;
  mode?: string; freq?: number; duty?: number; pullup?: boolean;
  trigPin?: number; echoPin?: number;
  // Variable / logic / math
  varName?: string; variable?: string; condition?: string;
  left?: string; right?: string; op?: string;
  start?: number; end?: number; step?: number;
  times?: number; expression?: string; interval?: number;
  // NeoPixel
  color?: string; brightness?: number; red?: number; green?: number; blue?: number;
  numLeds?: number; ledCount?: number; fps?: number; frames?: number[][][]; pattern?: string;
  // MAX7219 matrix
  matrixFrames?: number[][]; modules?: number; designName?: string;
  // OLED
  driver?: boolean; resolution?: string; sck?: number; sda?: number; scl?: number;
  staticPixels?: boolean[][]; animFrames?: boolean[][][]; line1?: string; line2?: string;
  customChars?: boolean[][][];
  animFile?: string;
  // 7-seg / LCD
  clk?: number; dio?: number; number?: number; address?: string;
  sensorPort?: string; backlight?: boolean;
  // Servo
  servoPort?: string; servoModel?: string; servoType?: string;
  angle?: number; startAngle?: number; endAngle?: number;
  steps?: number; speed?: number; pulseMin?: number; pulseMax?: number;
  sweepMin?: number; sweepMax?: number; sweepPeriod?: number; contSpeed?: number;
  bounce?: boolean; loop?: boolean;
  // Motors
  motorPort?: string; direction?: string;
  syncMode?: boolean; pairMode?: boolean;
  leftSpeed?: number; rightSpeed?: number; leftDir?: string; rightDir?: string;
  l1speed?: number; l2speed?: number; r1speed?: number; r2speed?: number;
  l1dir?: string; l2dir?: string; r1dir?: string; r2dir?: string;
  move?: string;
  // Motor custom GPIO overrides
  useCustomPins?: boolean;
  customPwmPin?: number; customDirPin?: number;
  l1PwmPin?: number; l1DirPin?: number; l2PwmPin?: number; l2DirPin?: number;
  r1PwmPin?: number; r1DirPin?: number; r2PwmPin?: number; r2DirPin?: number;
  flPwmPin?: number; flDirPin?: number; frPwmPin?: number; frDirPin?: number;
  rlPwmPin?: number; rlDirPin?: number; rrPwmPin?: number; rrDirPin?: number;
  // Multi-servo sequencer
  s1port?: string; s2port?: string; s3port?: string;
  keyframes?: Array<{ angles?: number[] }>;
  keyframeDelay?: number;
  // Touch
  t1?: string; t2?: string; t3?: string; t4?: string;
  // PIR / IR
  sendToViz?: boolean; debounce?: number; invert?: boolean;
  // Comms / IoT
  ssid?: string; password?: string; url?: string; mac?: string; sendData?: string;
  deviceName?: string; clientId?: string; broker?: string; topic?: string; payload?: string;
  // BLE
  serviceUUID?: string; rxCharUUID?: string; txCharUUID?: string;
  rawVarName?: string; enableCmdMap?: boolean;
  cmdMap?: Array<{ trigger: string; varName: string; value: string }>;
  txVarName?: string; enableTx?: boolean;
  // Display / misc
  fromMin?: number; fromMax?: number; toMin?: number; toMax?: number;
  minVal?: number; maxVal?: number;
  from?: number; to?: number;
  outputMode?: string; loopDelay?: number; durationMs?: number;
  animationName?: string; imageName?: string;
  width?: number; height?: number; csPin?: number; mosi?: number; miso?: number;
}

// ─── OLED pixel → MONO_HLSB bytes ─────────────────────────────────────────────
// The node stores pixels as boolean[][] with storedH rows (typically 32 for a
// 128×64 display). Each stored row doubles to fill the real OLED height.
function oledPixelsToMonoHLSB(pixels: boolean[][], oledW: number, oledH: number): Uint8Array {
  const storedH = pixels.length || 1;
  const bytesPerRow = Math.ceil(oledW / 8);
  const buf = new Uint8Array(bytesPerRow * oledH);
  for (let oledRow = 0; oledRow < oledH; oledRow++) {
    const srcRow = Math.min(Math.floor((oledRow / oledH) * storedH), storedH - 1);
    const row = pixels[srcRow] ?? [];
    for (let col = 0; col < oledW; col++) {
      if (row[col]) {
        const byteIdx = oledRow * bytesPerRow + Math.floor(col / 8);
        buf[byteIdx] |= (1 << (7 - (col % 8))); // MONO_HLSB: MSB = leftmost pixel
      }
    }
  }
  return buf;
}

function bytesToPyHex(buf: Uint8Array): string {
  return Array.from(buf).map(b => `\\x${b.toString(16).padStart(2, "0")}`).join("");
}

/**
 * Robust Graph Traversal Code Generator for Kokoon CodeLab.
 * Walks the connected flow starting from root nodes (unconnected/entry points),
 * recursing into loop body and conditional branches, and following sequence lines.
 */
export function generatePythonFromFlow(nodes: Node[], edges: Edge[]): string {
  if (nodes.length === 0) return "# Add nodes to generate code\n";

  const nodeMap = new Map<string, Node>();
  for (const n of nodes) nodeMap.set(n.id, n);

  // Use edges exactly as drawn — no flipping/normalization.
  // Users connect nodes in execution order; the direction is correct by design.

  // Root nodes = nodes that have no incoming flow edges
  // (ignore incoming "true"/"false"/"body" handle edges — those are branch entries, not sequential flow)
  const hasIncomingFlow = new Set<string>();
  for (const e of edges) {
    // An edge pointing INTO a node counts as "has incoming flow" only if it's
    // a plain sequential edge (not a body/true/false branch handle from a loop/conditional)
    const srcHandle = e.sourceHandle ?? "";
    if (srcHandle !== "body" && srcHandle !== "true" && srcHandle !== "false" && !srcHandle.startsWith("cmd_")) {
      hasIncomingFlow.add(e.target);
    }
  }
  const rootNodes = nodes.filter((n) => !hasIncomingFlow.has(n.id));
  const sortedRoots = [...rootNodes].sort((a, b) => a.position.y - b.position.y);

  const lines: string[] = ["# Generated by Kokoon CodeLab Node Editor", ""];

  // Collect imports, setups, and one-time helpers
  const imports = new Set<string>();
  const setupLines: string[] = [];
  const setupOnce = new Set<string>(); // dedup helper functions across multiple nodes

  // Board hardware pin maps (shared between codegen cases)
  const SERVO_PIN_MAP: Record<string, number> = Object.fromEntries(
    Object.entries(SERVO_PORTS).map(([k, v]) => [k, v.pin])
  );
  const usedServoPorts = new Set<string>();
  const markServoPort = (port: unknown) => {
    if (typeof port === "string" && port in SERVO_PIN_MAP) {
      usedServoPorts.add(port);
    }
  };

  for (const node of nodes) {
    const d = (node.data ?? {}) as NodeData;
    switch (node.type) {
      case "servo_motor":
      case "servo_motor_advance":
      case "servo_controller":
        markServoPort(d.servoPort ?? "S1");
        break;
      case "multi_servo_sequencer":
        markServoPort(d.s1port ?? "S1");
        markServoPort(d.s2port ?? "S2");
        markServoPort(d.s3port ?? "S3");
        break;
    }
  }

  const buildServoHelperBlock = () => {
    const servoLines = SERVO_PORT_ORDER.map((port) => {
      const pin = SERVO_PIN_MAP[port];
      const name = port.toLowerCase();
      return usedServoPorts.has(port)
        ? `${name} = Servo(${pin})`
        : `_servo_pull_down(${pin})`;
    }).join("\n");

    return `# --- Servo class (600–2400 µs, 50 Hz) ---
class Servo:
    PERIOD = 20000
    def __init__(self, pin, mn=600, mx=2400, lo=0, hi=180):
        self._p = PWM(Pin(pin, Pin.OUT), freq=50)
        self._mn, self._mx, self._lo, self._hi = mn, mx, lo, hi
    def angle(self, deg):
        deg = max(self._lo, min(self._hi, deg))
        us  = self._mn + (self._mx - self._mn) * deg / 180
        self._p.duty_u16(int(us / self.PERIOD * 65535))
    def center(self):  self.angle(90)
    def min_pos(self): self.angle(self._lo)
    def max_pos(self): self.angle(self._hi)
    def speed(self, pct):  # 360° continuous-rotation: -100..100, 0 = stop
        self.angle(90 + max(-100, min(100, pct)) * 0.9)

def _servo_pull_down(pin):
    Pin(pin, Pin.IN, Pin.PULL_DOWN)

${servoLines}`;
  };

    const DRV8833_HELPER = `# --- DRV8833 motors (1 PWM + 1 DIR per channel) ---
class DRV8833:
    MAX = 65535

    def __init__(self, a_pwm, a_dir, b_pwm, b_dir):
        self.ap = a_pwm
        self.ad = a_dir
        self.bp = b_pwm
        self.bd = b_dir

    def _drv(self, pwm, d, t):
        t = max(-1.0, min(1.0, t))
        duty = int(abs(t) * self.MAX)
        if t >= 0:
            d.value(0)
            pwm.duty_u16(duty)
        else:
            d.value(1)
            pwm.duty_u16(self.MAX - duty)

    def throttle_a(self, t): self._drv(self.ap, self.ad, t)
    def throttle_b(self, t): self._drv(self.bp, self.bd, t)

    def stop_a(self): self.ap.duty_u16(0); self.ad.value(0)
    def stop_b(self): self.bp.duty_u16(0); self.bd.value(0)
    def stop_all(self): self.stop_a(); self.stop_b()


def _mp(pin): return PWM(Pin(pin, Pin.OUT), freq=1000)
def _dp(pin): return Pin(pin, Pin.OUT)

front = DRV8833(_mp(${MOTORS.frontRight.pwm}), _dp(${MOTORS.frontRight.dir}), _mp(${MOTORS.frontLeft.pwm}), _dp(${MOTORS.frontLeft.dir}))
rear  = DRV8833(_mp(${MOTORS.rearRight.pwm}),  _dp(${MOTORS.rearRight.dir}),  _mp(${MOTORS.rearLeft.pwm}),  _dp(${MOTORS.rearLeft.dir}))
`;

  // --- Custom-pin motor driver — for users who re-target a motor's PWM/DIR
  // lines to GPIOs other than the board's stock DRV8833 wiring (Advanced mode).
  const CUSTOM_MOTOR_HELPER = `# --- Custom-pin motor driver (PWM + DIR on user-chosen GPIOs) ---
def _cm_pwm(pin): return PWM(Pin(pin, Pin.OUT), freq=40000)
def _cm_dir(pin): return Pin(pin, Pin.OUT)

def _cm_drive(pwm, d, t):
    d.value(0 if t >= 0 else 1)
    duty = int(abs(t) * 65535)
    pwm.duty_u16(duty if t >= 0 else 65535 - duty)

def _cm_stop(pwm, d):
    pwm.duty_u16(0); d.value(0)
`;

  // Helper: emit a shared helper block only once per script
  const emitOnce = (key: string, code: string) => {
    if (!setupOnce.has(key)) { setupOnce.add(key); setupLines.push(code); }
  };

  // Create (once) and return the variable names for a custom-pin motor's
  // PWM + DIR objects, deduped by GPIO number so re-used pins share objects.
  const getCustomMotorHandle = (pwmPin: number, dirPin: number) => {
    imports.add("from machine import Pin, PWM");
    emitOnce("custom_motor_helper", CUSTOM_MOTOR_HELPER);
    const pwmVar = `_cm_pwm${pwmPin}`;
    const dirVar = `_cm_dir${dirPin}`;
    emitOnce(`cm_pwm_${pwmPin}`, `${pwmVar} = _cm_pwm(${pwmPin})`);
    emitOnce(`cm_dir_${dirPin}`, `${dirVar} = _cm_dir(${dirPin})`);
    return { pwmVar, dirVar };
  };

  const visited = new Set<string>();

  // Loop types that use getLoopBodyLines for their body
  const LOOP_TYPES = ["forever_loop", "for_loop", "while_loop", "repeat"];

  /**
   * Returns the lines for the body of a loop / if-else node.
   *
   * Strategy (in order):
   * 1. If one or more "body" handle edges exist, follow each chain in Y order.
   * 2. Otherwise, collect EVERY directly-connected node below the loop (by Y),
   *    sort them by Y, and generate each one's chain independently — so you can
   *    wire multiple nodes into a loop and they all appear in the body.
   */
  function getLoopBodyLines(loopId: string, indentLevel: number): string[] {
    // 1. Explicit body handle edges (support multiple wires from "body")
    const bodyEdges = edges.filter((e) => e.source === loopId && e.sourceHandle === "body");
    if (bodyEdges.length > 0) {
      const result: string[] = [];
      const targets = bodyEdges
        .map((e) => nodeMap.get(e.target))
        .filter((n): n is Node => !!n)
        .sort((a, b) => a.position.y - b.position.y);
      for (const t of targets) result.push(...generateChain(t.id, indentLevel));
      return result;
    }

    // 2. Fall back: every directly-connected node below the loop node by Y
    const loopNode = nodeMap.get(loopId);
    if (!loopNode) return [];
    const connectedBelow = edges
      .filter((e) => e.source === loopId)
      .map((e) => nodeMap.get(e.target))
      .filter((n): n is Node => !!n && n.position.y > loopNode.position.y)
      .sort((a, b) => a.position.y - b.position.y);

    if (connectedBelow.length === 0) return [];
    // Generate each top-level body node independently so ALL of them are included
    const result: string[] = [];
    for (const bodyNode of connectedBelow) {
      result.push(...generateChain(bodyNode.id, indentLevel));
    }
    return result;
  }

  function generateChain(nodeId: string | null, indentLevel: number): string[] {
    if (!nodeId) return [];
    if (visited.has(nodeId)) return [];
    visited.add(nodeId);

    const node = nodeMap.get(nodeId);
    if (!node) return [];

    const d = (node.data ?? {}) as NodeData;
    const indent = "    ".repeat(indentLevel);
    const chunkLines: string[] = [];

    // Helper to get ALL connected targets for a handle, sorted by Y position
    const getAllTargetsForHandle = (handleId: string): string[] => {
      return edges
        .filter((e) => e.source === nodeId && e.sourceHandle === handleId)
        .map((e) => nodeMap.get(e.target))
        .filter((n): n is Node => !!n)
        .sort((a, b) => a.position.y - b.position.y)
        .map((n) => n.id);
    };

    // Helper to generate lines for multiple branch targets
    const getBranchLines = (handleId: string, indentLvl: number): string[] => {
      const targets = getAllTargetsForHandle(handleId);
      if (targets.length === 0) return [];
      const result: string[] = [];
      for (const tid of targets) result.push(...generateChain(tid, indentLvl));
      return result;
    };

    // Helper to get next sequential statement connected to standard bottom handle.
    // For loop nodes, skip edges used by getLoopBodyLines (body handle, or the
    // first below-node fallback) so the body isn't also emitted as a sequel.
    const getNextNodeId = () => {
      const isLoopNode = LOOP_TYPES.includes(node.type ?? "");
      const edge = edges.find((e) => {
        if (e.source !== nodeId) return false;
        const handle = e.sourceHandle ?? "";
        if (handle === "body" || handle === "true" || handle === "false" || handle.startsWith("cmd_")) return false;
        // For loops using the Y-fallback body, skip the edge we used as body
        if (isLoopNode && !edges.some((b) => b.source === nodeId && b.sourceHandle === "body")) {
          const tgt = nodeMap.get(e.target);
          if (tgt && tgt.position.y > node.position.y) return false; // this is the body edge
        }
        return true;
      });
      return edge ? edge.target : null;
    };

    if (d.disabled) {
      return generateChain(getNextNodeId(), indentLevel);
    }

    switch (node.type) {
      // ─── General ──────────────────────────────────────────────────────────
      case "print":
        chunkLines.push(`${indent}print(${d.text ?? "'Hello world'"})`);
        break;
      case "sleep":
        imports.add("import time");
        chunkLines.push(`${indent}time.sleep(${d.seconds ?? 1})`);
        break;
      case "variable":
        chunkLines.push(`${indent}${d.name ?? "x"} = ${d.value ?? 0}`);
        break;

      // ─── GPIO Pin / Controls ───────────────────────────────────────────────
      case "gpio_pin":
        imports.add("from machine import Pin");
        setupLines.push(`pin_${d.pin ?? 2} = Pin(${d.pin ?? 2}, Pin.${d.mode ?? "OUT"})`);
        break;
      case "pin_write":
        imports.add("from machine import Pin");
        chunkLines.push(`${indent}pin_${d.pin ?? 4}.value(${d.value ? 1 : 0})`);
        break;
      case "imu_sensor":
      case "onboard_imu": {
        imports.add("from machine import SoftI2C, Pin");
        imports.add("from lsm6ds3 import LSM6DS3");
        imports.add("import time, math");
        emitOnce("imu_setup", `# LSM6DS3 onboard IMU — SCL=${ONBOARD_IMU.scl} SDA=${ONBOARD_IMU.sda}
_i2c_imu = SoftI2C(scl=Pin(${ONBOARD_IMU.scl}), sda=Pin(${ONBOARD_IMU.sda}))
_imu = LSM6DS3(_i2c_imu)
time.sleep(0.1)`);
        const vn   = d.varName    ?? "imu";
        const mode = d.outputMode ?? "print";
        chunkLines.push(`${indent}${vn}_ax, ${vn}_ay, ${vn}_az = _imu.accel()`);
        chunkLines.push(`${indent}${vn}_gx, ${vn}_gy, ${vn}_gz = _imu.gyro()`);
        chunkLines.push(`${indent}${vn}_pitch = math.atan2(${vn}_ay, math.sqrt(${vn}_ax**2 + ${vn}_az**2)) * 57.2958`);
        chunkLines.push(`${indent}${vn}_roll  = math.atan2(-${vn}_ax, ${vn}_az) * 57.2958`);
        if (mode === "print" || mode === "both") {
          chunkLines.push(`${indent}print(f"IMU,{${vn}_ax:.3f},{${vn}_ay:.3f},{${vn}_az:.3f},{${vn}_gx:.1f},{${vn}_gy:.1f},{${vn}_gz:.1f},{${vn}_pitch:.1f},{${vn}_roll:.1f}")`);
        }
        if (d.loopDelay && d.loopDelay > 0) {
          chunkLines.push(`${indent}time.sleep_ms(${d.loopDelay ?? 100})`);
        }
        break;
      }
      case "pir_sensor": {
        const vn      = d.varName  ?? "motion";
        const pinNum  = d.pin      ?? PIR_SENSOR.pin;
        const pullup  = d.pullup   ? "Pin.PULL_UP" : "Pin.PULL_DOWN";
        const debounce = d.debounce ?? 50;
        const sendViz = d.sendToViz !== false;
        imports.add("from machine import Pin");
        imports.add("import time");
        emitOnce(`pir_setup_${pinNum}`,
          `# PIR motion sensor — GPIO ${pinNum}\n` +
          `_pir_${pinNum} = Pin(${pinNum}, Pin.IN, ${pullup})`
        );
        chunkLines.push(`${indent}${vn} = _pir_${pinNum}.value()`);
        if (debounce > 0) {
          chunkLines.push(`${indent}time.sleep_ms(${debounce})`);
        }
        if (sendViz) {
          // label = varName so the node's sensorStore lookup matches
          chunkLines.push(`${indent}print(f"SENSOR,digital,${vn},{${vn}}")`);
        }
        break;
      }
      case "buzzer_tone":
        imports.add("from machine import Pin, PWM");
        imports.add("import time");
        setupLines.push(`buzzer = PWM(Pin(${d.pin ?? 46}))`);
        chunkLines.push(`${indent}buzzer.freq(${Number(d.tone ?? 1) * 440})`);
        chunkLines.push(`${indent}buzzer.duty(512)`);
        break;
      case "neopixel_led":
        imports.add("from machine import Pin");
        imports.add("import neopixel");
        {
          const npN  = d.numLeds ?? d.ledCount ?? 1;
          setupLines.push(`np = neopixel.NeoPixel(Pin(${d.pin ?? NEOPIXEL.pin}), ${npN})`);
          const c  = d.color ?? "#ff0000";
          const rV = parseInt(c.slice(1, 3), 16);
          const gV = parseInt(c.slice(3, 5), 16);
          const bV = parseInt(c.slice(5, 7), 16);
          const br = (d.brightness ?? 50) / 100;
          const rgb = `(${Math.round(rV * br)}, ${Math.round(gV * br)}, ${Math.round(bV * br)})`;
          if (npN === 1) {
            chunkLines.push(`${indent}np[0] = ${rgb}`);
          } else {
            chunkLines.push(`${indent}for _i in range(${npN}): np[_i] = ${rgb}`);
          }
          chunkLines.push(`${indent}np.write()`);
        }
        break;
      case "neopixel_rgb":
        imports.add("from machine import Pin");
        imports.add("import neopixel");
        {
          const npRgbN = d.numLeds ?? d.ledCount ?? 1;
          setupLines.push(`np = neopixel.NeoPixel(Pin(${d.pin ?? NEOPIXEL.pin}), ${npRgbN})`);
          const br = (d.brightness ?? 50) / 100;
          const rgbTuple = `(${Math.round((d.red ?? 255) * br)}, ${Math.round((d.green ?? 0) * br)}, ${Math.round((d.blue ?? 0) * br)})`;
          if (npRgbN === 1) {
            chunkLines.push(`${indent}np[0] = ${rgbTuple}`);
          } else {
            chunkLines.push(`${indent}for _i in range(${npRgbN}): np[_i] = ${rgbTuple}`);
          }
          chunkLines.push(`${indent}np.write()`);
        }
        break;

      case "neopixel_designer": {
        imports.add("from machine import Pin");
        imports.add("import neopixel, time");
        const npPin = d.pin ?? NEOPIXEL.pin;
        const npCount = d.ledCount ?? 8;
        const npFps = d.fps ?? 10;
        const npFrames = d.frames as number[][][] | undefined;
        setupLines.push(`np = neopixel.NeoPixel(Pin(${npPin}), ${npCount})`);
        const clampRGB = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
        if (npFrames && npFrames.length > 1) {
          const framesStr = npFrames
            .map(f => `    [${f.map((rgb: number[]) => `(${clampRGB(rgb[0])},${clampRGB(rgb[1])},${clampRGB(rgb[2])})`).join(",")}]`)
            .join(",\n");
          setupLines.push(`_np_frames = [\n${framesStr}\n]`);
          chunkLines.push(`${indent}for _f in _np_frames:`);
          chunkLines.push(`${indent}    for _i, _rgb in enumerate(_f): np[_i] = _rgb`);
          chunkLines.push(`${indent}    np.write()`);
          chunkLines.push(`${indent}    time.sleep_ms(${Math.round(1000 / npFps)})`);
        } else if (npFrames && npFrames.length === 1) {
          for (let i = 0; i < npFrames[0].length && i < npCount; i++) {
            const [r, g, b] = npFrames[0][i];
            chunkLines.push(`${indent}np[${i}] = (${clampRGB(r)},${clampRGB(g)},${clampRGB(b)})`);
          }
          chunkLines.push(`${indent}np.write()`);
        }
        break;
      }

      // ─── Loops ─────────────────────────────────────────────────────────────
      case "forever_loop":
        chunkLines.push(`${indent}while True:`);
        {
          const bodyLines = getLoopBodyLines(nodeId, indentLevel + 1);
          chunkLines.push(...(bodyLines.length > 0 ? bodyLines : [`${indent}    pass`]));
        }
        break;
      case "for_loop":
        chunkLines.push(`${indent}for ${d.variable ?? "i"} in range(${d.start ?? 0}, ${d.end ?? 10}, ${d.step ?? 1}):`);
        {
          const bodyLines = getLoopBodyLines(nodeId, indentLevel + 1);
          chunkLines.push(...(bodyLines.length > 0 ? bodyLines : [`${indent}    pass`]));
        }
        break;
      case "while_loop":
        chunkLines.push(`${indent}while ${d.condition ?? "True"}:`);
        {
          const bodyLines = getLoopBodyLines(nodeId, indentLevel + 1);
          chunkLines.push(...(bodyLines.length > 0 ? bodyLines : [`${indent}    pass`]));
        }
        break;
      case "repeat":
        chunkLines.push(`${indent}for _ in range(${d.times ?? 1}):`);
        {
          const bodyLines = getLoopBodyLines(nodeId, indentLevel + 1);
          chunkLines.push(...(bodyLines.length > 0 ? bodyLines : [`${indent}    pass`]));
        }
        break;
      case "break":
        chunkLines.push(`${indent}break`);
        break;

      // ─── Conditional ───────────────────────────────────────────────────────
      case "if_else":
        chunkLines.push(`${indent}if ${d.left ?? ""} ${d.op ?? "=="} ${d.right ?? 0}:`);
        {
          const trueLines = getBranchLines("true", indentLevel + 1);
          chunkLines.push(...(trueLines.length > 0 ? trueLines : [`${indent}    pass`]));
        }
        chunkLines.push(`${indent}else:`);
        {
          const falseLines = getBranchLines("false", indentLevel + 1);
          chunkLines.push(...(falseLines.length > 0 ? falseLines : [`${indent}    pass`]));
        }
        break;

      // ─── IOT ───────────────────────────────────────────────────────────────
      case "wifi_connect":
        imports.add("import network");
        imports.add("import time");
        chunkLines.push(`${indent}wlan = network.WLAN(network.STA_IF)`);
        chunkLines.push(`${indent}wlan.active(True)`);
        chunkLines.push(`${indent}wlan.connect('${d.ssid ?? "MyWiFi"}', '${d.password ?? "password"}')`);
        chunkLines.push(`${indent}while not wlan.isconnected():`);
        chunkLines.push(`${indent}    time.sleep(0.5)`);
        chunkLines.push(`${indent}print('WiFi connected:', wlan.ifconfig()[0])`);
        break;
      case "http_get":
        imports.add("import urequests");
        chunkLines.push(`${indent}${d.varName ?? "response"} = urequests.get('${d.url ?? "http://example.com"}').text`);
        break;
      case "esp_now_sender":
        imports.add("import espnow");
        imports.add("import network");
        chunkLines.push(`${indent}# ESP NOW Send to ${d.mac ?? "FF:FF:FF:FF:FF:FF"}`);
        chunkLines.push(`${indent}en = espnow.ESPNow()`);
        chunkLines.push(`${indent}en.active(True)`);
        chunkLines.push(`${indent}en.add_peer(b'${d.mac?.replace(/:/g, "\\x") ?? "\\xff\\xff\\xff\\xff\\xff\\xff"}')`);
        chunkLines.push(`${indent}en.send(b'${d.sendData ?? "hello"}')`);
        break;
      case "time_online":
        imports.add("import ntptime");
        imports.add("import time");
        chunkLines.push(`${indent}ntptime.settime()`);
        chunkLines.push(`${indent}${d.varName ?? "time_now"} = time.localtime()`);
        break;

      // ─── Sensor ────────────────────────────────────────────────────────────
      case "ultrasonic": {
        const uPort = (d.port ?? "1") as keyof typeof SENSOR_PORTS;
        const uPins = SENSOR_PORTS[uPort] ?? SENSOR_PORTS["1"];
        const trig  = d.trigPin ?? uPins.trig;
        const echo  = d.echoPin ?? uPins.echo;
        const distVar = d.varName ?? "distance";
        imports.add("from machine import Pin, time_pulse_us");
        imports.add("import time");
        chunkLines.push(`${indent}# Ultrasonic port ${uPort} — TRIG:${trig} ECHO:${echo}`);
        chunkLines.push(`${indent}trig = Pin(${trig}, Pin.OUT)`);
        chunkLines.push(`${indent}echo = Pin(${echo}, Pin.IN)`);
        chunkLines.push(`${indent}# Send a 10us trigger pulse`);
        chunkLines.push(`${indent}trig.value(0); time.sleep_us(2)`);
        chunkLines.push(`${indent}trig.value(1); time.sleep_us(10); trig.value(0)`);
        chunkLines.push(`${indent}# Measure echo high time (us), timeout 30ms (~5m max range)`);
        chunkLines.push(`${indent}_dur = time_pulse_us(echo, 1, 30000)`);
        chunkLines.push(`${indent}# Convert: distance = duration * speed_of_sound / 2 = us * 0.0343 / 2`);
        chunkLines.push(`${indent}${distVar} = (_dur * 0.0343 / 2) if _dur > 0 else -1`);
        if (d.sendToViz !== false) {
          // label = varName so the node's sensorStore lookup matches
          chunkLines.push(`${indent}print(f"SENSOR,distance,${distVar},{${distVar}:.1f}")`);
        }
        break;
      }
      case "touch_sensor": {
        const tPort = (d.port ?? "1") as keyof typeof SENSOR_PORTS;
        const tPins = SENSOR_PORTS[tPort] ?? SENSOR_PORTS["1"];
        const vn = d.varName ?? "touch_value";
        imports.add("from machine import TouchPad, Pin");
        chunkLines.push(`${indent}${vn} = TouchPad(Pin(${d.pin ?? tPins.sda})).read()`);
        if (d.sendToViz !== false) {
          chunkLines.push(`${indent}print(f"SENSOR,raw,${vn},{${vn}}")`);
        }
        break;
      }
      case "soil_moisture": {
        const sPort = (d.port ?? "1") as keyof typeof SENSOR_PORTS;
        const sPins = SENSOR_PORTS[sPort] ?? SENSOR_PORTS["1"];
        const smPin = d.pin ?? sPins.sda;
        const vn = d.varName ?? "value";
        imports.add("from machine import ADC, Pin");
        setupLines.push(`soil_moisture_${smPin} = ADC(Pin(${smPin}))`);
        chunkLines.push(`${indent}${vn} = soil_moisture_${smPin}.read_u16()`);
        if (d.sendToViz !== false) {
          chunkLines.push(`${indent}print(f"SENSOR,raw,${vn},{${vn}}")`);
        }
        break;
      }
      case "ir_receiver": {
        const vn = d.varName ?? "ir_cmd";
        imports.add("from machine import Pin");
        emitOnce(`ir_recv_setup_${d.pin ?? 6}`,
          `# IR Receiver (NEC) — GPIO ${d.pin ?? 6}\n` +
          `_ir_recv_${d.pin ?? 6} = Pin(${d.pin ?? 6}, Pin.IN)`
        );
        // Basic NEC pulse-counting stub — real decode needs irq + timing
        chunkLines.push(`${indent}${vn} = _ir_recv_${d.pin ?? 6}.value()  # raw pulse; use irq for full NEC decode`);
        if (d.sendToViz !== false) {
          chunkLines.push(`${indent}print(f"SENSOR,raw,${vn},{${vn}}")`);
        }
        break;
      }
      case "ir_sensor": {
        const vn = d.varName ?? "ir_value";
        imports.add("from machine import Pin");
        imports.add("import time");
        emitOnce(`ir_sensor_setup_${d.pin ?? 6}`,
          `# IR obstacle sensor — GPIO ${d.pin ?? 6}\n` +
          `_ir_${d.pin ?? 6} = Pin(${d.pin ?? 6}, Pin.IN)`
        );
        chunkLines.push(`${indent}${vn} = _ir_${d.pin ?? 6}.value()`);
        if (d.sendToViz !== false) {
          chunkLines.push(`${indent}print(f"SENSOR,digital,${vn},{${vn}}")`);
        }
        break;
      }

      case "four_channel_touch":
        imports.add("from machine import TouchPad, Pin");
        chunkLines.push(`${indent}# Four channel touch sensor: ${d.t1 ?? "touch1"}, ${d.t2 ?? "touch2"}, ${d.t3 ?? "touch3"}, ${d.t4 ?? "touch4"}`);
        chunkLines.push(`${indent}${d.t1 ?? "touch1"} = TouchPad(Pin(${d.pin1 ?? 4})).read()`);
        chunkLines.push(`${indent}${d.t2 ?? "touch2"} = TouchPad(Pin(${d.pin2 ?? 5})).read()`);
        chunkLines.push(`${indent}${d.t3 ?? "touch3"} = TouchPad(Pin(${d.pin3 ?? 6})).read()`);
        chunkLines.push(`${indent}${d.t4 ?? "touch4"} = TouchPad(Pin(${d.pin4 ?? 7})).read()`);
        if (d.sendToViz !== false) {
          for (const ch of [d.t1 ?? "touch1", d.t2 ?? "touch2", d.t3 ?? "touch3", d.t4 ?? "touch4"]) {
            chunkLines.push(`${indent}print(f"SENSOR,raw,${ch},{${ch}}")`);
          }
        }
        break;

      // ─── Display ───────────────────────────────────────────────────────────
      case "oled_display": {
        // d.driver: false = SH1106 (default), true = SSD1306
        const useSSD = d.driver === true;
        const dLib   = useSSD ? "ssd1306" : "sh1106";
        const dClass = useSSD ? "SSD1306_I2C" : "SH1106_I2C";
        const [oledW, oledH] = d.resolution === "128x32" ? [128, 32] : [128, 64];

        imports.add("from machine import SoftI2C, Pin");
        imports.add(`import ${dLib}`);
        setupLines.push(`i2c = SoftI2C(scl=Pin(${d.sck ?? OLED.scl}), sda=Pin(${d.sda ?? OLED.sda}))`);
        setupLines.push(`oled = ${dLib}.${dClass}(${oledW}, ${oledH}, i2c)`);

        // Animation file stored on device — generate file-reading code
        if (d.mode !== "text" && d.animFile) {
          imports.add(`import ${dLib}, framebuf, time`);
          emitOnce("oled_anim_player",
            `def _play_oled(oled, path):\n` +
            `    with open(path, 'rb') as f:\n` +
            `        magic = f.read(4)\n` +
            `        fps = (ord(f.read(1)) << 8) | ord(f.read(1))\n` +
            `        n   = (ord(f.read(1)) << 8) | ord(f.read(1))\n` +
            `        delay = max(1, 1000 // fps)\n` +
            `        while True:\n` +
            `            f.seek(8)\n` +
            `            for _ in range(n):\n` +
            `                buf = bytearray(f.read(1024))\n` +
            `                fb = framebuf.FrameBuffer(buf, 128, 64, framebuf.MONO_HLSB)\n` +
            `                oled.fill(0); oled.blit(fb, 0, 0); oled.show()\n` +
            `                time.sleep_ms(delay)`
          );
          chunkLines.push(`${indent}_play_oled(oled, '/anim/${d.animFile}.bin')`);
          break;
        }

        // Always clear before drawing
        chunkLines.push(`${indent}oled.fill(0)`);

        // Static pixel art (drawn in the node's OLED designer)
        const staticPixels = d.staticPixels as boolean[][] | undefined;
        if (staticPixels && staticPixels.some(row => row.some(v => v))) {
          imports.add("import framebuf");
          const hexStr = bytesToPyHex(oledPixelsToMonoHLSB(staticPixels, oledW, oledH));
          chunkLines.push(`${indent}_fb = framebuf.FrameBuffer(bytearray(b'${hexStr}'), ${oledW}, ${oledH}, framebuf.MONO_HLSB)`);
          chunkLines.push(`${indent}oled.blit(_fb, 0, 0)`);
        }

        // Animation frames
        const animFrames = d.animFrames as boolean[][][] | undefined;
        if (animFrames && animFrames.length > 1) {
          imports.add("import framebuf");
          imports.add("import time");
          const framesStr = animFrames.map(f => {
            const hex = bytesToPyHex(oledPixelsToMonoHLSB(f, oledW, oledH));
            return `b'${hex}'`;
          }).join(", ");
          const fps = typeof d.fps === "number" ? d.fps : 10;
          const delayMs = Math.round(1000 / fps);
          setupLines.push(`_oled_frames = [${framesStr}]`);
          chunkLines.push(`${indent}for _fd in _oled_frames:`);
          chunkLines.push(`${indent}    _fb = framebuf.FrameBuffer(bytearray(_fd), ${oledW}, ${oledH}, framebuf.MONO_HLSB)`);
          chunkLines.push(`${indent}    oled.fill(0); oled.blit(_fb, 0, 0); oled.show()`);
          chunkLines.push(`${indent}    time.sleep_ms(${delayMs})`);
        } else {
          // Text lines
          const line1 = typeof d.line1 === "string" ? d.line1 : "";
          const line2 = typeof d.line2 === "string" ? d.line2 : "";
          if (line1) chunkLines.push(`${indent}oled.text(${JSON.stringify(line1)}, 0, 0)`);
          if (line2) chunkLines.push(`${indent}oled.text(${JSON.stringify(line2)}, 0, 12)`);
          chunkLines.push(`${indent}oled.show()`);
        }
        break;
      }
      case "seven_seg":
        imports.add("import tm1637");
        imports.add("from machine import Pin");
        setupLines.push(`tm = tm1637.TM1637(clk=Pin(${d.clk ?? 17}), dio=Pin(${d.dio ?? 18}))`);
        chunkLines.push(`${indent}tm.number(${d.number ?? 1234})`);
        break;
      // ─── Servo nodes ───────────────────────────────────────────────────────
      case "servo_motor": {
        imports.add("from machine import Pin, PWM");
        emitOnce("servo_class", buildServoHelperBlock());
        const PORT_TO_SV: Record<string, string> = { S1: "s1", S2: "s2", S3: "s3", S4: "s4" };
        const smPort = (d.servoPort as string) ?? "S1";
        const sv1    = PORT_TO_SV[smPort] ?? "s1";
        const smModelKey = (d.servoModel as keyof typeof SERVO_MODELS) ?? "mg90s";
        const smModel    = SERVO_MODELS[smModelKey] ?? SERVO_MODELS.mg90s;
        // Re-create the servo with the selected model's pulse range.
        chunkLines.push(`${indent}${sv1} = Servo(${SERVO_PIN_MAP[smPort] ?? 21}, mn=${smModel.pulseMin}, mx=${smModel.pulseMax})  # ${smModel.label}`);
        if (d.servoType === "360") {
          const spd = d.contSpeed ?? 0;
          chunkLines.push(`${indent}${sv1}.speed(${spd})  # ${smPort} 360° continuous ${spd}%`);
        } else {
          chunkLines.push(`${indent}${sv1}.angle(${d.angle ?? 90})  # ${smPort} → ${d.angle ?? 90}°`);
        }
        break;
      }
      case "servo_motor_advance": {
        imports.add("from machine import Pin, PWM");
        imports.add("import time");
        emitOnce("servo_class", buildServoHelperBlock());
        const PORT_TO_SV2: Record<string, string> = { S1: "s1", S2: "s2", S3: "s3", S4: "s4" };
        const swPort = (d.servoPort as string) ?? "S1";
        const sv2    = PORT_TO_SV2[swPort] ?? "s1";
        const swModelKey = (d.servoModel as keyof typeof SERVO_MODELS) ?? "mg90s";
        const swModel    = SERVO_MODELS[swModelKey] ?? SERVO_MODELS.mg90s;
        // Re-create the servo with the selected model's pulse range.
        chunkLines.push(`${indent}${sv2} = Servo(${SERVO_PIN_MAP[swPort] ?? 21}, mn=${swModel.pulseMin}, mx=${swModel.pulseMax})  # ${swModel.label}`);
        if (d.servoType === "360") {
          // Continuous-rotation servo: oscillate forward then reverse.
          const swSpeed  = Math.abs(d.contSpeed ?? 60);
          const swPeriod = Math.max(5, d.sweepPeriod ?? 1000);
          chunkLines.push(`${indent}# Oscillate ${swPort}: ±${swSpeed}% every ${swPeriod}ms`);
          chunkLines.push(`${indent}${sv2}.speed(${swSpeed}); time.sleep_ms(${swPeriod})`);
          chunkLines.push(`${indent}${sv2}.speed(${-swSpeed}); time.sleep_ms(${swPeriod})`);
          chunkLines.push(`${indent}${sv2}.speed(0)  # stop`);
        } else {
          const svStart  = d.startAngle ?? 0;
          const svEnd    = d.endAngle ?? 90;
          const svSteps  = Math.max(1, d.steps ?? 10);
          const svDelay  = Math.max(5, Math.round(200 / (d.speed ?? 50) * 10));
          const svStep   = Math.max(1, Math.round(Math.abs(svEnd - svStart) / svSteps));
          const svDir    = svEnd >= svStart ? 1 : -1;
          const svBounce = !!(d.bounce);
          const svLoop   = !!(d.loop);
          const bounceLabel = svBounce ? ` → ${svStart}°` : "";
          const loopLabel   = svLoop   ? " (loop)" : "";
          chunkLines.push(`${indent}# Sweep ${swPort}: ${svStart}° → ${svEnd}°${bounceLabel}${loopLabel}`);
          // Wrap in while True if looping
          const li = svLoop ? indent + "    " : indent;
          if (svLoop) chunkLines.push(`${indent}while True:`);
          // Forward pass
          chunkLines.push(`${li}for _a in range(${svStart}, ${svEnd + svDir}, ${svStep * svDir}):`);
          chunkLines.push(`${li}    ${sv2}.angle(_a)`);
          chunkLines.push(`${li}    time.sleep_ms(${svDelay})`);
          // Bounce (return) pass
          if (svBounce) {
            chunkLines.push(`${li}for _a in range(${svEnd}, ${svStart - svDir}, ${svStep * -svDir}):`);
            chunkLines.push(`${li}    ${sv2}.angle(_a)`);
            chunkLines.push(`${li}    time.sleep_ms(${svDelay})`);
          }
        }
        break;
      }
      case "l298n_motor":
        // Deprecated — generates a warning comment but still basic code
        imports.add("from machine import Pin");
        chunkLines.push(`${indent}# ⚠️ L298N deprecated — use Multi-Motor Controller for DRV8833`);
        break;

      // ─── New Sensor Nodes ──────────────────────────────────────────────────
      case "analog_sensor": {
        const vn = d.varName ?? "analog_val";
        imports.add("from machine import ADC, Pin");
        setupLines.push(`adc_${d.pin ?? 34} = ADC(Pin(${d.pin ?? 34}))`);
        chunkLines.push(`${indent}${vn} = adc_${d.pin ?? 34}.read_u16() >> 4  # 12-bit`);
        if (d.sendToViz !== false) {
          chunkLines.push(`${indent}print(f"SENSOR,raw,${vn},{${vn}}")`);
        }
        break;
      }
      case "button_digital_input":
        imports.add("from machine import Pin");
        {
          const pullMode = d.pullup ? "Pin.PULL_UP" : "Pin.PULL_DOWN";
          setupLines.push(`btn_${d.pin ?? 0} = Pin(${d.pin ?? 0}, Pin.IN, ${pullMode})`);
          chunkLines.push(`${indent}${d.varName ?? "btn"} = btn_${d.pin ?? 0}.value()`);
        }
        break;

      // ─── New Display Nodes ─────────────────────────────────────────────────
      case "lcd_16x2": {
        // Shares the OLED I2C bus pins by default; overridable on the node.
        const scl = d.scl ?? OLED.scl;
        const sda = d.sda ?? OLED.sda;
        const lcdLine1 = typeof d.line1 === "string" ? d.line1 : "Hello";
        const lcdLine2 = typeof d.line2 === "string" ? d.line2 : "World";
        const lcdVar = typeof d.varName === "string" ? d.varName.trim() : "";
        // Render a line to a Python string/f-string literal. Supports tokens:
        //   {v}        → the default Variable field (uses an f-string)
        //   {name}     → any Python variable by name (multiple per line)
        //   {c0}..{c7} → custom character slots via chr(n)
        const renderLcdLine = (text: string): string => {
          // Collect up to 16 display "units" without splitting a token across
          // the column cap — each token occupies a single LCD column.
          const units: string[] = [];
          let i = 0;
          while (i < text.length && units.length < 16) {
            const m = text.slice(i).match(/^(\{c[0-7]\}|\{[A-Za-z_]\w*\})/);
            if (m) { units.push(m[0]); i += m[0].length; }
            else { units.push(text[i]); i += 1; }
          }
          let s = units.join("");
          let isF = false;
          // Custom characters → chr(n)
          s = s.replace(/\{c([0-7])\}/g, (_m, n) => { isF = true; return `{chr(${n})}`; });
          // Variables: {v} maps to the Variable field, {name} maps directly.
          s = s.replace(/\{([A-Za-z_]\w*)\}/g, (_m, name) => {
            if (name === "v") {
              if (!lcdVar) return "";       // no variable wired → drop token
              isF = true; return `{${lcdVar}}`;
            }
            isF = true; return `{${name}}`;
          });
          // JSON.stringify gives a safely-escaped double-quoted literal; the
          // curly-brace expressions we inserted are preserved for the f-string.
          return isF ? `f${JSON.stringify(s)}` : JSON.stringify(s);
        };
        imports.add("from machine import SoftI2C, Pin");
        imports.add("from i2c_lcd import I2cLcd");
        setupLines.push(`i2c_lcd_bus = SoftI2C(sda=Pin(${sda}), scl=Pin(${scl}), freq=400000)`);
        setupLines.push(`lcd = I2cLcd(i2c_lcd_bus, ${d.address ?? "0x27"}, 2, 16)`);
        // Upload custom characters (once) for any non-blank editor slot.
        const lcdChars = Array.isArray(d.customChars) ? (d.customChars as unknown[]) : [];
        lcdChars.forEach((ch, idx) => {
          if (!Array.isArray(ch)) return;
          const rows = ch as boolean[][];
          if (!rows.some((r) => Array.isArray(r) && r.some(Boolean))) return; // blank
          const bytes = rows.slice(0, 8).map((r) => {
            let b = 0;
            (r || []).forEach((on, c) => { if (on && c < 5) b |= 1 << (4 - c); });
            return `0x${b.toString(16).padStart(2, "0").toUpperCase()}`;
          });
          setupLines.push(`lcd.custom_char(${idx}, bytearray([${bytes.join(", ")}]))`);
        });
        if (d.backlight === false) chunkLines.push(`${indent}lcd.backlight_off()`);
        else chunkLines.push(`${indent}lcd.backlight_on()`);
        chunkLines.push(`${indent}lcd.clear()`);
        chunkLines.push(`${indent}lcd.putstr(${renderLcdLine(lcdLine1)})`);
        chunkLines.push(`${indent}lcd.move_to(0, 1)`);
        chunkLines.push(`${indent}lcd.putstr(${renderLcdLine(lcdLine2)})`);
        break;
      }

      // ─── New GPIO/Output Nodes ─────────────────────────────────────────────
      case "rgb_led_matrix":
        imports.add("import neopixel");
        imports.add("from machine import Pin");
        setupLines.push(`rgb_matrix = neopixel.NeoPixel(Pin(${d.pin ?? NEOPIXEL.pin}), ${d.ledCount ?? 16})`);
        chunkLines.push(`${indent}# Pattern: ${d.pattern ?? "Chase"} on ${d.ledCount ?? 16} LEDs`);
        chunkLines.push(`${indent}for i in range(len(rgb_matrix)):`);
        chunkLines.push(`${indent}    rgb_matrix[i] = (${Math.round((d.brightness ?? 128))}, 0, 0)`);
        chunkLines.push(`${indent}rgb_matrix.write()`);
        break;
      case "pwm_output":
        imports.add("from machine import Pin, PWM");
        setupLines.push(`pwm_out_${d.pin ?? 2} = PWM(Pin(${d.pin ?? 2}), freq=${d.freq ?? 1000})`);
        chunkLines.push(`${indent}pwm_out_${d.pin ?? 2}.duty(${Math.round(((d.duty ?? 50) / 100) * 1023)})`);
        break;

      // ─── Motor nodes ───────────────────────────────────────────────────────
      case "robot_drive": {
        imports.add("from machine import Pin, PWM");
        const move = (d.move as string) ?? "forward";
        const t    = ((d.speed ?? 75) / 100).toFixed(2);  // throttle 0.0–1.0
        const ti   = (((d.speed ?? 75) * 0.3) / 100).toFixed(2);  // inner wheel for turns
        chunkLines.push(`${indent}# Robot Drive — ${move}`);

        if (d.useCustomPins) {
          // Per-wheel throttle expression for each move (null = stop)
          const moveThrottles: Record<string, Record<"FL" | "FR" | "RL" | "RR", string | null>> = {
            forward:    { FL: t,        FR: t,        RL: t,        RR: t        },
            backward:   { FL: `-${t}`,  FR: `-${t}`,  RL: `-${t}`,  RR: `-${t}`  },
            left:       { FL: ti,       FR: t,        RL: ti,       RR: t        },
            right:      { FL: t,        FR: ti,       RL: t,        RR: ti       },
            spin_left:  { FL: `-${t}`,  FR: t,        RL: `-${t}`,  RR: t        },
            spin_right: { FL: t,        FR: `-${t}`,  RL: t,        RR: `-${t}`  },
            stop:       { FL: null,     FR: null,     RL: null,     RR: null     },
          };
          const throttles = moveThrottles[move] ?? moveThrottles.forward;
          const WHEELS = [
            { name: "FL" as const, pwm: d.flPwmPin ?? MOTORS.frontLeft.pwm,  dir: d.flDirPin ?? MOTORS.frontLeft.dir  },
            { name: "FR" as const, pwm: d.frPwmPin ?? MOTORS.frontRight.pwm, dir: d.frDirPin ?? MOTORS.frontRight.dir },
            { name: "RL" as const, pwm: d.rlPwmPin ?? MOTORS.rearLeft.pwm,   dir: d.rlDirPin ?? MOTORS.rearLeft.dir   },
            { name: "RR" as const, pwm: d.rrPwmPin ?? MOTORS.rearRight.pwm,  dir: d.rrDirPin ?? MOTORS.rearRight.dir  },
          ];
          for (const w of WHEELS) {
            const { pwmVar, dirVar } = getCustomMotorHandle(w.pwm, w.dir);
            const thr = throttles[w.name];
            if (thr === null) chunkLines.push(`${indent}_cm_stop(${pwmVar}, ${dirVar})  # ${w.name}`);
            else chunkLines.push(`${indent}_cm_drive(${pwmVar}, ${dirVar}, ${thr})  # ${w.name}`);
          }
        } else {
          emitOnce("drv8833_class", DRV8833_HELPER);
          if (move === "forward") {
            chunkLines.push(`${indent}front.throttle_a(${t}); front.throttle_b(${t}); rear.throttle_a(${t}); rear.throttle_b(${t})`);
          } else if (move === "backward") {
            chunkLines.push(`${indent}front.throttle_a(-${t}); front.throttle_b(-${t}); rear.throttle_a(-${t}); rear.throttle_b(-${t})`);
          } else if (move === "left") {
            chunkLines.push(`${indent}front.throttle_a(${t}); front.throttle_b(${ti}); rear.throttle_a(${t}); rear.throttle_b(${ti})`);
          } else if (move === "right") {
            chunkLines.push(`${indent}front.throttle_a(${ti}); front.throttle_b(${t}); rear.throttle_a(${ti}); rear.throttle_b(${t})`);
          } else if (move === "spin_left") {
            chunkLines.push(`${indent}front.throttle_a(${t}); front.throttle_b(-${t}); rear.throttle_a(${t}); rear.throttle_b(-${t})`);
          } else if (move === "spin_right") {
            chunkLines.push(`${indent}front.throttle_a(-${t}); front.throttle_b(${t}); rear.throttle_a(-${t}); rear.throttle_b(${t})`);
          } else {
            chunkLines.push(`${indent}front.stop_all(); rear.stop_all()`);
          }
        }
        break;
      }
      case "dc_motor_single": {
        // L1=FL(front.b), L2=RL(rear.b), R1=FR(front.a), R2=RR(rear.a)
        imports.add("from machine import Pin, PWM");
        const mKey  = (d.motorPort as string) ?? "L1";
        const dir   = d.direction ?? "Forward";
        const speed = d.speed ?? 50;
        const t2    = (speed / 100).toFixed(2);
        const throttle = dir === "Reverse" ? `-${t2}` : t2;

        if (d.useCustomPins && typeof d.customPwmPin === "number" && typeof d.customDirPin === "number") {
          const { pwmVar, dirVar } = getCustomMotorHandle(d.customPwmPin, d.customDirPin);
          if (dir === "Brake" || dir === "Coast") {
            chunkLines.push(`${indent}_cm_stop(${pwmVar}, ${dirVar})  # ${mKey} ${dir} (custom GPIO ${d.customPwmPin}/${d.customDirPin})`);
          } else {
            chunkLines.push(`${indent}_cm_drive(${pwmVar}, ${dirVar}, ${throttle})  # ${mKey} ${dir} ${speed}% (custom GPIO ${d.customPwmPin}/${d.customDirPin})`);
          }
        } else {
          emitOnce("drv8833_class", DRV8833_HELPER);
          const portToDRV: Record<string, { obj: string; fn: string }> = {
            L1: { obj: "front", fn: "b" },
            L2: { obj: "rear",  fn: "b" },
            R1: { obj: "front", fn: "a" },
            R2: { obj: "rear",  fn: "a" },
          };
          const drv = portToDRV[mKey] ?? portToDRV["L1"];
          if (dir === "Brake" || dir === "Coast") {
            chunkLines.push(`${indent}${drv.obj}.stop_${drv.fn}()  # ${dir}`);
          } else {
            chunkLines.push(`${indent}${drv.obj}.throttle_${drv.fn}(${throttle})  # ${mKey} ${dir} ${speed}%`);
          }
        }
        break;
      }
      case "servo_controller": {
        imports.add("from machine import Pin, PWM");
        emitOnce("servo_class", buildServoHelperBlock());
        const PORT_TO_SVC: Record<string, string> = { S1: "s1", S2: "s2", S3: "s3", S4: "s4" };
        const scPort = (d.servoPort as string) ?? "S1";
        const scObj  = PORT_TO_SVC[scPort] ?? "s1";
        const scModelKey = (d.servoModel as keyof typeof SERVO_MODELS) ?? "mg90s";
        const scModel    = SERVO_MODELS[scModelKey] ?? SERVO_MODELS.mg90s;
        const pulseMin = d.pulseMin ?? scModel.pulseMin;
        const pulseMax = d.pulseMax ?? scModel.pulseMax;
        // Re-create with the configured pulse range (model preset or fine-tuned) if non-default.
        if (pulseMin !== 600 || pulseMax !== 2400) {
          chunkLines.push(`${indent}${scObj} = Servo(${SERVO_PIN_MAP[scPort] ?? 21}, mn=${pulseMin}, mx=${pulseMax})  # ${scModel.label}`);
        }
        if (d.servoType === "360") {
          const spd = d.contSpeed ?? 50;
          chunkLines.push(`${indent}${scObj}.speed(${spd})  # ${scPort} 360° continuous ${spd}%`);
        } else if (d.mode === "sweep") {
          imports.add("import time");
          const swMin = d.sweepMin ?? 0;
          const swMax = d.sweepMax ?? 180;
          const stepMs = Math.max(5, Math.round((d.sweepPeriod ?? 1000) / Math.abs(swMax - swMin)));
          chunkLines.push(`${indent}# Sweep ${scPort}: ${swMin}° → ${swMax}°`);
          chunkLines.push(`${indent}for _a in range(${swMin}, ${swMax + 1}, 1):`);
          chunkLines.push(`${indent}    ${scObj}.angle(_a)`);
          chunkLines.push(`${indent}    time.sleep_ms(${stepMs})`);
        } else {
          const pulseRange = pulseMax - pulseMin;
          chunkLines.push(`${indent}${scObj}.angle(${d.angle ?? 90})  # ${scPort} → ${d.angle ?? 90}° (pulse ${Math.round(pulseMin + ((d.angle ?? 90) / 180) * pulseRange)} µs)`);
        }
        break;
      }
      case "multi_motor_controller": {
        imports.add("from machine import Pin, PWM");
        // Port → DRV8833 object + method: L1=FL(front.b), L2=RL(rear.b), R1=FR(front.a), R2=RR(rear.a)
        const portToDRVm: Record<string, { obj: string; fn: string }> = {
          L1: { obj: "front", fn: "b" },
          L2: { obj: "rear",  fn: "b" },
          R1: { obj: "front", fn: "a" },
          R2: { obj: "rear",  fn: "a" },
        };
        // Port → custom GPIO pins, falling back to that port's stock DRV8833 wiring
        // (L1=frontLeft, L2=rearLeft, R1=frontRight, R2=rearRight)
        const portToCustomPins: Record<string, { pwm: number; dir: number }> = {
          L1: { pwm: d.l1PwmPin ?? MOTORS.frontLeft.pwm,  dir: d.l1DirPin ?? MOTORS.frontLeft.dir  },
          L2: { pwm: d.l2PwmPin ?? MOTORS.rearLeft.pwm,   dir: d.l2DirPin ?? MOTORS.rearLeft.dir   },
          R1: { pwm: d.r1PwmPin ?? MOTORS.frontRight.pwm, dir: d.r1DirPin ?? MOTORS.frontRight.dir },
          R2: { pwm: d.r2PwmPin ?? MOTORS.rearRight.pwm,  dir: d.r2DirPin ?? MOTORS.rearRight.dir  },
        };
        if (!d.useCustomPins) emitOnce("drv8833_class", DRV8833_HELPER);
        const makeMotorCall = (port: string, speed: number, dir: string) => {
          const t = ((dir === "Reverse" ? -speed : speed) / 100).toFixed(2);
          if (d.useCustomPins) {
            const cp = portToCustomPins[port] ?? portToCustomPins["L1"];
            const { pwmVar, dirVar } = getCustomMotorHandle(cp.pwm, cp.dir);
            if (dir === "Brake" || dir === "Coast") return `_cm_stop(${pwmVar}, ${dirVar})`;
            return `_cm_drive(${pwmVar}, ${dirVar}, ${t})`;
          }
          const drv = portToDRVm[port] ?? portToDRVm["L1"];
          if (dir === "Brake" || dir === "Coast") return `${drv.obj}.stop_${drv.fn}()`;
          return `${drv.obj}.throttle_${drv.fn}(${t})`;
        };
        if (d.syncMode) {
          const spd = d.l1speed ?? 50;
          const dir = d.l1dir ?? "Forward";
          const calls = ["L1","L2","R1","R2"].map(p => makeMotorCall(p, spd, dir)).join("; ");
          chunkLines.push(`${indent}${calls}  # sync all`);
        } else if (d.pairMode) {
          const lCalls = ["L1","L2"].map(p => makeMotorCall(p, d.leftSpeed ?? 50, d.leftDir ?? "Forward")).join("; ");
          const rCalls = ["R1","R2"].map(p => makeMotorCall(p, d.rightSpeed ?? 50, d.rightDir ?? "Forward")).join("; ");
          chunkLines.push(`${indent}${lCalls}  # left side`);
          chunkLines.push(`${indent}${rCalls}  # right side`);
        } else {
          const ports  = ["L1", "L2", "R1", "R2"] as const;
          const speeds = [d.l1speed ?? 50, d.l2speed ?? 50, d.r1speed ?? 50, d.r2speed ?? 50];
          const dirs   = [d.l1dir ?? "Forward", d.l2dir ?? "Forward", d.r1dir ?? "Forward", d.r2dir ?? "Forward"];
          for (let i = 0; i < 4; i++) {
            chunkLines.push(`${indent}${makeMotorCall(ports[i], speeds[i], dirs[i])}  # ${ports[i]}`);
          }
        }
        break;
      }
      case "multi_servo_sequencer": {
        imports.add("from machine import Pin, PWM");
        imports.add("import time");
        emitOnce("servo_class", buildServoHelperBlock());
        // Map port names to servo object names
        const PORT_TO_MSS: Record<string, string> = { S1: "s1", S2: "s2", S3: "s3", S4: "s4" };
        const mssObj1 = PORT_TO_MSS[(d.s1port as string) ?? "S1"] ?? "s1";
        const mssObj2 = PORT_TO_MSS[(d.s2port as string) ?? "S2"] ?? "s2";
        const mssObj3 = PORT_TO_MSS[(d.s3port as string) ?? "S3"] ?? "s3";
        emitOnce(`mss_list_${mssObj1}_${mssObj2}_${mssObj3}`,
          `_mss = [${mssObj1}, ${mssObj2}, ${mssObj3}]  # sequencer servos`);
        chunkLines.push(`${indent}# Multi-Servo Sequencer`);
        if (d.keyframes && Array.isArray(d.keyframes)) {
          for (const kf of d.keyframes) {
            const angles: number[] = kf.angles ?? [90, 90, 90];
            for (let si = 0; si < Math.min(3, angles.length); si++) {
              chunkLines.push(`${indent}_mss[${si}].angle(${angles[si]})`);
            }
            chunkLines.push(`${indent}time.sleep_ms(${d.keyframeDelay ?? 500})`);
          }
        } else {
          chunkLines.push(`${indent}for _sv in _mss: _sv.center()  # center all`);
          chunkLines.push(`${indent}time.sleep_ms(${d.keyframeDelay ?? 500})`);
        }
        break;
      }

      // ─── Comms Nodes ───────────────────────────────────────────────────────
      case "ble_mode": {
        // Nordic UART Service (NUS) BLE peripheral using raw bluetooth module
        const bleDevName  = d.deviceName  ?? "ESP32-BLE";
        const bleSvcUUID  = d.serviceUUID ?? "6E400001-B5A3-F393-E0A9-E50E24DCCA9E";
        const bleRxUUID   = d.rxCharUUID  ?? "6E400002-B5A3-F393-E0A9-E50E24DCCA9E";
        const bleTxUUID   = d.txCharUUID  ?? "6E400003-B5A3-F393-E0A9-E50E24DCCA9E";
        const bleRawVar   = d.rawVarName  ?? "ble_data";
        const bleTxVar    = d.txVarName   ?? "ble_tx";
        const BLE_DEFAULT_CMDS = [
          { trigger: "LED_ON",  varName: "", value: "" },
          { trigger: "LED_OFF", varName: "", value: "" },
        ];
        const bleCmds     = (d.cmdMap && d.cmdMap.length > 0) ? d.cmdMap : BLE_DEFAULT_CMDS;
        const bleCmdMap   = d.enableCmdMap ?? true;
        const bleTxOn     = d.enableTx ?? false;

        imports.add("import bluetooth");
        imports.add("import struct");

        // BLE setup — GATT server with NUS service
        setupLines.push(`# ── BLE Peripheral (NUS) ───────────────────────────────`);
        setupLines.push(`_ble = bluetooth.BLE()`);
        setupLines.push(`_ble.active(True)`);
        setupLines.push(`_BLE_SVC  = bluetooth.UUID("${bleSvcUUID}")`);
        setupLines.push(`_BLE_RX   = (bluetooth.UUID("${bleRxUUID}"), bluetooth.FLAG_WRITE,)`);
        setupLines.push(`_BLE_TX   = (bluetooth.UUID("${bleTxUUID}"), bluetooth.FLAG_NOTIFY,)`);
        setupLines.push(`_BLE_UART = (_BLE_SVC, (_BLE_TX, _BLE_RX,),)`);
        setupLines.push(`((_ble_tx_h, _ble_rx_h),) = _ble.gatts_register_services((_BLE_UART,))`);
        setupLines.push(`_ble_conn = None`);
        setupLines.push(`${bleRawVar} = None`);
        if (bleCmdMap && bleCmds.length > 0) {
          const uniqueVars = [...new Set(bleCmds.map(c => c.varName).filter(Boolean))];
          for (const v of uniqueVars) {
            setupLines.push(`${v} = None`);
          }
        }
        if (bleTxOn) {
          setupLines.push(`${bleTxVar} = None`);
          setupLines.push(`_ble_prev_tx = None`);
        }

        // IRQ handler
        setupLines.push(`def _ble_irq(event, data):`);
        setupLines.push(`    global _ble_conn, ${bleRawVar}`);
        setupLines.push(`    if event == 1:    # CENTRAL_CONNECT`);
        setupLines.push(`        _ble_conn = data[0]`);
        setupLines.push(`    elif event == 2:  # CENTRAL_DISCONNECT`);
        setupLines.push(`        _ble_conn = None`);
        setupLines.push(`        _ble_adv()`);
        setupLines.push(`    elif event == 3:  # GATTS_WRITE`);
        setupLines.push(`        ${bleRawVar} = _ble.gatts_read(_ble_rx_h).decode().strip()`);
        setupLines.push(`_ble.irq(_ble_irq)`);

        // Advertise helper
        setupLines.push(`def _ble_adv():`);
        setupLines.push(`    name = b"${bleDevName}"`);
        setupLines.push(`    adv = bytes([0x02,0x01,0x06, len(name)+1,0x09]) + name`);
        setupLines.push(`    _ble.gap_advertise(100_000, adv)`);
        setupLines.push(`_ble_adv()`);

        // Loop chunk — process incoming data
        chunkLines.push(`${indent}# BLE: process received data`);
        if (bleCmdMap && bleCmds.length > 0) {
          chunkLines.push(`${indent}if ${bleRawVar} is not None:`);
          for (let ci = 0; ci < bleCmds.length; ci++) {
            const cmd = bleCmds[ci];
            if (!cmd.trigger) continue;
            const handleId = `cmd_${ci}`;
            const branchLines = getBranchLines(handleId, indentLevel + 2);
            if (branchLines.length > 0) {
              // Has wired nodes — generate a block for them
              chunkLines.push(`${indent}    if ${bleRawVar} == "${cmd.trigger}":`);
              chunkLines.push(...branchLines);
            } else {
              // No wired nodes — fall back to variable assignment
              if (cmd.varName) {
                const val = isNaN(Number(cmd.value)) ? `"${cmd.value}"` : cmd.value;
                chunkLines.push(`${indent}    if ${bleRawVar} == "${cmd.trigger}": ${cmd.varName} = ${val}`);
              }
            }
          }
          chunkLines.push(`${indent}    ${bleRawVar} = None  # clear after handling`);
        } else {
          chunkLines.push(`${indent}# ${bleRawVar} contains last received string (or None)`);
        }

        // TX notify
        if (bleTxOn) {
          chunkLines.push(`${indent}# BLE: send data back to phone`);
          chunkLines.push(`${indent}if _ble_conn is not None and ${bleTxVar} is not None and ${bleTxVar} != _ble_prev_tx:`);
          chunkLines.push(`${indent}    _ble.gatts_notify(_ble_conn, _ble_tx_h, str(${bleTxVar}).encode())`);
          chunkLines.push(`${indent}    _ble_prev_tx = ${bleTxVar}`);
        }
        break;
      }
      case "wifi_node":
        imports.add("import network");
        imports.add("import time");
        {
          const wMode = d.mode === "ap" ? "AP" : "STA";
          setupLines.push(`wlan = network.WLAN(network.${wMode}_IF)`);
          setupLines.push(`wlan.active(True)`);
          if (d.mode === "ap") {
            setupLines.push(`wlan.config(essid="${d.ssid ?? "ESP32-AP"}", password="${d.password ?? "password123"}")`);
          } else {
            setupLines.push(`wlan.connect("${d.ssid ?? "MyNetwork"}", "${d.password ?? "password123"}")`);
            setupLines.push(`while not wlan.isconnected(): time.sleep_ms(100)`);
          }
        }
        chunkLines.push(`${indent}${d.varName ?? "ip"} = wlan.ifconfig()[0]`);
        break;

      case "esp_now_receiver":
        imports.add("import espnow");
        imports.add("import network");
        chunkLines.push(`${indent}# ESP NOW Receive from peer`);
        chunkLines.push(`${indent}en = espnow.ESPNow()`);
        chunkLines.push(`${indent}en.active(True)`);
        chunkLines.push(`${indent}${d.varName ?? "espnow_msg"} = en.recv(1024)`);
        break;

      case "mqtt_node":
        imports.add("import network");
        imports.add("from umqtt.simple import MQTTClient");
        chunkLines.push(`${indent}# MQTT node for topic ${d.topic ?? "sensors/data"}`);
        chunkLines.push(`${indent}mqtt_client = MQTTClient("${d.clientId ?? "kokoon-client"}", "${d.broker ?? "broker.hivemq.com"}")`);
        chunkLines.push(`${indent}mqtt_client.connect()`);
        chunkLines.push(`${indent}mqtt_client.publish(b"${d.topic ?? "sensors/data"}", b"${d.payload ?? "hello"}")`);
        break;

      case "http_client":
        imports.add("import urequests");
        chunkLines.push(`${indent}${d.varName ?? "response"} = urequests.get("${d.url ?? "http://example.com"}").text`);
        break;

      case "serial_monitor":
        chunkLines.push(`${indent}print(${d.value ?? "'Serial monitor output'"})`);
        break;

      case "timer_interval":
        imports.add("import time");
        chunkLines.push(`${indent}_last_tick = time.ticks_ms()`);
        chunkLines.push(`${indent}if time.ticks_diff(time.ticks_ms(), _last_tick) >= ${d.interval ?? 1000}:`);
        chunkLines.push(`${indent}    _last_tick = time.ticks_ms()`);
        chunkLines.push(`${indent}    ${d.varName ?? "timer_fired"} = True`);
        break;

      case "variable_state":
        chunkLines.push(`${indent}# Variable state tracker: ${d.name ?? "state"}`);
        chunkLines.push(`${indent}${d.varName ?? "state"} = ${d.value ?? "None"}`);
        break;

      case "math_transform":
        chunkLines.push(`${indent}${d.varName ?? "result"} = ${d.expression ?? "0"}`);
        break;

      case "deep_sleep":
        imports.add("from machine import deepsleep");
        chunkLines.push(`${indent}deepsleep(${d.durationMs ?? 1000})`);
        break;

      case "ota_update":
        chunkLines.push(`${indent}# OTA update placeholder: ${d.url ?? "configure an update URL"}`);
        break;

      case "sd_card":
        imports.add("from machine import SPI, Pin");
        imports.add("import sdcard");
        chunkLines.push(`${indent}# SD card mount on CS pin ${d.csPin ?? 5}`);
        chunkLines.push(`${indent}spi = SPI(1, sck=Pin(${d.sck ?? 18}), mosi=Pin(${d.mosi ?? 23}), miso=Pin(${d.miso ?? 19}))`);
        chunkLines.push(`${indent}sd = sdcard.SDCard(spi, Pin(${d.csPin ?? 5}))`);
        break;

      case "max7219": {
        const mods       = d.modules ?? 1;
        const W          = mods * 8;
        const mFps       = d.fps ?? 8;
        const mFrames    = d.matrixFrames;
        const mName      = d.designName ?? "matrix";
        const mBright    = d.brightness ?? 8;
        imports.add("from machine import Pin, SPI");
        imports.add("import max7219, time");
        const mSck  = d.sck  ?? MATRIX.sck;
        const mMosi = d.mosi ?? MATRIX.mosi;
        const mCs   = d.cs   ?? MATRIX.cs;
        // MAX7219 is write-only — no MISO line needed
        emitOnce("matrix_setup",
          `# MAX7219 matrix — CLK=${mSck} DIN=${mMosi} CS=${mCs}\n` +
          `_mat_spi = SPI(1, baudrate=${MATRIX.baudrate}, polarity=0, phase=0, sck=Pin(${mSck}), mosi=Pin(${mMosi}))\n` +
          `_mat_cs  = Pin(${mCs}, Pin.OUT)\n` +
          `_mat     = max7219.Matrix8x8(_mat_spi, _mat_cs, ${mods})\n` +
          `_mat.brightness(${mBright})`
        );
        if (mFrames && mFrames.length > 0) {
          // Encode frames as (mods * 8) bytes each.
          // Layout: byte[row * mods + mod] = 8 pixels of module `mod` on row `row`.
          // Each byte is always 0-255 regardless of module count.
          const frameBytes = mFrames.slice(0, 60).map((frame) => {
            const bytes: number[] = [];
            for (let row = 0; row < 8; row++) {
              for (let mod = 0; mod < mods; mod++) {
                let b = 0;
                for (let bit = 0; bit < 8; bit++) {
                  if (frame[row * W + mod * 8 + bit]) b |= (1 << bit);
                }
                bytes.push(b);
              }
            }
            return bytes;
          });
          const framesLiteral = frameBytes
            .map(bytes => `    bytes([${bytes.join(", ")}])`)
            .join(",\n");
          emitOnce(`matrix_frames_${mName}`,
            `# Matrix frames: ${mName} (${mFrames.length} frame${mFrames.length > 1 ? "s" : ""}, ${mFps} fps)\n` +
            `# Each frame = ${mods * 8} bytes: [row0_mod0, row0_mod1, ..., row7_mod${mods - 1}]\n` +
            `_mat_frames = [\n${framesLiteral}\n]`
          );
          // Pixel x-axis: show() sends buffer[y*num+0] first → it arrives at the
          // LAST physical module (SPI daisy-chain). Reverse module index so that
          // frame column 0 (leftmost in designer) maps to the leftmost physical module.
          chunkLines.push(`${indent}for _mf in _mat_frames:`);
          chunkLines.push(`${indent}    _mat.fill(0)`);
          chunkLines.push(`${indent}    for _r in range(8):`);
          chunkLines.push(`${indent}        for _m in range(${mods}):`);
          chunkLines.push(`${indent}            _b = _mf[_r * ${mods} + _m]`);
          chunkLines.push(`${indent}            _px = (${mods - 1} - _m) * 8`);
          chunkLines.push(`${indent}            for _bit in range(8):`);
          chunkLines.push(`${indent}                if _b & (1 << _bit): _mat.pixel(_px + (7 - _bit), _r, 1)`);
          chunkLines.push(`${indent}    _mat.show()`);
          chunkLines.push(`${indent}    time.sleep_ms(${Math.round(1000 / mFps)})`);
        } else {
          // No design yet — blank display
          chunkLines.push(`${indent}_mat.fill(0)`);
          chunkLines.push(`${indent}_mat.show()`);
        }
        break;
      }

      case "play_animation":
        chunkLines.push(`${indent}# Play animation: ${d.animationName ?? "default"}`);
        chunkLines.push(`${indent}# Animation frames should be supplied by the runtime or library layer.`);
        break;

      case "show_image":
        chunkLines.push(`${indent}# Show image: ${d.imageName ?? "image"}`);
        chunkLines.push(`${indent}# Image rendering is handled by the display library at runtime.`);
        break;

      // ─── Tool Nodes ────────────────────────────────────────────────────────
      case "servo_calibration":
        chunkLines.push(`${indent}# Servo Calibration — compile-time utility only (no runtime code)`);
        break;
      case "i2c_scanner":
        imports.add("from machine import I2C, Pin");
        setupLines.push(`i2c_scan_bus = I2C(0, scl=Pin(${d.scl ?? 22}), sda=Pin(${d.sda ?? 21}))`);
        chunkLines.push(`${indent}i2c_devices = i2c_scan_bus.scan()`);
        chunkLines.push(`${indent}print("I2C devices found:", [hex(x) for x in i2c_devices])`);
        break;

      // ─── Math ──────────────────────────────────────────────────────────────
      case "map_range":
        setupLines.push(`def map_range(x, in_min, in_max, out_min, out_max):
    if in_max == in_min:
        return out_min
    return int((x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min)`);
        chunkLines.push(`${indent}${d.varName ?? "mapped_value"} = map_range(${d.value ?? "value"}, ${d.fromMin ?? 0}, ${d.fromMax ?? 4095}, ${d.toMin ?? 0}, ${d.toMax ?? 180})`);
        break;
      case "clamp":
        chunkLines.push(`${indent}${d.varName ?? "clamped"} = max(${d.minVal ?? 0}, min(${d.maxVal ?? 100}, ${d.value ?? "value"}))`);
        break;
      case "random_number":
        imports.add("import random");
        chunkLines.push(`${indent}${d.varName ?? "rand_val"} = random.randint(${d.from ?? 0}, ${d.to ?? 100})`);
        break;

      default:
        chunkLines.push(`${indent}# Unknown node type: ${node.type}`);
    }

    // Follow the sequential bottom handle path
    const nextId = getNextNodeId();
    if (nextId) {
      const nextLines = generateChain(nextId, indentLevel);
      return chunkLines.concat(nextLines);
    }
    return chunkLines;
  }

  // Walk all root nodes in sorted order
  const codeLines: string[] = [];
  for (const root of sortedRoots) {
    const chainLines = generateChain(root.id, 0);
    if (chainLines.length > 0) {
      codeLines.push(...chainLines);
      codeLines.push(""); // add spacer between independent loops/routines
    }
  }

  // Assemble the Python code
  // Always clear the onboard NeoPixel at startup to prevent floating/glitch state
  imports.add("from machine import Pin");
  imports.add("import neopixel");
  if (imports.size > 0) {
    lines.push(...Array.from(imports));
    lines.push("");
  }
  lines.push(`_led = neopixel.NeoPixel(Pin(${NEOPIXEL.pin}, Pin.OUT), ${NEOPIXEL.count})`);
  lines.push(`_led.fill((0, 0, 0)); _led.write()  # clear onboard LED`);
  lines.push("");
  if (setupLines.length > 0) {
    // Unique the setup lines
    const uniqueSetups = Array.from(new Set(setupLines));
    lines.push(...uniqueSetups);
    lines.push("");
  }
  lines.push(...codeLines);

  // Trim trailing spacer lines
  return lines.join("\n").replace(/\n+$/, "\n");
}
