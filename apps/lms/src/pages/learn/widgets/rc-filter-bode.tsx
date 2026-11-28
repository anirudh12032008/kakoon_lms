import { useState } from "react";
import { Choice, Frame, Plot, Readouts, Slider, si } from "./kit";

type Kind = "low" | "high";

/** First-order RC response at f for cut-off fc: |H|, gain in dB, phase in degrees. */
// eslint-disable-next-line react-refresh/only-export-components -- pure maths exported for a self-check
export function rcResponse(kind: Kind, f: number, fc: number) {
  const x = f / fc;
  const mag = (kind === "low" ? 1 : x) / Math.sqrt(1 + x * x);
  const phase = (kind === "low" ? -1 : 1) * (Math.atan(kind === "low" ? x : 1 / x) * 180) / Math.PI;
  return { mag, db: 20 * Math.log10(mag), phase };
}

const F: [number, number] = [1, 1e6];

/** Bode magnitude and phase of an RC low-pass or high-pass. Used in i1. */
export default function RcFilterBode() {
  const [kind, setKind] = useState<Kind>("low");
  const [r, setR] = useState(1600);     // Ω
  const [c, setC] = useState(100e-9);   // F
  const [ft, setFt] = useState(1000);   // Hz, test frequency
  const fc = 1 / (2 * Math.PI * r * c);
  const mag: [number, number][] = [], ph: [number, number][] = [];
  for (let i = 0; i <= 240; i++) {
    const f = 10 ** (6 * i / 240);
    const h = rcResponse(kind, f, fc);
    mag.push([f, h.db]);
    ph.push([f, h.phase]);
  }
  const at = rcResponse(kind, ft, fc);
  const markers = [...(fc >= F[0] && fc <= F[1] ? [{ x: fc, label: "f_c" }] : []), { x: ft, label: "test" }];
  return (
    <Frame title="RC filter Bode plot"
      note="Leave the defaults (1.6 kΩ, 100 nF) and set the test frequency to 100 Hz, 1 kHz and 10 kHz to check the table. Then switch to high-pass and see the same f_c with the curves mirrored.">
      <Choice label="Filter" value={kind} onChange={setKind}
        options={[{ value: "low", label: "Low-pass" }, { value: "high", label: "High-pass" }]} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Slider label="R" value={Math.log10(r)} min={2} max={6} step={0.01} onChange={(v) => setR(Math.round(10 ** v))} format={() => si(r, "Ω")} />
        <Slider label="C" value={Math.log10(c)} min={-9} max={-5} step={0.01} onChange={(v) => setC(10 ** v)} format={() => si(c, "F")} />
        <Slider label="Test frequency" value={Math.log10(ft)} min={0} max={6} step={0.01} onChange={(v) => setFt(10 ** v)} format={() => si(ft, "Hz")} />
      </div>
      <Readouts items={[
        { label: "f_c = 1 / (2πRC)", value: si(fc, "Hz") },
        { label: "|H| at test f", value: at.mag.toFixed(3) },
        { label: "Gain at test f", value: `${at.db.toFixed(1)} dB` },
        { label: "Phase at test f", value: `${at.phase.toFixed(1)}°` },
        { label: "f / f_c", value: (ft / fc).toPrecision(3) },
      ]} />
      <Plot logX x={F} y={[-60, 5]} xLabel="frequency (Hz)" yLabel="gain (dB)" height={200}
        series={[{ label: "gain", points: mag }]} markers={[...markers, { y: -3, label: "-3 dB" }]} />
      <Plot logX x={F} y={[-90, 90]} xLabel="frequency (Hz)" yLabel="phase (degrees)" height={180}
        series={[{ label: "phase", points: ph }]} markers={markers} />
    </Frame>
  );
}
