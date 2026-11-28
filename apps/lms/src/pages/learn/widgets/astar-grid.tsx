import { useEffect, useMemo, useRef, useState, type PointerEvent } from "react";
import { Choice, Frame, Readouts } from "./kit";

type Cell = [number, number];
type Heur = "dijkstra" | "manhattan" | "euclidean" | "octile";
export interface Trace { steps: { cell: Cell; opened: Cell[] }[]; path: Cell[] | null; cost: number; h0: number }

const SQ2 = Math.sqrt(2);
const H: Record<Heur, (dr: number, dc: number) => number> = {
  dijkstra: () => 0,
  manhattan: (dr, dc) => dr + dc,
  euclidean: (dr, dc) => Math.hypot(dr, dc),
  octile: (dr, dc) => Math.max(dr, dc) + (SQ2 - 1) * Math.min(dr, dc),
};

/**
 * a13's grid A* (Dijkstra when h = 0), recording every expansion so the widget can replay it.
 * Same queue order as the lesson's heapq of (f, g, cell), same no-corner-cutting rule.
 */
// eslint-disable-next-line react-refresh/only-export-components -- pure maths exported for the self-check
export function search(walls: boolean[][], start: Cell, goal: Cell, heur: Heur, diagonal: boolean): Trace {
  const rows = walls.length, cols = walls[0].length;
  const h = (r: number, c: number) => H[heur](Math.abs(r - goal[0]), Math.abs(c - goal[1]));
  const moves: [number, number, number][] = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1]];
  if (diagonal) moves.push([1, 1, SQ2], [1, -1, SQ2], [-1, 1, SQ2], [-1, -1, SQ2]);
  const key = (r: number, c: number) => r * cols + c;
  const g = new Map([[key(...start), 0]]);
  const parent = new Map<number, number>();
  const closed = new Set<number>();
  // ponytail: linear scan for the minimum instead of a heap, fine for a few hundred cells.
  const open: [number, number, number, number][] = [[h(...start), 0, ...start]];
  const less = (a: number[], b: number[]) => { for (let i = 0; i < 4; i++) if (a[i] !== b[i]) return a[i] < b[i]; return false; };
  const steps: Trace["steps"] = [];
  while (open.length) {
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (less(open[i], open[bi])) bi = i;
    const [, gc, r, c] = open.splice(bi, 1)[0];
    const k = key(r, c);
    if (closed.has(k)) continue;
    if (r === goal[0] && c === goal[1]) {
      steps.push({ cell: [r, c], opened: [] });
      const path: Cell[] = [];
      for (let p: number | undefined = k; p !== undefined; p = parent.get(p)) path.push([Math.floor(p / cols), p % cols]);
      return { steps, path: path.reverse(), cost: gc, h0: h(...start) };
    }
    closed.add(k);
    const opened: Cell[] = [];
    for (const [dr, dc, cost] of moves) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || walls[nr][nc]) continue;
      if (dr && dc && (walls[r + dr][c] || walls[r][c + dc])) continue;
      const ng = gc + cost, nk = key(nr, nc);
      if (ng < (g.get(nk) ?? Infinity)) {
        g.set(nk, ng); parent.set(nk, k);
        open.push([ng + h(nr, nc), ng, nr, nc]);
        opened.push([nr, nc]);
      }
    }
    steps.push({ cell: [r, c], opened });
  }
  return { steps, path: null, cost: Infinity, h0: h(...start) };
}

// The lesson's grid: '#' = occupied.
const LESSON = ["..........", "..######..", "..#....#..", "..#.##.#..", "....#.....", "....#.###.", ".........."];
const fresh = () => LESSON.map((row) => [...row].map((ch) => ch === "#"));
const same = (a: Cell, r: number, c: number) => a[0] === r && a[1] === c;

export default function AstarGrid() {
  const [walls, setWalls] = useState(fresh);
  const [start, setStart] = useState<Cell>([0, 0]);
  const [goal, setGoal] = useState<Cell>([4, 5]);
  const [algo, setAlgo] = useState<"dijkstra" | "astar">("astar");
  const [heur, setHeur] = useState<Exclude<Heur, "dijkstra">>("octile");
  const [conn, setConn] = useState<"4" | "8">("8");
  const [tool, setTool] = useState<"wall" | "start" | "goal">("wall");
  const [step, setStep] = useState(Infinity); // Infinity = show the finished search
  const [running, setRunning] = useState(false);
  const paint = useRef<boolean | null>(null);

  const trace = useMemo(() => search(walls, start, goal, algo === "dijkstra" ? "dijkstra" : heur, conn === "8"),
    [walls, start, goal, algo, heur, conn]);
  const total = trace.steps.length;
  const shown = Math.min(step, total);
  const done = shown === total;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setStep((s) => {
      if (s + 1 >= total) { setRunning(false); return total; }
      return s + 1;
    }), 120);
    return () => clearInterval(id);
  }, [running, total]);

  // State at the current step: closed = cells expanded so far, open = opened but not yet expanded.
  const closed = new Set<string>(), open = new Set<string>([`${start[0]},${start[1]}`]);
  trace.steps.slice(0, shown).forEach(({ cell, opened }) => {
    const k = `${cell[0]},${cell[1]}`; closed.add(k); open.delete(k);
    opened.forEach(([r, c]) => { if (!closed.has(`${r},${c}`)) open.add(`${r},${c}`); });
  });
  const onPath = new Set(done && trace.path ? trace.path.map(([r, c]) => `${r},${c}`) : []);

  const changed = () => { setRunning(false); setStep(Infinity); };
  const apply = (r: number, c: number, first: boolean) => {
    if (same(start, r, c) || same(goal, r, c)) return;
    if (tool === "start") { if (first && !walls[r][c]) { setStart([r, c]); changed(); } return; }
    if (tool === "goal") { if (first && !walls[r][c]) { setGoal([r, c]); changed(); } return; }
    if (first) paint.current = !walls[r][c];
    const v = paint.current;
    if (v === null || walls[r][c] === v) return;
    setWalls((w) => w.map((row, i) => i === r ? row.map((x, j) => j === c ? v : x) : row));
    changed();
  };
  const cellAt = (e: PointerEvent) => {
    const el = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest<HTMLElement>("[data-cell]");
    return el ? el.dataset.cell!.split(",").map(Number) as Cell : null;
  };

  const heurOk = algo === "dijkstra" || !(heur === "manhattan" && conn === "8");
  const modeLabel = algo === "dijkstra" ? "Dijkstra" : `A* (${heur})`;

  return (
    <Frame title="Dijkstra and A* on a grid"
      note="Press Run with A* octile, then switch to Dijkstra and run again: same path cost, many more cells expanded. Then try Manhattan with 8 neighbours and see the inadmissible heuristic flagged.">
      <div className="space-y-3">
        <Choice label="Algorithm" value={algo} onChange={(v) => { setAlgo(v); changed(); }}
          options={[{ value: "dijkstra", label: "Dijkstra" }, { value: "astar", label: "A*" }]} />
        {algo === "astar" && <Choice label="Heuristic" value={heur} onChange={(v) => { setHeur(v); changed(); }}
          options={[{ value: "manhattan", label: "Manhattan" }, { value: "euclidean", label: "Euclidean" }, { value: "octile", label: "Octile" }]} />}
        <Choice label="Neighbours" value={conn} onChange={(v) => { setConn(v); changed(); }}
          options={[{ value: "4", label: "4 (cost 1)" }, { value: "8", label: "8 (diagonal √2)" }]} />
        <Choice label="Clicking a cell" value={tool} onChange={setTool}
          options={[{ value: "wall", label: "Toggles a wall" }, { value: "start", label: "Moves start" }, { value: "goal", label: "Moves goal" }]} />
      </div>

      <div role="group" aria-label={`Grid, ${LESSON.length} rows by ${LESSON[0].length} columns`}
        className="mx-auto grid w-full max-w-[440px] touch-none select-none gap-px rounded border border-subtle bg-[var(--k-border)] p-px"
        style={{ gridTemplateColumns: `repeat(${LESSON[0].length}, minmax(0, 1fr))` }}
        onPointerDown={(e) => { const c = cellAt(e); if (c) { (e.target as Element).releasePointerCapture?.(e.pointerId); apply(c[0], c[1], true); } }}
        onPointerMove={(e) => { if (e.buttons && paint.current !== null && tool === "wall") { const c = cellAt(e); if (c) apply(c[0], c[1], false); } }}
        onPointerUp={() => { paint.current = null; }} onPointerLeave={() => { paint.current = null; }}>
        {walls.map((row, r) => row.map((wall, c) => {
          const k = `${r},${c}`, isS = same(start, r, c), isG = same(goal, r, c);
          const state = isS ? "start" : isG ? "goal" : wall ? "wall" : onPath.has(k) ? "path" : closed.has(k) ? "closed" : open.has(k) ? "open" : "free";
          const look = {
            start: ["S", "bg-success-tint text-success-c font-bold"], goal: ["G", "bg-error-tint text-error-c font-bold"],
            wall: ["#", "bg-[var(--k-border-strong)] text-[var(--k-base-100)]"], path: ["*", "bg-success-tint text-success-c font-bold"],
            closed: ["·", "bg-primary-tint text-primary-c"], open: ["o", "bg-warning-tint text-warning-c"], free: ["", "bg-panel"],
          }[state];
          return (
            <button key={k} type="button" data-cell={k} aria-label={`row ${r} column ${c}: ${state}`} aria-pressed={wall}
              onClick={(e) => { if (e.detail === 0) { apply(r, c, true); paint.current = null; } }}
              className={`aspect-square font-mono text-[13px] leading-none ${look[1]}`}>{look[0]}</button>
          );
        }))}
      </div>
      <p className="text-center text-[12px] text-sub">S start, G goal, # wall, o open set, · closed set, * path. Rows count down from 0 at the top.</p>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-sm btn-primary" onClick={() => { if (done) setStep(0); setRunning((x) => !x || done); }}>{running ? "Pause" : "Run"}</button>
        <button type="button" className="btn btn-sm" disabled={running} onClick={() => setStep((s) => (s >= total ? 1 : s + 1))}>Step</button>
        <button type="button" className="btn btn-sm" onClick={() => { setRunning(false); setStep(0); }}>Reset search</button>
        <button type="button" className="btn btn-sm" onClick={() => { setWalls(fresh()); setStart([0, 0]); setGoal([4, 5]); changed(); }}>Lesson grid</button>
      </div>

      <Readouts items={[
        { label: `Nodes expanded, ${modeLabel}`, value: `${shown} of ${total}` },
        { label: "Path cost", value: !done ? "searching" : trace.path ? trace.cost.toFixed(3) : "no path", tone: done && !trace.path ? "bad" : undefined },
        { label: "Path cells", value: done && trace.path ? String(trace.path.length) : "-" },
        { label: "h(start)", value: trace.h0.toFixed(3) },
        { label: "Heuristic", value: heurOk ? "admissible" : "overestimates", tone: heurOk ? "ok" : "warn" },
      ]} />
    </Frame>
  );
}
