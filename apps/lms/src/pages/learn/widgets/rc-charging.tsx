import { useState } from "react";
import { Frame, Plot, Readouts, Slider, si } from "./kit";

/** RC step response: charge and discharge curves with τ = RC marked. Used in i1. */
export default function RcCharging() {
  const [r, setR] = useState(10_000);   // Ω
  const [c, setC] = useState(100e-6);   // F
  const [vs, setVs] = useState(5);      // V
  const tau = r * c;
  const tEnd = 5;                       // fixed 5 s window so the axis stays still
  const n = 200;
  const charge: [number, number][] = [], discharge: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = (tEnd * i) / n;
    charge.push([t, vs * (1 - Math.exp(-t / tau))]);
    discharge.push([t, vs * Math.exp(-t / tau)]);
  }
  const at = (k: number) => vs * (1 - Math.exp(-k));
  return (
    <Frame title="RC charging and discharging"
      note="After one time constant the capacitor has covered 63% of the way; after five it is within 1%. Try making R ten times bigger and watch τ grow ten times.">
      <div className="grid gap-4 sm:grid-cols-3">
        <Slider label="R" value={Math.log10(r)} min={2} max={6} step={0.05} onChange={(v) => setR(Math.round(10 ** v))} format={() => si(r, "Ω")} />
        <Slider label="C" value={Math.log10(c)} min={-7} max={-3} step={0.05} onChange={(v) => setC(10 ** v)} format={() => si(c, "F")} />
        <Slider label="Supply" value={vs} min={1} max={12} step={0.1} onChange={setVs} format={(v) => `${v.toFixed(1)} V`} />
      </div>
      <Plot x={[0, tEnd]} y={[0, 12]} xLabel="time (s)" yLabel="capacitor voltage (V)"
        series={[{ label: "charging", points: charge }, { label: "discharging", points: discharge, dashed: true }]}
        markers={tau <= tEnd ? [{ x: tau, label: "τ" }] : []} />
      <Readouts items={[
        { label: "τ = R × C", value: si(tau, "s") },
        { label: "V after 1τ (63.2%)", value: `${at(1).toFixed(2)} V` },
        { label: "Time to within 1% (≈ 5τ)", value: si(5 * tau, "s"), tone: 5 * tau > tEnd ? "warn" : undefined },
      ]} />
    </Frame>
  );
}
