import { useId, useState } from "react";
import { Frame, Readouts, fmt, si } from "./kit";

// Band colours are the subject of this widget, so they are real colours, not theme colours.
// Every band also has a theme outline and its name in text, so colour is never the only signal.
const COLOURS = [
  { name: "Black", fill: "#111111" }, { name: "Brown", fill: "#7b4a1e" }, { name: "Red", fill: "#d32f2f" },
  { name: "Orange", fill: "#f57c00" }, { name: "Yellow", fill: "#fbc02d" }, { name: "Green", fill: "#388e3c" },
  { name: "Blue", fill: "#1e63d6" }, { name: "Violet", fill: "#7b1fa2" }, { name: "Grey", fill: "#8a8a8a" },
  { name: "White", fill: "#f5f5f5" },
];
const GOLD = { name: "Gold", fill: "#c9a227" }, SILVER = { name: "Silver", fill: "#b8b8b8" };
// Multiplier band: exponent of ten. -1 is gold, -2 is silver.
const MULTS = [0, 1, 2, 3, 4, 5, 6, 7, -1, -2];
const TOLS = [{ c: COLOURS[1], pct: 1 }, { c: COLOURS[2], pct: 2 }, { c: GOLD, pct: 5 }, { c: SILVER, pct: 10 }];
const multColour = (e: number) => (e === -1 ? GOLD : e === -2 ? SILVER : COLOURS[e]);

export interface Bands { d1: number; d2: number; exp: number; tol: number }

/** Ohms shown by the first three bands. */
// eslint-disable-next-line react-refresh/only-export-components -- pure maths exported for a self-check
export const bandValue = (b: Bands) => +((b.d1 * 10 + b.d2) * 10 ** b.exp).toPrecision(2);

/** Text like "4.7k", "330", "1M", "0.47" to ohms, or null. */
// eslint-disable-next-line react-refresh/only-export-components -- pure maths exported for a self-check
export function parseOhms(text: string): number | null {
  const m = text.trim().replace(/\s*(ohms?|Ω)$/i, "").match(/^(\d*\.?\d+)\s*([kKM]?)$/);
  if (!m) return null;
  const v = Number(m[1]) * (m[2] === "M" ? 1e6 : m[2] ? 1e3 : 1);
  return v > 0 ? v : null;
}

/** Nearest 4-band code for r ohms (two significant digits), or null if out of range. */
// eslint-disable-next-line react-refresh/only-export-components -- pure maths exported for a self-check
export function toBands(r: number, tol = 2): Bands | null {
  let exp = Math.floor(Math.log10(r)) - 1;
  let two = Math.round(r / 10 ** exp);
  if (two >= 100) { two = 10; exp += 1; }        // 995 rounds to 100, which is 10 × 10^(exp+1)
  if (two < 10) { two *= 10; exp -= 1; }
  if (exp < -2 || exp > 7) return null;
  return { d1: Math.floor(two / 10), d2: two % 10, exp, tol };
}

function BandSelect({ label, value, options, onChange }: {
  label: string; value: number; options: { value: number; label: string }[]; onChange: (v: number) => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-semibold">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(Number(e.target.value))} className="select select-sm mt-1 w-full">
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

/** 4-band resistor colour code, both directions. Used in b2. */
export default function ResistorColour() {
  const [b, setB] = useState<Bands>({ d1: 3, d2: 3, exp: 1, tol: 2 });   // 330 Ω, gold
  const [text, setText] = useState("330");
  const inputId = useId();
  const value = bandValue(b);
  const pct = TOLS[b.tol].pct;
  const typed = parseOhms(text);
  const typedBands = typed === null ? null : toBands(typed, b.tol);
  const update = (nb: Bands) => { setB(nb); setText(fmt(bandValue(nb))); };
  const onType = (t: string) => {
    setText(t);
    const v = parseOhms(t);
    const nb = v === null ? null : toBands(v, b.tol);
    if (nb) setB(nb);
  };
  const bands = [COLOURS[b.d1], COLOURS[b.d2], multColour(b.exp), TOLS[b.tol].c];
  const names = bands.map((c) => c.name).join(", ");
  const bandX = [130, 170, 210, 290];
  return (
    <Frame title="Resistor colour code"
      note="Read from the end the bands are bunched towards: band 1 and band 2 are the two digits, band 3 is how many zeros to add, and the last band (often gold) is the tolerance. Orange, orange, brown is 3, 3 and one zero: 330 Ω.">
      <svg viewBox="0 0 440 100" className="w-full" role="img" aria-label={`Resistor with bands ${names}: ${si(value, "Ω")}, plus or minus ${pct}%`}>
        <line x1="0" y1="50" x2="440" y2="50" stroke="var(--k-border-strong)" strokeWidth="4" />
        <rect x="100" y="22" width="240" height="56" rx="22" fill="var(--k-border)" stroke="var(--k-border-strong)" strokeWidth="2" />
        {bands.map((c, i) => (
          <rect key={i} x={bandX[i]} y="22" width="18" height="56" fill={c.fill} stroke="var(--k-text)" strokeWidth="1" />
        ))}
        {bands.map((c, i) => (
          <text key={`t${i}`} x={bandX[i] + 9} y="96" textAnchor="middle" fontSize="11" fill="var(--k-text)">{c.name}</text>
        ))}
      </svg>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <BandSelect label="Band 1 (digit)" value={b.d1} onChange={(d1) => update({ ...b, d1 })}
          options={COLOURS.slice(1).map((c, i) => ({ value: i + 1, label: `${c.name} (${i + 1})` }))} />
        <BandSelect label="Band 2 (digit)" value={b.d2} onChange={(d2) => update({ ...b, d2 })}
          options={COLOURS.map((c, i) => ({ value: i, label: `${c.name} (${i})` }))} />
        <BandSelect label="Band 3 (multiplier)" value={b.exp} onChange={(exp) => update({ ...b, exp })}
          options={MULTS.map((e) => ({ value: e, label: `${multColour(e).name} (×${e >= 0 ? (10 ** e).toLocaleString("en") : 10 ** e})` }))} />
        <BandSelect label="Band 4 (tolerance)" value={b.tol} onChange={(tol) => update({ ...b, tol })}
          options={TOLS.map((t, i) => ({ value: i, label: `${t.c.name} (±${t.pct}%)` }))} />
      </div>
      <div>
        <label htmlFor={inputId} className="block font-semibold">Or type a value in ohms</label>
        <input id={inputId} type="text" inputMode="decimal" value={text} onChange={(e) => onType(e.target.value)}
          aria-describedby={`${inputId}-hint`} className="input input-sm mt-1 w-40 font-mono" />
        <p id={`${inputId}-hint`} role="status" className="mt-1 text-[13px] text-sub">
          {typed === null ? "Type a number such as 220, 4.7k or 1M." :
            !typedBands ? "That value is outside what four bands can show." :
            bandValue(typedBands) !== +typed.toPrecision(12) ? `Four bands give two digits, so the nearest is ${si(bandValue(typedBands), "Ω")}.` :
            "Example: 4.7k means 4700 Ω."}
        </p>
      </div>
      <Readouts items={[
        { label: "Value", value: si(value, "Ω") },
        { label: "Tolerance", value: `±${pct}%` },
        { label: "Could really be", value: `${si(value * (1 - pct / 100), "Ω")} to ${si(value * (1 + pct / 100), "Ω")}` },
      ]} />
    </Frame>
  );
}
