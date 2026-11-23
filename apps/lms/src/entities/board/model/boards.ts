import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SERVO_PORTS, OLED } from "./hardwareConfig";

/**
 * Board registry. The editor supports more than one board; everything that
 * differs between them (language, pins, firmware) lives in a profile here.
 * hardwareConfig.ts stays the pin map of the Kokoon PCB.
 */
export type BoardId = "esp32" | "arduino_uno" | "kokoon";
export type BoardRuntime = "micropython" | "arduino";

export interface BoardProfile {
  id: BoardId;
  label: string;
  chip: string;
  runtime: BoardRuntime;
  /** Servo ports S1..S4 → GPIO */
  servoPins: Record<string, number>;
  /** Default I2C bus (OLED / LCD) */
  i2c: { scl: number; sda: number };
  /** Kokoon PCB has an onboard NeoPixel ring that must be cleared at boot. */
  onboardNeoPixel: boolean;
  /** Usable GPIO numbers; pins outside this list get a warning in the code. */
  validPins?: number[];
  /** Resolution of the value analog blocks produce on this board. */
  adcMax: number;
  /** MicroPython image for the firmware flasher (micropython boards only). */
  firmware?: { url: string; address: number; version: string };
  /** arduino-cli board id + bootloader baud (arduino boards only). */
  arduino?: { fqbn: string; baud: number };
}

export const BOARDS: Record<BoardId, BoardProfile> = {
  esp32: {
    id: "esp32",
    label: "ESP32 DevKit",
    chip: "ESP32-WROOM-32",
    runtime: "micropython",
    servoPins: { S1: 13, S2: 12, S3: 14, S4: 27 },
    i2c: { scl: 22, sda: 21 },
    validPins: [0, 1, 2, 3, 4, 5, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33, 34, 35, 36, 39],
    onboardNeoPixel: false,
    adcMax: 4095,
    // Classic ESP32 images are flashed at 0x1000 (the S3 image goes at 0x0).
    firmware: { url: "/firmware/esp32-micropython.bin", address: 0x1000, version: "v1.25.0" },
  },
  arduino_uno: {
    id: "arduino_uno",
    label: "Arduino Uno",
    chip: "ATmega328P",
    runtime: "arduino",
    servoPins: { S1: 9, S2: 10, S3: 11, S4: 6 },
    i2c: { scl: 19, sda: 18 }, // A5 / A4 - fixed by the Wire library
    validPins: Array.from({ length: 20 }, (_, i) => i), // 0-13 digital, 14-19 = A0-A5
    onboardNeoPixel: false,
    adcMax: 1023,
    arduino: { fqbn: "arduino:avr:uno", baud: 115200 },
  },
  kokoon: {
    id: "kokoon",
    label: "Kokoon Board",
    chip: "ESP32-S3",
    runtime: "micropython",
    servoPins: Object.fromEntries(Object.entries(SERVO_PORTS).map(([k, v]) => [k, v.pin])),
    i2c: { scl: OLED.scl, sda: OLED.sda },
    onboardNeoPixel: true,
    adcMax: 4095,
    firmware: { url: "/firmware/esp32s3-micropython.bin", address: 0x0, version: "v1.25.0" },
  },
};

export const BOARD_ORDER: BoardId[] = ["esp32", "arduino_uno", "kokoon"];
export const DEFAULT_BOARD: BoardId = "esp32";

interface BoardStore {
  boardId: BoardId;
  setBoard: (id: BoardId) => void;
}

export const useBoardStore = create<BoardStore>()(
  persist(
    (set) => ({ boardId: DEFAULT_BOARD, setBoard: (boardId) => set({ boardId }) }),
    { name: "kokoon-editor-board" }
  )
);

/** Current board profile, for non-React code (codegen, upload). */
export function getBoard(): BoardProfile {
  return BOARDS[useBoardStore.getState().boardId] ?? BOARDS[DEFAULT_BOARD];
}

/** Current board profile as a hook. */
export function useBoard(): BoardProfile {
  return BOARDS[useBoardStore((s) => s.boardId)] ?? BOARDS[DEFAULT_BOARD];
}
