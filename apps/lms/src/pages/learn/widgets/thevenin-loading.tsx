import { useState } from "react";
import { Frame, Plot, Readouts, Slider, si } from "./kit";

/** Thevenin source V_th behind R_th driving R_L: load voltage, current, load power and the matched maximum. */
// eslint-disable-next-line react-refresh/only-export-components -- pure maths exported for a self-check
export function theveninLoad(vth: number, rth: number, rl: number) {
  const i = vth / (rth + rl);
  return { v: i * rl, i, p: i * i * rl, pmax: (vth * vth) / (4 * rth) };
}

const RL: [number, number] = [10, 1e7];

/** Loading of a Thevenin source, with maximum power at R_L = R_th. Used in i1. */
export default function TheveninLoading() {
  const [vth, setVth] = useState(1.65); // V
  const [rth, setRth] = useState(5000); // Ω
  const [rl, setRl] = useState(50_000); // Ω
  const r = theveninLoad(vth, rth, rl);
  const vFrac: [number, number][] = [], pFrac: [number, number][] = [];
  for (let k = 0; k <= 240; k++) {
    const x = 10 ** (1 + (6 * k) / 240);
    const q = theveninLoad(vth, rth, x);
    vFrac.push([x, q.v / vth]);
    pFrac.push([x, q.p / q.pmax]);
  }
  const err = 1 - r.v / vth;
  return (
    <Frame title="Thevenin source and its load"
      note="The defaults are the 10 kΩ + 10 kΩ divider (1.65 V behind 5 kΩ) with a 50 kΩ load: 1.50 V, 9.1% low. Push R_L to 500 kΩ for about 1% error, then bring it down to 5 kΩ to find the power peak.">
      <div className="grid gap-4 sm:grid-cols-3">
        <Slider label="V_th" value={vth} min={0.5} max={12} step={0.05} onChange={setVth} format={(v) => `${v.toFixed(2)} V`} />
        <Slider label="R_th" value={Math.log10(rth)} min={0} max={5} step={0.05} onChange={(v) => setRth(Math.round(10 ** v))} format={() => si(rth, "Ω")} />
        <Slider label="R_L" value={Math.log10(rl)} min={1} max={7} step={0.05} onChange={(v) => setRl(Math.round(10 ** v))} format={() => si(rl, "Ω")} />
      </div>
      <Readouts items={[
        { label: "V_load", value: si(r.v, "V") },
        { label: "Current", value: si(r.i, "A") },
        { label: "Power in load", value: si(r.p, "W") },
        { label: "R_L / R_th", value: (rl / rth).toPrecision(3) },
        { label: "Loading error", value: `${(err * 100).toFixed(1)}%`, tone: err > 0.1 ? "bad" : err > 0.01 ? "warn" : "ok" },
        { label: "P_max = V_th² / 4R_th", value: si(r.pmax, "W") },
      ]} />
      <Plot logX x={RL} y={[0, 1.05]} xLabel="R_L (Ω)" yLabel="fraction" height={220}
        series={[{ label: "V_load / V_th", points: vFrac }, { label: "P_load / P_max", points: pFrac, dashed: true }]}
        markers={[{ x: rth, label: "R_L = R_th" }, { x: rl, label: "R_L" }]} />
    </Frame>
  );
}
