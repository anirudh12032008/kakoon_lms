/**
 * Pin geometry and pin wiring for the boards drawn as SVG in the hardware view
 * (Arduino Uno R3, ESP32-DevKitC 38-pin). One table per board: the SVG draws
 * its pin holes from it and the React Flow handles are positioned from it, so
 * the two cannot drift apart. The Kokoon PCB keeps its own port table.
 */
import { BOARDS, type BoardId, type BoardProfile } from "@/entities/board";
import { pinDefaults, type PinRole } from "@/entities/node/lib/blockDefaults";

export type PinSide = "top" | "bottom" | "left" | "right";

export interface BoardPin {
  /** Handle id. `pin:<gpio>` for the pin a wire to that GPIO lands on. */
  id: string;
  /** Silkscreen label, exactly as printed next to the pin. */
  label: string;
  /** GPIO number used in code. Absent on power / reserved pins (no anchor). */
  gpio?: number;
  /** Centre of the pin hole, in the SVG's own coordinate system. */
  x: number;
  y: number;
  side: PinSide;
  /** Usable with analog blocks on this board. */
  analog?: boolean;
  /** Cannot drive an output (ESP32 GPIO 34-39). */
  inputOnly?: boolean;
}

export interface BoardLayout {
  name: string;
  /** viewBox size. 1 unit = 0.01 inch, so header pitch is 10 on both boards. */
  w: number;
  h: number;
  /** Top-left corner of the PCB inside the viewBox (connectors overhang). */
  ox: number;
  oy: number;
  /** Screen pixels per unit for the board node. */
  scale: number;
  pins: BoardPin[];
}

/** 2.54 mm header pitch. */
export const PITCH = 10;

type PinFlags = { analog?: boolean; inputOnly?: boolean; alias?: boolean };
type PinSpec = string | [label: string, gpio: number, flags?: PinFlags];

/** A straight header: first pin at (x, y), then one PITCH per pin along the edge. */
function header(side: PinSide, x: number, y: number, specs: PinSpec[]): BoardPin[] {
  const horizontal = side === "top" || side === "bottom";
  return specs.map((spec, i) => {
    const [label, gpio, flags] = typeof spec === "string" ? [spec] : spec;
    const px = x + (horizontal ? i * PITCH : 0);
    const py = y + (horizontal ? 0 : i * PITCH);
    const id = gpio === undefined ? `nc:${px}:${py}` : flags?.alias ? `pin:${gpio}:${label}` : `pin:${gpio}`;
    return { id, label, gpio, x: px, y: py, side, analog: flags?.analog, inputOnly: flags?.inputOnly };
  });
}

// ─── Arduino Uno R3 ───────────────────────────────────────────────────────────
// Hole positions from the official board drawing (2700 x 2100 mil): top row
// 100 mil below the top edge, bottom row 100 mil above the bottom edge. The
// two top headers are 160 mil apart (pin 8 to pin 7), the two bottom ones 200.
const UX = 30; // USB-B overhangs the left edge
const UY = 2;
const AN: PinFlags = { analog: true };

export const UNO: BoardLayout = {
  name: "Arduino Uno",
  w: 302, h: 214, ox: UX, oy: UY, scale: 2.2,
  pins: [
    ...header("top", UX + 74, UY + 10, [
      ["SCL", 19, { alias: true }], ["SDA", 18, { alias: true }], "AREF", "GND",
      ["13", 13], ["12", 12], ["~11", 11], ["~10", 10], ["~9", 9], ["8", 8],
    ]),
    ...header("top", UX + 180, UY + 10, [
      ["7", 7], ["~6", 6], ["~5", 5], ["4", 4], ["~3", 3], ["2", 2], ["TX1", 1], ["RX0", 0],
    ]),
    // First hole of the power header is not connected and has no label.
    ...header("bottom", UX + 110, UY + 200, ["", "IOREF", "RESET", "3.3V", "5V", "GND", "GND", "Vin"]),
    ...header("bottom", UX + 200, UY + 200, [
      ["A0", 14, AN], ["A1", 15, AN], ["A2", 16, AN], ["A3", 17, AN], ["A4", 18, AN], ["A5", 19, AN],
    ]),
  ],
};

// ─── ESP32-DevKitC V4 (38 pins, ESP32-WROOM-32) ───────────────────────────────
// Antenna at the top, micro-USB at the bottom, 19 pins per side. ADC1 pins
// (32-39) are the ones analog blocks can use; 34-39 are input only.
const EX = 3;
const EY = 3;
const AI: PinFlags = { analog: true, inputOnly: true };

export const ESP32: BoardLayout = {
  name: "ESP32 DevKit",
  w: 116, h: 222, ox: EX, oy: EY, scale: 2.6,
  pins: [
    ...header("left", EX + 5, EY + 17, [
      "3V3", "EN", ["VP", 36, AI], ["VN", 39, AI], ["34", 34, AI], ["35", 35, AI], ["32", 32, AN], ["33", 33, AN],
      ["25", 25], ["26", 26], ["27", 27], ["14", 14], ["12", 12], "GND", ["13", 13], "SD2", "SD3", "CMD", "5V",
    ]),
    ...header("right", EX + 105, EY + 17, [
      "GND", ["23", 23], ["22", 22], ["TX", 1], ["RX", 3], ["21", 21], "GND", ["19", 19], ["18", 18], ["5", 5],
      ["17", 17], ["16", 16], ["4", 4], ["0", 0], ["2", 2], ["15", 15], "SD1", "SD0", "CLK",
    ]),
  ],
};

/** Boards drawn as SVG with per-pin anchors. Anything else uses the Kokoon ports. */
export const BOARD_LAYOUTS: Partial<Record<BoardId, BoardLayout>> = { arduino_uno: UNO, esp32: ESP32 };

/** The anchor a wire to this GPIO lands on (A4/A5 on the Uno, not the SDA/SCL copies). */
export const pinForGpio = (layout: BoardLayout, gpio: number) => layout.pins.find((p) => p.id === `pin:${gpio}`);

/** Tooltip text for an anchor. */
export function pinTitle(pin: BoardPin): string {
  const name = pin.label === String(pin.gpio) ? `GPIO ${pin.gpio}` : `${pin.label} (GPIO ${pin.gpio})`;
  return name + (pin.inputOnly ? ", input only" : "") + (pin.analog ? ", analog" : "");
}

// ─── Which pins a block uses ──────────────────────────────────────────────────

/** io = must be able to drive the line, in = any pin, analog = needs an ADC pin. */
type PinKind = "io" | "in" | "analog";

type Rule =
  | { bus: "i2c" | "servo" }
  /** [field on the logic node, default pin role from blockDefaults, kind] */
  | { pins: [key: string, role: PinRole, kind: PinKind][] };

const one = (role: PinRole, kind: PinKind = "in"): Rule => ({ pins: [["pin", role, kind]] });
const ULTRASONIC: Rule = { pins: [["trigPin", "trig", "io"], ["echoPin", "echo", "in"]] };

/** Block type → pins. Roles match what the code generators fall back to. */
export const PIN_WIRING: Record<string, Rule> = {
  led: one("led", "io"),
  relay: one("relay", "io"),
  buzzer_tone: one("buzzer", "io"),
  dht11: one("dht", "io"), // one-wire data line, driven both ways
  push_button: one("read"),
  button_digital_input: one("button"),
  ir_sensor: one("ir"),
  touch_sensor: one("touch"),
  pir_motion: one("pir"),
  sound_sensor: one("sound"),
  analog_sensor: one("analog", "analog"),
  adc: one("analog", "analog"),
  ldr_sensor: one("analog", "analog"),
  gas_sensor: one("analog", "analog"),
  rain_sensor: one("analog", "analog"),
  water_level: one("analog", "analog"),
  soil_moisture: one("soil", "analog"),
  ultrasonic: ULTRASONIC,
  ultrasonic_sensor: ULTRASONIC,
  servo_motor: { bus: "servo" },
  oled_display: { bus: "i2c" },
  lcd_16x2: { bus: "i2c" },
  imu_sensor: { bus: "i2c" },
  rtc_time: { bus: "i2c" },
};

export interface Wire {
  /** Field on the logic node that holds this pin, or null when the board fixes it. */
  key: string | null;
  /** Role shown in the anchor tooltip: TRIG, ECHO, SDA, SCL, S1... */
  label: string;
  gpio: number;
  kind: PinKind;
}

/** The pins a block uses on a board: its explicit pin, else the default the block itself uses. */
export function wiresFor(nodeType: string, data: Record<string, unknown>, board: BoardProfile): Wire[] {
  const rule = PIN_WIRING[nodeType];
  if (!rule) return [];
  if ("bus" in rule) {
    if (rule.bus === "i2c") {
      // Arduino's Wire library fixes the bus pins; MicroPython blocks may carry their own.
      const pick = (v: unknown, fallback: number) =>
        board.runtime === "arduino" || v === undefined || v === null || v === "" ? fallback : Number(v);
      return [
        { key: null, label: "SDA", gpio: pick(data.sda, board.i2c.sda), kind: "io" },
        { key: null, label: "SCL", gpio: pick(data.scl ?? data.sck, board.i2c.scl), kind: "io" },
      ];
    }
    const port = typeof data.servoPort === "string" && data.servoPort in board.servoPins ? data.servoPort : "S1";
    return [{ key: "servoPort", label: port, gpio: board.servoPins[port], kind: "io" }];
  }
  const P = pinDefaults(board.id);
  // The sound sensor's AO output is read like any other analog sensor.
  const analogMode = nodeType === "sound_sensor" && data.mode === "analog";
  return rule.pins.map(([key, role, kind]) => {
    const v = data[key];
    return {
      key,
      label: key === "pin" ? "" : key.replace("Pin", "").toUpperCase(),
      gpio: v === undefined || v === null || v === "" ? (analogMode ? P.analog : P[role]) : Number(v),
      kind: analogMode ? "analog" : kind,
    };
  });
}

/**
 * Logic-node data for a part the student just wired to `pin`, or a sentence
 * saying why that pin cannot take it. Bus parts ignore the pin they were
 * dropped on: I2C always lands on SDA/SCL, a servo on a servo port.
 */
export function dataForPin(
  nodeType: string, pin: BoardPin, board: BoardProfile, usedGpios: Set<number>,
): Record<string, unknown> | string {
  const rule = PIN_WIRING[nodeType];
  if (!rule) return `is not available on the ${board.label}`;
  if ("bus" in rule) {
    // Written into the block so its code uses the bus the wires show ("sck" is the OLED block's name for SCL).
    if (rule.bus === "i2c") return { sda: board.i2c.sda, scl: board.i2c.scl, sck: board.i2c.scl };
    const ports = Object.keys(board.servoPins);
    const port = ports.find((p) => board.servoPins[p] === pin.gpio)
      ?? ports.find((p) => !usedGpios.has(board.servoPins[p]))
      ?? "S1";
    return { servoPort: port };
  }
  const [first, ...rest] = wiresFor(nodeType, {}, board);
  if (first.kind === "analog" && !pin.analog) return "needs an analog pin";
  if (first.kind === "io" && pin.inputOnly) return "cannot use an input-only pin";
  const data: Record<string, unknown> = { [first.key as string]: pin.gpio };
  // Other pins keep their defaults; one that collides with the chosen pin takes the first pin's default.
  for (const w of rest) if (w.gpio === pin.gpio) data[w.key as string] = first.gpio;
  return data;
}

/**
 * Self-check: every pin the editor can hand out (valid pins, servo ports, I2C,
 * block defaults) has an anchor, so no wire can end in empty space.
 * Returns the problems found; empty means the tables are consistent.
 */
export function checkBoardPins(): string[] {
  const problems: string[] = [];
  for (const [id, layout] of Object.entries(BOARD_LAYOUTS) as [BoardId, BoardLayout][]) {
    const board = BOARDS[id];
    const need = (gpio: number, why: string) => {
      if (!pinForGpio(layout, gpio)) problems.push(`${id}: no anchor for GPIO ${gpio} (${why})`);
    };
    board.validPins?.forEach((g) => need(g, "validPins"));
    Object.entries(board.servoPins).forEach(([port, g]) => need(g, `servo ${port}`));
    need(board.i2c.sda, "I2C SDA");
    need(board.i2c.scl, "I2C SCL");
    Object.entries(pinDefaults(id)).forEach(([role, g]) => need(g, `default ${role}`));
    const ids = layout.pins.map((p) => p.id);
    if (new Set(ids).size !== ids.length) problems.push(`${id}: duplicate pin ids`);
    for (const p of layout.pins) {
      if (p.gpio !== undefined && board.validPins && !board.validPins.includes(p.gpio)) {
        problems.push(`${id}: anchor ${p.label} is GPIO ${p.gpio}, which is not a valid pin`);
      }
      if (p.x < 0 || p.x > layout.w || p.y < 0 || p.y > layout.h) problems.push(`${id}: ${p.label} is outside the board`);
    }
  }
  return problems;
}

if (import.meta.env.DEV) checkBoardPins().forEach((p) => console.error("[boardPins]", p));
