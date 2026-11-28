import { useState } from "react";
import { Choice, Frame, Readouts, Slider, si } from "./kit";

type Board = "uno" | "esp32";
type Mode = "fixed" | "ldr-top" | "ldr-bottom";
const BOARD = { uno: { vref: 5, steps: 1024, name: "Arduino Uno" }, esp32: { vref: 3.3, steps: 4096, name: "ESP32" } };

/** Divider output. R1 goes to the supply, R2 to ground. */
// eslint-disable-next-line react-refresh/only-export-components -- pure maths exported for a self-check
export const divider = (vin: number, r1: number, r2: number) => vin * r2 / (r1 + r2);

/** The number an ideal ADC reports: rounds down, stops at the top step. */
// eslint-disable-next-line react-refresh/only-export-components -- pure maths exported for a self-check
export function adcReading(v: number, vref: number, steps: number) {
  return Math.min(steps - 1, Math.max(0, Math.floor(v * steps / vref + 1e-9)));
}

/** Typical LDR: about 100 kΩ in the dark (light 0) to 1 kΩ in bright light (light 100), on a log scale. */
// eslint-disable-next-line react-refresh/only-export-components -- pure maths exported for a self-check
export const ldrOhms = (light: number) => 100_000 * 0.01 ** (light / 100);

// E12 values from 100 Ω to 1 MΩ, so the sliders land on parts you can buy.
const E12 = [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82];
const STD = Array.from({ length: 49 }, (_, i) => +(E12[i % 12] * 10 ** (1 + Math.floor(i / 12))).toPrecision(2));
const TEN_K = STD.indexOf(10_000);

/** Voltage divider into an ADC, with an optional LDR. Used in b5. */
export default function DividerAdc() {
  const [board, setBoard] = useState<Board>("uno");
  const [mode, setMode] = useState<Mode>("fixed");
  const [vin, setVin] = useState(5);
  const [i1, setI1] = useState(TEN_K);
  const [i2, setI2] = useState(TEN_K);
  const [light, setLight] = useState(50);
  const { vref, steps, name } = BOARD[board];
  const ldr = ldrOhms(light);
  const r1 = mode === "ldr-top" ? ldr : STD[i1];
  const r2 = mode === "ldr-bottom" ? ldr : STD[i2];
  const vout = divider(vin, r1, r2);
  const reading = adcReading(vout, vref, steps);
  const over = vout > vref + 1e-9;
  const pick = (b: Board) => { setBoard(b); setVin(BOARD[b].vref); };
  return (
    <Frame title="Voltage divider into the ADC"
      note="Start with two equal 10 kΩ resistors: Vout is half of Vin and the Uno reads 512. Then pick an LDR and slide the light from dark to bright, and see which way the reading moves for each arrangement.">
      <div className="space-y-3">
        <Choice label="Board" value={board} onChange={pick} options={[
          { value: "uno", label: "Arduino Uno (5 V, 10-bit)" }, { value: "esp32", label: "ESP32 (3.3 V, 12-bit)" },
        ]} />
        <Choice label="Circuit" value={mode} onChange={setMode} options={[
          { value: "fixed", label: "Two resistors" }, { value: "ldr-top", label: "LDR to supply" }, { value: "ldr-bottom", label: "LDR to ground" },
        ]} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Slider label="Vin" value={vin} min={0} max={12} step={0.1} onChange={setVin} format={(v) => `${v.toFixed(1)} V`} />
        {mode === "ldr-top"
          ? <Slider label="Light on the LDR (R1)" value={light} min={0} max={100} onChange={setLight} format={(v) => `${v}%, LDR ${si(ldr, "Ω")}`} />
          : <Slider label="R1 (to supply)" value={i1} min={0} max={STD.length - 1} onChange={setI1} format={() => si(STD[i1], "Ω")} />}
        {mode === "ldr-bottom"
          ? <Slider label="Light on the LDR (R2)" value={light} min={0} max={100} onChange={setLight} format={(v) => `${v}%, LDR ${si(ldr, "Ω")}`} />
          : <Slider label="R2 (to ground)" value={i2} min={0} max={STD.length - 1} onChange={setI2} format={() => si(STD[i2], "Ω")} />}
      </div>
      {mode !== "fixed" && <p className="text-[13px] text-sub">The LDR here goes from a typical 100 kΩ in the dark to 1 kΩ in bright light. Real ones vary a lot.</p>}
      <Readouts items={[
        { label: "Vout = Vin × R2 / (R1 + R2)", value: `${vout.toFixed(2)} V`, tone: over ? "bad" : undefined },
        { label: `${name} reading (0 to ${steps - 1})`, value: String(reading), tone: over ? "bad" : undefined },
        { label: "One step is", value: si(vref / steps, "V", 2) },
      ]} />
      {over && (
        <p role="status" className="rounded-md border border-[var(--k-error)] px-3 py-2 text-[13px]">
          <strong>Danger: </strong>Vout is above {vref} V. The reading just sticks at {steps - 1}, and on a real {name} a voltage over {vref} V can damage the pin. Lower Vin or make R2 smaller than R1.
        </p>
      )}
    </Frame>
  );
}
