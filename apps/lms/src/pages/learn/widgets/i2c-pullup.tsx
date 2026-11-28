import { useState } from "react";
import { Choice, Frame, Plot, Readouts, Slider, si } from "./kit";

/** I2C pull-up window: Rp(min) from sink current, Rp(max) from rise time (NXP UM10204). Used in i7. */

type Mode = "sm" | "fm" | "fmp";
const MODES: Record<Mode, { label: string; tr: number; iol: number; cbMax: number }> = {
  sm: { label: "Standard 100k", tr: 1000e-9, iol: 3, cbMax: 400e-12 },
  fm: { label: "Fast 400k", tr: 300e-9, iol: 3, cbMax: 400e-12 },
  fmp: { label: "Fast-plus 1M", tr: 120e-9, iol: 20, cbMax: 550e-12 },
};

/** VOL(max) from UM10204: 0.4 V above 2 V supply, 0.2 VDD at or below. */
// eslint-disable-next-line react-refresh/only-export-components -- pure maths exported for a self-check
export const volMax = (vdd: number) => (vdd > 2 ? 0.4 : 0.2 * vdd);
// eslint-disable-next-line react-refresh/only-export-components -- pure maths exported for a self-check
export const rpMin = (vdd: number, iol: number) => (vdd - volMax(vdd)) / iol;
// eslint-disable-next-line react-refresh/only-export-components -- pure maths exported for a self-check
export const rpMax = (tr: number, cb: number) => tr / (0.8473 * cb);
// eslint-disable-next-line react-refresh/only-export-components -- pure maths exported for a self-check
export const riseTime = (rp: number, cb: number) => 0.8473 * rp * cb;

export default function I2cPullup() {
  const [vdd, setVdd] = useState(3.3);
  const [cbPf, setCbPf] = useState(100);
  const [mode, setMode] = useState<Mode>("fm");
  const [iolMa, setIolMa] = useState(3);
  const [rp, setRp] = useState(2200);
  const m = MODES[mode], cb = cbPf * 1e-12, iol = iolMa / 1000;
  const lo = rpMin(vdd, iol), hi = rpMax(m.tr, cb), tr = riseTime(rp, cb);
  const sink = (vdd - volMax(vdd)) / rp;
  const ok = lo <= hi;

  // edge starts when the last device releases the line; time axis fixed per speed mode
  const tEnd = 3 * m.tr * 1e9, n = 200;
  const edge = (r: number) => Array.from({ length: n + 1 }, (_, i): [number, number] => {
    const t = (tEnd * i) / n;
    return [t, vdd * (1 - Math.exp(-(t * 1e-9) / (r * cb)))];
  });
  const t30 = rp * cb * Math.log(1 / 0.7) * 1e9;

  return (
    <Frame title="I2C pull-up resistor window"
      note="The defaults are the lesson's worked example: 3.3 V, 100 pF, fast mode. Raise the bus capacitance to 250 pF and watch 2.2 kΩ fail the rise-time limit, then try 100 kHz instead.">
      <Choice label="Speed" value={mode} onChange={(v) => { setMode(v); setIolMa(MODES[v].iol); }}
        options={(Object.keys(MODES) as Mode[]).map((k) => ({ value: k, label: MODES[k].label }))} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Slider label="Supply VDD" value={vdd} min={1.8} max={5} step={0.1} onChange={setVdd} format={(v) => `${v.toFixed(1)} V`} />
        <Slider label="Bus capacitance Cb" value={cbPf} min={10} max={600} step={5} onChange={setCbPf} format={(v) => `${v} pF`} />
        <Slider label="Sink current IOL" value={iolMa} min={1} max={20} step={0.5} onChange={setIolMa} format={(v) => `${v} mA`} />
        <Slider label="Chosen Rp" value={Math.log10(rp)} min={2.5} max={4.5} step={0.01}
          onChange={(v) => setRp(Math.round(10 ** v / 10) * 10)} format={() => si(rp, "Ω")} />
      </div>
      <Plot x={[0, tEnd]} y={[0, 5.5]} xLabel="time after release (ns)" yLabel="SDA / SCL voltage (V)"
        series={[{ label: `Rp = ${si(rp, "Ω")}`, points: edge(rp) }, ...(hi > 0 ? [{ label: `Rp(max) = ${si(hi, "Ω")}`, points: edge(hi), dashed: true }] : [])]}
        markers={[
          { y: 0.3 * vdd, label: "VIL 0.3 VDD" },
          { y: 0.7 * vdd, label: "VIH 0.7 VDD" },
          ...(t30 + m.tr * 1e9 <= tEnd ? [{ x: t30 + m.tr * 1e9, label: "limit" }] : []),
        ]} />
      <Readouts items={[
        { label: "Rp(min) = (VDD - VOL) / IOL", value: si(lo, "Ω") },
        { label: "Rp(max) = tr / (0.8473 Cb)", value: si(hi, "Ω") },
        { label: "Allowed range", value: ok ? `${si(lo, "Ω")} to ${si(hi, "Ω")}` : "none: lower Cb or speed", tone: ok ? "ok" : "bad" },
        { label: `Rise time (limit ${si(m.tr, "s")})`, value: si(tr, "s"), tone: tr <= m.tr ? "ok" : "bad" },
        { label: `Sink current needed (max ${iolMa} mA)`, value: si(sink, "A"), tone: sink <= iol ? "ok" : "bad" },
        { label: `Cb vs spec max ${si(m.cbMax, "F")}`, value: cb <= m.cbMax ? "within" : "over", tone: cb <= m.cbMax ? undefined : "warn" },
      ]} />
    </Frame>
  );
}
