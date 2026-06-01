/**
 * Lightweight reactive store for live sensor readings piped from the ESP32
 * serial stream. Written by useSerial's read loop, read by node components.
 *
 * Format parsed: "SENSOR,<type>,<label>,<value>"
 *   type  — "digital" | "analog" | "angle" | "raw"
 *   label — matches the variable name used in the node (e.g. "motion")
 *   value — numeric
 */

import { create } from "zustand";

export interface SensorReading {
  value: number;
  type: string;
  ts: number; // Date.now() — used to detect stale data
}

interface SensorStore {
  readings: Record<string, SensorReading>;
  pushReading: (label: string, type: string, value: number) => void;
  clear: () => void;
}

export const useSensorStore = create<SensorStore>((set) => ({
  readings: {},
  pushReading: (label, type, value) =>
    set((s) => ({
      readings: {
        ...s.readings,
        [label]: { value, type, ts: Date.now() },
      },
    })),
  clear: () => set({ readings: {} }),
}));

/** Parse a raw serial line. Returns true if the line was a SENSOR packet. */
export function tryParseSensorLine(line: string): boolean {
  if (!line.startsWith("SENSOR,")) return false;
  const parts = line.split(",");
  if (parts.length < 4) return false;
  const [, type, label, rawVal] = parts;
  const value = parseFloat(rawVal);
  if (isNaN(value)) return false;
  useSensorStore.getState().pushReading(label.trim(), type.trim(), value);
  return true;
}
