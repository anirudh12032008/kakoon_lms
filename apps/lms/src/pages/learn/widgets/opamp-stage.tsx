import { useState } from "react";
import { Choice, Frame, Plot, Readouts, Slider, si } from "./kit";

export type Mode = "inv" | "noninv" | "buffer" | "comp";
export type Supply = "3v3" | "5v" | "pm12";
export type Part = "rr" | "lm358";

const RAILS: Record<Supply, [number, number]> = { "3v3": [0, 3.3], "5v": [0, 5], pm12: [-12, 12] };

/** Reference on the unused input: mid-rail on a single supply, 0 V on a split supply. */
const vref = (s: Supply) => (RAILS[s][0] + RAILS[s][1]) / 2;

/** Output limits: MCP6002-style rail-to-rail within 25 mV; LM358 near the low rail, 1.5 V below the high rail. */
function outLimits(s: Supply, part: Part): [number, number] {
  const [lo, hi] = RAILS[s];
  return part === "rr" ? [lo + 0.025, hi - 0.025] : [lo + 0.02, hi - 1.5];
}

/** Ideal closed-loop gain (comparator has none). */
function idealGain(mode: Mode, rf: number, rg: number) {
  return mode === "inv" ? -rf / rg : mode === "noninv" ? 1 + rf / rg : mode === "buffer" ? 1 : NaN;
}

/** Output for an input vin, clipped to what the part can actually drive. */
// eslint-disable-next-line react-refresh/only-export-components -- pure maths exported for a self-check
export function opampOut(mode: Mode, vin: number, rf: number, rg: number, s: Supply, part: Part) {
  const [lo, hi] = outLimits(s, part);
  const ref = vref(s);
  const ideal = mode === "comp" ? (vin > ref ? hi : lo)
    : mode === "inv" ? ref - (rf / rg) * (vin - ref)
    : idealGain(mode, rf, rg) * vin;
  return { out: Math.min(hi, Math.max(lo, ideal)), ideal };
}

const T_END = 2; // ms, two cycles of a 1 kHz sine

/** Op-amp stage on a real supply, with the output clipped at the swing limits. Used in i2. */
export default function OpampStage() {
  const [mode, setMode] = useState<Mode>("noninv");
  const [rf, setRf] = useState(20_000);
  const [rg, setRg] = useState(1000);
  const [amp, setAmp] = useState(0.05);
  const [off, setOff] = useState(0.05);
  const [supply, setSupply] = useState<Supply>("3v3");
  const [part, setPart] = useState<Part>("lm358");
  const [lo, hi] = RAILS[supply];
  const [olo, ohi] = outLimits(supply, part);
  const vin: [number, number][] = [], vout: [number, number][] = [];
  let clipped = false;
  for (let i = 0; i <= 200; i++) {
    const t = (T_END * i) / 200;
    const v = off + amp * Math.sin(2 * Math.PI * t);
    const { out: o, ideal } = opampOut(mode, v, rf, rg, supply, part);
    // ignore the last few tens of mV at a rail (a 0 V input on a single supply), flag real flat tops
    if (mode !== "comp" && Math.abs(ideal - o) > 0.05) clipped = true;
    vin.push([t, v]);
    vout.push([t, o]);
  }
  const outs = vout.map((p) => p[1]);
  // Input common-mode range: LM358 from the low rail to 1.5 V below the high rail; rail-to-rail 0.3 V past each rail.
  const [cmLo, cmHi] = part === "rr" ? [lo - 0.3, hi + 0.3] : [lo, hi - 1.5];
  const inOk = off - amp >= cmLo && off + amp <= cmHi;
  const g = idealGain(mode, rf, rg);
  const rgName = mode === "inv" ? "R_in" : "R_g";
  const tooHigh = part === "rr" && supply === "pm12";
  return (
    <Frame title="Op-amp stage on a real supply"
      note="The defaults are the gain-of-21 stage with a 0 to 100 mV sensor: the ideal output reaches 2.1 V, but an LM358 on 3.3 V stops near 1.8 V. Switch to rail-to-rail and watch the flat top disappear.">
      <Choice label="Circuit" value={mode} onChange={setMode} options={[
        { value: "inv", label: "Inverting" }, { value: "noninv", label: "Non-inverting" },
        { value: "buffer", label: "Buffer" }, { value: "comp", label: "Comparator" }]} />
      <Choice label="Supply" value={supply} onChange={setSupply} options={[
        { value: "3v3", label: "3.3 V" }, { value: "5v", label: "5 V" }, { value: "pm12", label: "±12 V" }]} />
      <Choice label="Op-amp" value={part} onChange={setPart} options={[
        { value: "rr", label: "Rail-to-rail (MCP6002)" }, { value: "lm358", label: "LM358" }]} />
      <div className="grid gap-4 sm:grid-cols-2">
        {(mode === "inv" || mode === "noninv") && <>
          <Slider label={rgName} value={Math.log10(rg)} min={3} max={6} step={0.05} onChange={(v) => setRg(Math.round(10 ** v))} format={() => si(rg, "Ω")} />
          <Slider label="R_f" value={Math.log10(rf)} min={3} max={6} step={0.05} onChange={(v) => setRf(Math.round(10 ** v))} format={() => si(rf, "Ω")} />
        </>}
        <Slider label="Input amplitude (peak)" value={amp} min={0} max={5} step={0.01} onChange={setAmp} format={(v) => `${v.toFixed(2)} V`} />
        <Slider label="Input offset (DC)" value={off} min={-5} max={5} step={0.01} onChange={setOff} format={(v) => `${v.toFixed(2)} V`} />
      </div>
      <Plot x={[0, T_END]} y={[lo - 0.5, hi + 0.5]} xLabel="time (ms), 1 kHz input" yLabel="voltage (V)"
        series={[{ label: "input", points: vin, dashed: true }, { label: "output", points: vout }]}
        markers={[{ y: ohi, label: "output max" }, { y: olo, label: "output min" }]} />
      <Readouts items={[
        { label: "Ideal gain", value: mode === "comp" ? "open loop" : g.toFixed(2) },
        { label: "Output range", value: `${Math.min(...outs).toFixed(2)} to ${Math.max(...outs).toFixed(2)} V` },
        { label: "Clipping", value: mode === "comp" ? "n/a" : clipped ? "yes" : "no", tone: mode === "comp" ? undefined : clipped ? "bad" : "ok" },
        { label: "Input within range", value: inOk ? "yes" : "no", tone: inOk ? "ok" : "bad" },
        ...(mode === "inv" || mode === "comp" ? [{ label: mode === "comp" ? "Threshold on v-" : "Reference on v+", value: `${vref(supply)} V` }] : []),
        ...(tooHigh ? [{ label: "Supply", value: "over MCP6002 7 V max", tone: "bad" as const }] : []),
      ]} />
    </Frame>
  );
}
