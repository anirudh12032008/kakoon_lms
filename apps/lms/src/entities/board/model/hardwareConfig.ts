/**
 * Kokoon ESP32-S3 Board — Single source of truth for all GPIO pin assignments.
 *
 * Derived from the official board test script (board_test.py).
 * Every node, codegen case, and UI component must import from here.
 * Never hardcode GPIO numbers anywhere else.
 *
 * Board: Kokoon ESP32-S3 custom PCB
 * Firmware: MicroPython 1.23+
 */

// ── Display ───────────────────────────────────────────────────────────────────
export const OLED = {
  scl: 36,
  sda: 35,
  width: 128,
  height: 64,
} as const;

// ── Onboard NeoPixel ring ─────────────────────────────────────────────────────
export const NEOPIXEL = {
  pin: 48,
  count: 8,
} as const;

// ── Onboard IMU (LSM6DS3TR-C) — fixed I2C bus ────────────────────────────────
export const ONBOARD_IMU = {
  scl: 42,
  sda: 41,
  address: "0x6A",
} as const;

// ── Sensor Ports — I2C (SCL/SDA) and digital/ultrasonic (TRIG/ECHO) ──────────
// Same GPIO pair serves as I2C bus for I2C modules and TRIG/ECHO for ultrasonic.
export const SENSOR_PORTS = {
  "1": { scl: 4,  sda: 5,  trig: 4,  echo: 5 },
  "2": { scl: 1,  sda: 2,  trig: 1,  echo: 2 },
} as const;

export type SensorPortId = keyof typeof SENSOR_PORTS;

// ── Fixed digital sensors (dedicated GPIO lines on the PCB) ──────────────────
export const PIR_SENSOR = { pin: 3  } as const;
export const IR_SENSOR  = { pin: 6  } as const;

// ── SPI bus 1 (shared by RFID and MAX7219 matrix) ────────────────────────────
export const SPI1 = {
  sck:  11,
  mosi: 10,
  miso: 12,
} as const;

// ── RFID (MFRC522 via SPI bus 1) ─────────────────────────────────────────────
export const RFID = {
  ...SPI1,
  cs:   13,
  rst:  9,
  irq:  8,
} as const;

// ── MAX7219 LED matrix (SPI bus 1) ───────────────────────────────────────────
export const MATRIX = {
  ...SPI1,
  cs:       13,
  baudrate: 10_000_000,
} as const;

// ── Servos ────────────────────────────────────────────────────────────────────
// Pulse range: 600–2400 µs @ 50 Hz.  S4 is physically limited by the bracket.
export const SERVO_PORTS = {
  S1: { pin: 21, minAngle: 0,  maxAngle: 180 },
  S2: { pin: 47, minAngle: 0,  maxAngle: 180 },
  S3: { pin: 39, minAngle: 0,  maxAngle: 180 },
  S4: { pin: 40, minAngle: 10, maxAngle: 170 },
} as const;

export type ServoPortId = keyof typeof SERVO_PORTS;
export const SERVO_PORT_ORDER: ServoPortId[] = ["S1", "S2", "S3", "S4"];

// ── Servo models ──────────────────────────────────────────────────────────────
// Each physical servo model has its own pulse range for full travel.
export const SERVO_MODELS = {
  mg90s: { label: "MG90S", pulseMin: 500, pulseMax: 2400 },
  mg995: { label: "MG995", pulseMin: 500, pulseMax: 2500 },
} as const;
export type ServoModelId = keyof typeof SERVO_MODELS;
export const SERVO_MODEL_ORDER: ServoModelId[] = ["mg90s", "mg995"];

// Servo travel type. 180° = positional (angle control),
// 360° = continuous rotation (pulse controls speed, not position).
export type ServoType = "180" | "360";

// ── Motors (DRV8833 dual H-bridge, one chip per axle) ────────────────────────
// Each motor: { pwm, dir } — PWM controls speed, DIR controls direction.
// front.a = front-right (FR), front.b = front-left (FL)
// rear.a  = rear-right  (RR), rear.b  = rear-left  (RL)
export const MOTORS = {
  frontRight: { pwm: 45, dir: 46 },   // front DRV8833 — channel A
  frontLeft:  { pwm: 15, dir: 16 },   // front DRV8833 — channel B
  rearRight:  { pwm: 17, dir: 18 },   // rear  DRV8833 — channel A
  rearLeft:   { pwm: 37, dir: 38 },   // rear  DRV8833 — channel B
} as const;

export type MotorId = keyof typeof MOTORS;

// ── Convenience re-export of the full board map ───────────────────────────────
export const BOARD = {
  oled:        OLED,
  neopixel:    NEOPIXEL,
  imu:         ONBOARD_IMU,
  sensorPorts: SENSOR_PORTS,
  pir:         PIR_SENSOR,
  ir:          IR_SENSOR,
  spi1:        SPI1,
  rfid:        RFID,
  matrix:      MATRIX,
  servos:      SERVO_PORTS,
  motors:      MOTORS,
} as const;
