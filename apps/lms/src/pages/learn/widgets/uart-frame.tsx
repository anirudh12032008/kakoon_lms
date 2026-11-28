import { useId, useState } from "react";
import { Choice, Frame, Readouts, si } from "./kit";

/** UART frame timing diagram: start, data LSB first, parity, stop. Used in i7. */

export type Parity = "N" | "E" | "O";
export interface FrameBit { name: string; level: 0 | 1 }

/** The bits of one character on the wire, after the start edge and before the line returns to idle. */
// eslint-disable-next-line react-refresh/only-export-components -- pure maths exported for a self-check
export function uartBits(byte: number, dataBits: 7 | 8, parity: Parity, stopBits: 1 | 2): FrameBit[] {
  const bits: FrameBit[] = [{ name: "start", level: 0 }];
  let ones = 0;
  for (let i = 0; i < dataBits; i++) {
    const b = ((byte >> i) & 1) as 0 | 1;
    ones += b;
    bits.push({ name: `d${i}`, level: b });
  }
  if (parity !== "N") bits.push({ name: "par", level: ((parity === "E" ? ones : ones + 1) % 2) as 0 | 1 });
  for (let i = 0; i < stopBits; i++) bits.push({ name: "stop", level: 1 });
  return bits;
}

/** Parse "K" as a character, or "0x4B" / "4B" as a hex byte. Returns null if it is not one byte. */
// eslint-disable-next-line react-refresh/only-export-components -- pure maths exported for a self-check
export function parseByte(text: string, mode: "char" | "hex"): number | null {
  if (mode === "hex") {
    const m = /^(?:0x)?([0-9a-f]{1,2})$/i.exec(text.trim());
    return m ? parseInt(m[1], 16) : null;
  }
  const cp = text.codePointAt(0);
  return [...text].length === 1 && cp !== undefined && cp <= 0xff ? cp : null;
}

const BAUDS = ["1200", "9600", "19200", "38400", "57600", "115200"] as const;

export default function UartFrame() {
  const id = useId();
  const [mode, setMode] = useState<"char" | "hex">("char");
  const [text, setText] = useState("K");
  const [baud, setBaud] = useState<(typeof BAUDS)[number]>("9600");
  const [data, setData] = useState<"7" | "8">("8");
  const [parity, setParity] = useState<Parity>("N");
  const [stop, setStop] = useState<"1" | "2">("1");

  const parsed = parseByte(text, mode);
  const byte = parsed ?? 0;
  const dataBits = Number(data) as 7 | 8;
  const sent = dataBits === 7 ? byte & 0x7f : byte;
  const bits = uartBits(byte, dataBits, parity, Number(stop) as 1 | 2);
  const rate = Number(baud), tBit = 1 / rate, nBits = bits.length, tFrame = nBits * tBit;
  const fmtT = (t: number) => si(t, "s", 3).replace(" ", "");

  // drawing: one idle bit either side of the frame
  const W = 640, L = 8, R = 8, slots = nBits + 2, bw = (W - L - R) / slots;
  const yHi = 40, yLo = 80;
  const levels: (0 | 1)[] = [1, ...bits.map((b) => b.level), 1];
  let path = `M ${L} ${yHi}`;
  levels.forEach((lv, i) => {
    const x0 = L + i * bw, y = lv ? yHi : yLo;
    path += ` L ${x0} ${y} L ${x0 + bw} ${y}`;
  });
  const names = ["idle", ...bits.map((b) => b.name), "idle"];
  const desc = `UART frame for byte 0x${sent.toString(16).toUpperCase().padStart(2, "0")}, ${data}${parity}${stop}: ` +
    bits.map((b) => `${b.name} ${b.level}`).join(", ");

  return (
    <Frame title="UART frame timing"
      note="The default is the lesson's 'K' at 9600 baud 8N1: compare the levels with the diagram above. Then switch to 8E1 and watch the parity bit and the frame time change.">
      <div className="flex flex-wrap items-end gap-4">
        <Choice label="Input as" value={mode} onChange={(v) => { setMode(v); setText(v === "hex" ? `0x${byte.toString(16).toUpperCase().padStart(2, "0")}` : String.fromCharCode(byte)); }}
          options={[{ value: "char", label: "Character" }, { value: "hex", label: "Hex byte" }]} />
        <div>
          <label htmlFor={id} className="mr-2 font-semibold">{mode === "char" ? "Character" : "Byte"}</label>
          <input id={id} value={text} onChange={(e) => setText(e.target.value)} maxLength={mode === "char" ? 2 : 4} spellCheck={false}
            aria-invalid={parsed === null}
            className="input input-sm w-24 border-subtle bg-raised font-mono text-body" />
        </div>
      </div>
      <Choice label="Baud" value={baud} onChange={setBaud} options={BAUDS.map((b) => ({ value: b, label: b }))} />
      <div className="flex flex-wrap gap-4">
        <Choice label="Data bits" value={data} onChange={setData} options={[{ value: "7", label: "7" }, { value: "8", label: "8" }]} />
        <Choice label="Parity" value={parity} onChange={setParity} options={[{ value: "N", label: "None" }, { value: "E", label: "Even" }, { value: "O", label: "Odd" }]} />
        <Choice label="Stop bits" value={stop} onChange={setStop} options={[{ value: "1", label: "1" }, { value: "2", label: "2" }]} />
      </div>
      {parsed === null && <p className="text-error-c">Enter one character (code 0 to 255) or a hex byte such as 0x4B. Showing 0x00.</p>}
      {parsed !== null && dataBits === 7 && byte > 0x7f && <p className="text-warning-c">With 7 data bits the top bit is not sent: the receiver gets 0x{sent.toString(16).toUpperCase().padStart(2, "0")}.</p>}

      <svg viewBox={`0 0 ${W} 150`} className="w-full text-sub" role="img" aria-label={desc}>
        <g fontSize="12" fill="currentColor" textAnchor="middle">
          {names.map((nm, i) => {
            const x0 = L + i * bw, fieldBit = i > 0 && i <= nBits;
            return (
              <g key={i}>
                {fieldBit && <rect x={x0} y={30} width={bw} height={60} fill={nm.startsWith("d") ? "var(--k-primary)" : nm === "par" ? "var(--k-warning)" : "var(--k-border)"} opacity={0.12} />}
                <line x1={x0} x2={x0} y1={24} y2={96} stroke="var(--k-border)" strokeDasharray={i === 0 ? undefined : "2 3"} />
                <text x={x0 + bw / 2} y={18}>{nm}</text>
                <text x={x0 + bw / 2} y={110} className="font-mono" fill="var(--k-primary)" fontWeight={600}>{levels[i]}</text>
                {i >= 1 && i <= nBits + 1 && <text x={x0} y={i % 2 ? 128 : 144} fontSize="11">{fmtT((i - 1) * tBit)}</text>}
              </g>
            );
          })}
        </g>
        <path d={path} fill="none" stroke="var(--k-primary)" strokeWidth={2.5} strokeLinejoin="round" />
      </svg>
      <p className="font-mono text-[13px] text-sub">
        Data 0x{sent.toString(16).toUpperCase().padStart(2, "0")} = {sent.toString(2).padStart(dataBits, "0")} binary, sent LSB first as {bits.filter((b) => b.name.startsWith("d")).map((b) => b.level).join(" ")}
      </p>
      <Readouts items={[
        { label: "Bit time (1 / baud)", value: si(tBit, "s") },
        { label: `Frame (${nBits} bits)`, value: si(tFrame, "s") },
        { label: "Characters per second", value: `${+(rate / nBits).toFixed(1)}` },
        { label: "Useful data rate", value: `${Math.round((100 * dataBits) / nBits)}% of baud` },
      ]} />
    </Frame>
  );
}
