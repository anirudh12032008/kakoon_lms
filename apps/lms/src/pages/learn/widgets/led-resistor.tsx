import { useState } from "react";
import { Choice, Frame, Readouts, Slider, si } from "./kit";

const E12 = [10, 12, 15, 18, 22, 27, 33, 39, 47, 56, 68, 82];

/** Smallest E12 standard value at or above r (ohms). */
// eslint-disable-next-line react-refresh/only-export-components -- pure maths exported for a self-check
export function e12AtOrAbove(r: number): number {
  for (let k = -1; k <= 7; k++) {
    for (const m of E12) {
      const v = m * 10 ** k;
      if (v >= r * (1 - 1e-9)) return +v.toPrecision(2);
    }
  }
  return 10e7;
}

/** LED series resistor for supply vs, forward voltage vf, target current i (amps). Null when the LED cannot light. */
// eslint-disable-next-line react-refresh/only-export-components -- pure maths exported for a self-check
export function ledResistor(vs: number, vf: number, i: number) {
  const drop = vs - vf;
  if (drop <= 0) return null;
  const exact = drop / i;
  const std = e12AtOrAbove(exact);
  const actual = drop / std;
  return { drop, exact, std, actual, power: drop * actual };
}

type Supply = "3.3" | "5" | "9";
type Led = "red" | "yellow" | "green" | "bgreen" | "blue" | "white";
const VF: Record<Led, number> = { red: 2.0, yellow: 2.1, green: 2.2, bgreen: 3.0, blue: 3.0, white: 3.0 };

/** LED resistor calculator with the nearest standard value. Used in b2. */
export default function LedResistor() {
  const [supply, setSupply] = useState<Supply>("5");
  const [led, setLed] = useState<Led>("red");
  const [ma, setMa] = useState(10);
  const vs = Number(supply), vf = VF[led];
  const r = ledResistor(vs, vf, ma / 1000);
  const warnings: string[] = [];
  if (!r) warnings.push(`The LED needs about ${vf} V but the supply is only ${vs} V. It will not light, whatever resistor you use.`);
  else {
    if (r.drop < 0.5) warnings.push("Very little voltage is left for the resistor, so the LED will be dim and its brightness will vary a lot from one LED to the next.");
    if (ma > 20 || r.actual > 0.02) warnings.push("Over 20 mA is more than one board pin should give. Aim for about 10 mA or less.");
    if (r.power > 0.25) warnings.push("The resistor would turn more than 0.25 W into heat, more than a small kit resistor is rated for.");
  }
  return (
    <Frame title="LED resistor calculator"
      note="The defaults are the lesson's 5 V example: 300 Ω exactly, so you pick 330 Ω. Now switch to 3.3 V and set 6 mA to see why 220 Ω works there, then try a blue LED on 3.3 V.">
      <div className="space-y-3">
        <Choice label="Supply" value={supply} onChange={setSupply} options={[
          { value: "3.3", label: "3.3 V (ESP32)" }, { value: "5", label: "5 V (Uno)" }, { value: "9", label: "9 V battery" },
        ]} />
        <Choice label="LED colour" value={led} onChange={setLed} options={[
          { value: "red", label: "Red 2.0 V" }, { value: "yellow", label: "Yellow 2.1 V" }, { value: "green", label: "Green (older type) 2.2 V" },
          { value: "bgreen", label: "Bright green 3.0 V" }, { value: "blue", label: "Blue 3.0 V" }, { value: "white", label: "White 3.0 V" },
        ]} />
        <Slider label="Current you want" value={ma} min={1} max={30} step={1} onChange={setMa} format={(v) => `${v} mA`} />
      </div>
      <p className="text-[13px] text-sub">Forward voltages are typical figures. Check your LED's datasheet if you have it.</p>
      <Readouts items={r ? [
        { label: "Voltage left for the resistor", value: `${r.drop.toFixed(1)} V` },
        { label: "Exact R = V / I", value: si(r.exact, "Ω") },
        { label: "Standard value (next one up)", value: si(r.std, "Ω") },
        { label: "Current with that value", value: `${(r.actual * 1000).toFixed(1)} mA`, tone: r.actual > 0.02 ? "bad" : "ok" },
        { label: "Heat in the resistor", value: `${r.power.toFixed(3)} W`, tone: r.power > 0.25 ? "bad" : r.power > 0.125 ? "warn" : "ok" },
      ] : [{ label: "Resistor", value: "n/a", tone: "bad" }]} />
      {warnings.map((w) => (
        <p key={w} role="status" className="rounded-md border border-[var(--k-warning)] px-3 py-2 text-[13px]"><strong>Warning: </strong>{w}</p>
      ))}
    </Frame>
  );
}
