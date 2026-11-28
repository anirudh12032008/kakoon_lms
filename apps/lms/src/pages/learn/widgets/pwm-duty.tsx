import { useState } from "react";
import { Choice, Frame, Plot, Readouts, Slider, si } from "./kit";

type Board = "uno" | "esp32";

/** Square wave from 0 to tEnd (ms): HIGH at v for duty % of each period, with vertical edges. */
// eslint-disable-next-line react-refresh/only-export-components -- pure maths exported for a self-check
export function pwmWave(duty: number, freq: number, v: number, tEnd: number): [number, number][] {
  const period = 1000 / freq, on = period * duty / 100;
  if (duty <= 0) return [[0, 0], [tEnd, 0]];
  if (duty >= 100) return [[0, v], [tEnd, v]];
  const pts: [number, number][] = [];
  for (let k = 0; k * period < tEnd - 1e-9; k++) {
    const t0 = k * period;
    pts.push([t0, 0], [t0, v], [Math.min(t0 + on, tEnd), v]);
    if (t0 + on < tEnd) pts.push([t0 + on, 0], [Math.min(t0 + period, tEnd), 0]);
  }
  return pts;
}

/** Duty % to the Uno's analogWrite value (0 to 255) and the ESP32's 16-bit duty (0 to 65535). */
// eslint-disable-next-line react-refresh/only-export-components -- pure maths exported for a self-check
export const dutyCounts = (duty: number) => ({ uno: Math.round(duty / 100 * 255), esp32: Math.round(duty / 100 * 65535) });

const T_END = 10; // ms, fixed window so the axis stays still

/** PWM square wave, its average, and the LED it drives. Used in b6. */
export default function PwmDuty() {
  const [board, setBoard] = useState<Board>("uno");
  const [duty, setDuty] = useState(25);
  const [freq, setFreq] = useState(500);
  const v = board === "uno" ? 5 : 3.3;
  const avg = v * duty / 100;
  const counts = dutyCounts(duty);
  const period = 1 / freq;
  // Eyes judge brightness unevenly: low duty already looks fairly bright (rough gamma of 2.2).
  const looks = (duty / 100) ** (1 / 2.2);
  const word = duty === 0 ? "off" : duty < 20 ? "dim" : duty < 60 ? "fairly bright" : duty < 100 ? "bright" : "full brightness";
  return (
    <Frame title="PWM: duty cycle and average voltage"
      note="The defaults are the lesson's example: 25% at 500 Hz, so HIGH for 0.5 ms of every 2 ms, averaging 1.25 V on 5 V. Change the frequency and notice the average does not move: only the duty cycle sets it.">
      <Choice label="Board" value={board} onChange={setBoard} options={[
        { value: "uno", label: "Arduino Uno (5 V)" }, { value: "esp32", label: "ESP32 (3.3 V)" },
      ]} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Slider label="Duty cycle" value={duty} min={0} max={100} onChange={setDuty} format={(d) => `${d}%`} />
        <Slider label="Frequency" value={freq} min={200} max={2000} step={10} onChange={setFreq} format={(f) => `${f} Hz`} />
      </div>
      <Plot x={[0, T_END]} y={[0, 6]} xLabel="time (ms)" yLabel="pin voltage (V)" height={200}
        series={[{ label: "pin", points: pwmWave(duty, freq, v, T_END) }]}
        markers={[{ y: avg, label: `average ${avg.toFixed(2)} V` }]} />
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 60 60" className="h-14 w-14 shrink-0" role="img" aria-label={`LED at ${duty}% duty looks ${word}`}>
          <circle cx="30" cy="30" r="26" fill="none" stroke="var(--k-border-strong)" strokeWidth="2" />
          <circle cx="30" cy="30" r="24" fill="var(--k-warning)" opacity={looks} />
        </svg>
        <p className="text-[13px] text-sub">The LED looks <strong className="text-body">{word}</strong>. At 50% it already looks much more than half as bright.</p>
      </div>
      <Readouts items={[
        { label: "Period = 1 / f", value: si(period, "s") },
        { label: "HIGH for", value: si(period * duty / 100, "s") },
        { label: "Average = duty × supply", value: `${avg.toFixed(2)} V` },
        board === "uno"
          ? { label: "analogWrite value (0 to 255)", value: String(counts.uno) }
          : { label: "ESP32 duty (0 to 65535)", value: String(counts.esp32) },
      ]} />
    </Frame>
  );
}
