import { useState } from "react";
import { Choice, Frame, Readouts } from "./kit";

/** K-map solver: truth table and Karnaugh map kept in sync, minimal sum of products by Quine-McCluskey. Used in i3. */

type Cell = 0 | 1 | 2; // 2 = don't care (X)
export interface Implicant { value: number; mask: number } // mask bit 1 = variable dropped
const VARS = ["A", "B", "C", "D"];
const GRAY = [0, 1, 3, 2];
const LESSON = [0, 2, 5, 7, 8, 10, 13, 15];

/** Prime implicants of the ones plus don't cares (Quine-McCluskey combining step). */
// eslint-disable-next-line react-refresh/only-export-components -- pure maths exported for a self-check
export function primes(ones: number[], dcs: number[]): Implicant[] {
  let level: Implicant[] = [...ones, ...dcs].map((m) => ({ value: m, mask: 0 }));
  const out: Implicant[] = [];
  const key = (p: Implicant) => `${p.value}/${p.mask}`;
  while (level.length) {
    const used = new Set<string>();
    const next = new Map<string, Implicant>();
    for (let i = 0; i < level.length; i++) for (let j = i + 1; j < level.length; j++) {
      const a = level[i], b = level[j], diff = a.value ^ b.value;
      if (a.mask === b.mask && diff && (diff & (diff - 1)) === 0) {
        const c = { value: a.value & ~diff, mask: a.mask | diff };
        next.set(key(c), c); used.add(key(a)); used.add(key(b));
      }
    }
    for (const p of level) if (!used.has(key(p)) && !out.some((q) => key(q) === key(p))) out.push(p);
    level = [...next.values()];
  }
  return out;
}

const covers = (p: Implicant, m: number) => (m & ~p.mask) === p.value;
const literals = (n: number, p: Implicant) => n - popcount(p.mask);
function popcount(x: number) { let c = 0; for (; x; x &= x - 1) c++; return c; }

/** Minimal cover of the ones: fewest terms, then fewest literals. Exact search, fine for 4 variables. */
// eslint-disable-next-line react-refresh/only-export-components -- pure maths exported for a self-check
export function minimise(n: number, ones: number[], dcs: number[]): Implicant[] {
  if (!ones.length) return [];
  const ps = primes(ones, dcs);
  const best = { terms: null as Implicant[] | null, lits: Infinity };
  const search = (chosen: Implicant[], lits: number) => {
    const b = best.terms;
    if (b && (chosen.length > b.length || (chosen.length === b.length && lits >= best.lits))) return;
    const left = ones.filter((m) => !chosen.some((p) => covers(p, m)));
    if (!left.length) { best.terms = [...chosen]; best.lits = lits; return; }
    // branch on the uncovered minterm with the fewest candidate primes
    let pick = left[0], cands = ps.filter((p) => covers(p, pick));
    for (const m of left) { const c = ps.filter((p) => covers(p, m)); if (c.length < cands.length) { pick = m; cands = c; } }
    for (const p of cands) search([...chosen, p], lits + literals(n, p));
  };
  search([], 0);
  return (best.terms ?? []).sort((a, b) => b.mask - a.mask || b.value - a.value);
}

/** Product term text, A is the most significant input. */
// eslint-disable-next-line react-refresh/only-export-components -- pure maths exported for a self-check
export function term(n: number, p: Implicant): string {
  let s = "";
  for (let i = 0; i < n; i++) {
    const bit = 1 << (n - 1 - i);
    if (!(p.mask & bit)) s += VARS[i] + (p.value & bit ? "" : "'");
  }
  return s || "1";
}

// eslint-disable-next-line react-refresh/only-export-components -- pure maths exported for a self-check
export function expression(n: number, ones: number[], dcs: number[]): string {
  const t = minimise(n, ones, dcs);
  return t.length ? t.map((p) => term(n, p)).join(" + ") : "0";
}

const STROKES = ["var(--k-primary)", "var(--k-error)", "var(--k-success)", "var(--k-warning)"];
const DASHES = [undefined, "0.12 0.06", "0.04 0.05", "0.2 0.05 0.04 0.05"];

/** Split a set of Gray positions on a circular axis of length len into contiguous runs [start, length]. */
function runs(pos: number[], len: number): [number, number][] {
  if (pos.length === len) return [[0, len]];
  const set = new Set(pos), out: [number, number][] = [];
  for (const p of pos) if (!set.has((p + len - 1) % len)) {
    let l = 1; while (set.has((p + l) % len)) l++;
    if (p + l <= len) out.push([p, l]); else out.push([p, len - p], [0, p + l - len]);
  }
  return out;
}

export default function KmapSolver() {
  const [n, setN] = useState<2 | 3 | 4>(4);
  const [cells, setCells] = useState<Cell[]>(() => Array.from({ length: 16 }, (_, m) => (LESSON.includes(m) ? 1 : 0)));
  const size = 1 << n;
  const vals = cells.slice(0, size);
  const ones = vals.flatMap((v, m) => (v === 1 ? [m] : []));
  const dcs = vals.flatMap((v, m) => (v === 2 ? [m] : []));
  const groups = minimise(n, ones, dcs);
  const expr = groups.length ? groups.map((p) => term(n, p)).join(" + ") : "0";
  const cycle = (m: number) => setCells((c) => c.map((v, i) => (i === m ? (((v + 1) % 3) as Cell) : v)));
  const show = (v: Cell) => (v === 2 ? "X" : String(v));

  const rowBits = n === 4 ? 2 : 1, colBits = n - rowBits;
  const rowOrder = rowBits === 2 ? GRAY : [0, 1];
  const colOrder = colBits === 2 ? GRAY : [0, 1];
  const rowVars = VARS.slice(0, rowBits).join(""), colVars = VARS.slice(rowBits, n).join("");
  const bin = (v: number, w: number) => v.toString(2).padStart(w, "0");
  const minterm = (r: number, c: number) => (rowOrder[r] << colBits) | colOrder[c];
  const label = (m: number) => `minterm ${m}, ${VARS.slice(0, n).join("")} = ${bin(m, n)}, output ${show(vals[m])}`;

  // group outlines in cell units: column 0 and row 0 are the headers
  const R = rowOrder.length, C = colOrder.length;
  const rects = groups.flatMap((p, k) => {
    const rs = rowOrder.flatMap((_, r) => (colOrder.some((_, c) => covers(p, minterm(r, c))) ? [r] : []));
    const cs = colOrder.flatMap((_, c) => (rowOrder.some((_, r) => covers(p, minterm(r, c))) ? [c] : []));
    const inset = 0.08 + 0.05 * (k % 4);
    return runs(rs, R).flatMap(([r0, rl]) => runs(cs, C).map(([c0, cl]) => ({ k, x: 1 + c0 + inset, y: 1 + r0 + inset, w: cl - 2 * inset, h: rl - 2 * inset })));
  });

  const btn = (m: number, extra = "") => (
    <button type="button" onClick={() => cycle(m)} aria-label={label(m)}
      className={`font-mono font-semibold rounded border border-subtle hover:bg-hover ${vals[m] === 1 ? "bg-primary-tint text-body" : vals[m] === 2 ? "text-warning-c" : "text-sub"} ${extra}`}>
      {show(vals[m])}
    </button>
  );

  return (
    <Frame title="K-map solver"
      note="Click any output (in the table or the map) to cycle 0, 1, X. The lesson's example is loaded: check that the map gives BD + B'D'. Then make a corner cell X and see whether the answer changes.">
      <div className="flex flex-wrap items-center gap-4">
        <Choice label="Inputs" value={String(n) as "2" | "3" | "4"} onChange={(v) => setN(Number(v) as 2 | 3 | 4)}
          options={[{ value: "2", label: "2" }, { value: "3", label: "3" }, { value: "4", label: "4" }]} />
        <button type="button" className="min-h-9 rounded-md border border-subtle px-3 text-[13px] font-semibold text-sub hover:bg-hover"
          onClick={() => { setN(4); setCells(Array.from({ length: 16 }, (_, m) => (LESSON.includes(m) ? 1 : 0))); }}>Lesson example</button>
        <button type="button" className="min-h-9 rounded-md border border-subtle px-3 text-[13px] font-semibold text-sub hover:bg-hover"
          onClick={() => setCells(Array(16).fill(0))}>Clear</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-[auto_1fr]">
        <table className="font-mono text-[13px]">
          <caption className="mb-1 text-left font-sans text-[12px] text-sub">Truth table</caption>
          <thead><tr className="text-sub"><th className="px-2 text-right">m</th><th className="px-2">{VARS.slice(0, n).join("")}</th><th className="px-2">F</th></tr></thead>
          <tbody>
            {vals.map((_, m) => (
              <tr key={m}><td className="px-2 text-right text-sub">{m}</td><td className="px-2 text-center">{bin(m, n)}</td>
                <td className="px-1 py-0.5">{btn(m, "h-7 w-9")}</td></tr>
            ))}
          </tbody>
        </table>

        <div className="max-w-sm">
          <p className="mb-1 text-[12px] text-sub">K-map: rows {rowVars}, columns {colVars}, Gray code order</p>
          <div className="relative">
            <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${C + 1}, minmax(0, 1fr))` }}>
              <div className="flex aspect-square items-end justify-end p-1 font-mono text-[11px] text-sub">{rowVars}\{colVars}</div>
              {colOrder.map((c) => <div key={c} className="flex items-end justify-center pb-1 font-mono text-[13px] text-sub">{bin(c, colBits)}</div>)}
              {rowOrder.map((r, ri) => [
                <div key={`h${r}`} className="flex items-center justify-end pr-2 font-mono text-[13px] text-sub">{bin(r, rowBits)}</div>,
                ...colOrder.map((_, ci) => {
                  const m = minterm(ri, ci);
                  return <div key={m} className="relative aspect-square p-0.5">{btn(m, "h-full w-full text-[15px]")}<span aria-hidden="true" className="pointer-events-none absolute bottom-1 right-1.5 text-[10px] text-sub">{m}</span></div>;
                }),
              ])}
            </div>
            <svg viewBox={`0 0 ${C + 1} ${R + 1}`} preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
              {rects.map((g, i) => (
                <rect key={i} x={g.x} y={g.y} width={g.w} height={g.h} rx={0.2} fill="none" stroke={STROKES[g.k % 4]}
                  strokeWidth={2.5} vectorEffect="non-scaling-stroke" strokeDasharray={DASHES[g.k % 4]} />
              ))}
            </svg>
          </div>
        </div>
      </div>

      <div>
        <p className="text-[12px] text-sub">Minimal sum of products</p>
        <p className="font-mono text-[17px] font-semibold" aria-live="polite">F = {expr}</p>
        {groups.length > 0 && (
          <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-sub">
            {groups.map((p, k) => {
              const cov = Array.from({ length: size }, (_, m) => m).filter((m) => covers(p, m));
              return (
                <li key={k} className="inline-flex items-center gap-1.5">
                  <svg width="18" height="10" aria-hidden="true"><rect x="1" y="1" width="16" height="8" rx="2" fill="none" strokeWidth="2" stroke={STROKES[k % 4]} strokeDasharray={DASHES[k % 4] ? "3 2" : undefined} /></svg>
                  <span className="font-mono text-body">{term(n, p)}</span> covers {cov.join(", ")}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <Readouts items={[
        { label: "Ones (Σm)", value: ones.join(", ") || "none" },
        { label: "Don't cares (d)", value: dcs.join(", ") || "none" },
        { label: "Terms / literals", value: `${groups.length} / ${groups.reduce((s, p) => s + literals(n, p), 0)}` },
      ]} />
    </Frame>
  );
}
