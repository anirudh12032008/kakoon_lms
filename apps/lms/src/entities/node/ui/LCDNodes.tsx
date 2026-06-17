import { useState } from "react";
import { createPortal } from "react-dom";
import {
  BaseNode,
  NodeField,
  SelectInput,
  NumberInput,
  ToggleInput,
  useNodeField,
  AdvancedSection,
  COLORS,
} from "./BaseNode";
import { DisplayIcon } from "./_shared";
import { OLED } from "@/entities/board/model/hardwareConfig";

// ─── Portal Modal ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, wide }: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative flex flex-col rounded-2xl border border-[var(--k-border)] shadow-2xl overflow-hidden"
        style={{
          background: "var(--k-base-100)",
          width: wide ? "min(900px, 95vw)" : "min(600px, 95vw)",
          maxHeight: "90vh",
        }}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--k-border)]">
          <span className="text-sm font-bold text-white">{title}</span>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded-full text-[var(--k-muted)] hover:text-[var(--k-text)] hover:bg-[var(--k-base-400)]/60 transition-colors text-lg leading-none"
          >×</button>
        </div>
        <div className="overflow-y-auto flex-1 p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}

// ─── Inline pin info badge ─────────────────────────────────────────────────────
function PinInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-0.5">
      <span className="text-xs text-[var(--k-muted)] font-medium">{label}</span>
      <span className="text-[10px] font-mono text-[var(--k-muted)] bg-[var(--k-border)] border border-[var(--k-border)] px-1.5 py-0.5 rounded">
        {value}
      </span>
    </div>
  );
}

// ─── 5×8 Custom LCD Character Editor ─────────────────────────────────────────
type LCDCharPixels = boolean[][];
function makeBlankChar(): LCDCharPixels { return Array.from({ length: 8 }, () => Array(5).fill(false)); }

function CharEditor({ pixels, onChange }: { pixels: LCDCharPixels; onChange: (p: LCDCharPixels) => void }) {
  const [drawing, setDrawing] = useState(false);
  const [drawVal, setDrawVal] = useState(true);
  const CELL = 20;

  const toggle = (r: number, c: number, val: boolean) => {
    const next = pixels.map(row => [...row]);
    next[r][c] = val;
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2">
      <svg width={5 * CELL} height={8 * CELL}
        style={{ display: "block", cursor: "crosshair", userSelect: "none" }}
        onMouseDown={e => {
          e.stopPropagation();
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const c = Math.floor((e.clientX - rect.left) / CELL);
          const r = Math.floor((e.clientY - rect.top) / CELL);
          const val = !pixels[r]?.[c];
          setDrawVal(val); setDrawing(true);
          toggle(r, c, val);
        }}
        onMouseMove={e => {
          if (!drawing) return;
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const c = Math.floor((e.clientX - rect.left) / CELL);
          const r = Math.floor((e.clientY - rect.top) / CELL);
          if (r >= 0 && r < 8 && c >= 0 && c < 5) toggle(r, c, drawVal);
        }}
        onMouseUp={() => setDrawing(false)}
        onMouseLeave={() => setDrawing(false)}
      >
        {Array.from({ length: 9 }, (_, i) => <line key={`h${i}`} x1={0} y1={i * CELL} x2={5 * CELL} y2={i * CELL} stroke="var(--k-border)" strokeWidth="1" />)}
        {Array.from({ length: 6 }, (_, i) => <line key={`v${i}`} x1={i * CELL} y1={0} x2={i * CELL} y2={8 * CELL} stroke="var(--k-border)" strokeWidth="1" />)}
        {pixels.map((row, r) => row.map((on, c) => (
          <rect key={`${r}-${c}`} x={c * CELL + 1} y={r * CELL + 1} width={CELL - 2} height={CELL - 2}
            fill={on ? "#60a5fa" : "var(--k-base-200)"} rx="2" />
        )))}
      </svg>
      <button onClick={() => onChange(makeBlankChar())} className="text-[10px] text-[var(--k-muted)] hover:text-red-400 transition-colors text-center">Clear</button>
    </div>
  );
}

// Split a line into display "units" — each token ({v}, {name}, {c0}..{c7})
// counts as a single LCD column; every other character is its own column.
const LCD_TOKEN_RE = /^(\{c[0-7]\}|\{[A-Za-z_]\w*\})/;
function tokenizeLcdLine(line: string): string[] {
  const units: string[] = [];
  let i = 0;
  while (i < line.length) {
    const m = line.slice(i).match(LCD_TOKEN_RE);
    if (m) { units.push(m[0]); i += m[0].length; }
    else { units.push(line[i]); i += 1; }
  }
  return units;
}
const isLcdToken = (u: string) => u.length > 1;
// Compact label shown inside a single grid cell for a token.
const lcdTokenLabel = (u: string) => u.replace(/^\{|\}$/g, "");

// ─── 16×2 LCD Grid Designer ───────────────────────────────────────────────────
function LCD16x2Grid({ lines, onLinesChange }: { lines: [string, string]; onLinesChange: (l: [string, string]) => void }) {
  const COLS = 16;
  // Each cell is a unit (single char or a whole token), padded to 16 columns.
  const cells = lines.map(l => {
    const u = tokenizeLcdLine(l).slice(0, COLS);
    while (u.length < COLS) u.push(" ");
    return u;
  });
  const setChar = (row: number, col: number, ch: string) => {
    const newLines: [string, string] = [...lines] as [string, string];
    const units = tokenizeLcdLine(newLines[row]);
    while (units.length <= col) units.push(" ");
    units[col] = ch || " ";
    newLines[row] = units.join("").replace(/ +$/, "");
    onLinesChange(newLines);
  };

  return (
    <div className="flex flex-col gap-3">
      <span className="text-[9px] uppercase tracking-wider text-[var(--k-muted)] font-bold">Character Grid — click any cell to type</span>
      <div className="inline-flex flex-col gap-px rounded-lg overflow-hidden border border-[var(--k-border)] bg-[#0a1a0a]">
        {[0, 1].map(row => (
          <div key={row} className="flex gap-px">
            {Array.from({ length: COLS }, (_, col) => {
              const ch = cells[row][col] || " ";
              const token = isLcdToken(ch);
              return (
                <div key={col} title={token ? ch : undefined}
                  className={`w-7 h-7 flex items-center justify-center font-mono border cursor-text transition-colors overflow-hidden ${
                    token
                      ? "text-[7px] leading-none text-cyan-300 bg-cyan-500/15 border-cyan-500/40"
                      : "text-[11px] text-green-300 bg-[#0a1a0a] hover:bg-[#0d2a0d] border-[#1a2a1a]"
                  }`}
                  contentEditable suppressContentEditableWarning
                  onKeyDown={e => {
                    e.preventDefault();
                    if (e.key === "Backspace") { setChar(row, col, " "); return; }
                    if (e.key.length === 1) setChar(row, col, e.key);
                  }}
                  style={{ outline: "none" }}
                >
                  {token
                    ? <span className="px-px truncate">{lcdTokenLabel(ch)}</span>
                    : ch === " " ? <span className="text-[#1a3a1a]">·</span> : ch}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-1.5 mt-1">
        {([0, 1] as const).map(i => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[9px] text-[var(--k-muted)] w-10">Line {i + 1}</span>
            <input value={lines[i]} maxLength={16}
              onChange={e => { const l: [string, string] = [...lines] as [string, string]; l[i] = e.target.value; onLinesChange(l); }}
              className="flex-1 bg-[var(--k-base-200)] border border-[var(--k-border)] rounded-lg px-2 py-1 text-xs font-mono text-green-300 outline-none focus:border-blue-500/60"
              placeholder={`Line ${i + 1} text…`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 16×2 LCD Node ────────────────────────────────────────────────────────────
export function LCD16x2Node() {
  const [mode, setMode] = useNodeField<string>("mode", "i2c");
  const [address, setAddress] = useNodeField<string>("address", "0x27");
  const [scl, setScl] = useNodeField<number>("scl", OLED.scl);
  const [sda, setSda] = useNodeField<number>("sda", OLED.sda);
  const [line1, setLine1] = useNodeField<string>("line1", "Hello");
  const [line2, setLine2] = useNodeField<string>("line2", "World");
  const [cursorBlink, setCursorBlink] = useNodeField<boolean>("cursorBlink", false);
  const [cursorUnderline, setCursorUnderline] = useNodeField<boolean>("cursorUnderline", false);
  const [backlight, setBacklight] = useNodeField<boolean>("backlight", true);
  const [varName, setVarName] = useNodeField<string>("varName", "distance");
  const [customChars, setCustomChars] = useNodeField<LCDCharPixels[]>("customChars",
    Array.from({ length: 8 }, makeBlankChar));

  const [showGrid, setShowGrid] = useState(false);
  const [showCharEditor, setShowCharEditor] = useState(false);
  const [activeChar, setActiveChar] = useState(0);

  // Each token occupies one column in the preview, mirroring the real LCD.
  const previewUnits: string[][] = [line1, line2].map(l => {
    const u = tokenizeLcdLine(l).slice(0, 16);
    while (u.length < 16) u.push(" ");
    return u;
  });

  return (
    <>
      <BaseNode title="16×2 LCD" color={COLORS.blue} icon={<DisplayIcon />} width="270px">
        <NodeField label="Mode">
          <SelectInput value={mode} onChange={setMode} compact
            options={[{ label: "I2C", value: "i2c" }, { label: "Parallel 4-bit", value: "parallel" }]} />
        </NodeField>
        {mode === "i2c" && <>
          <NodeField label="I2C Address">
            <SelectInput value={address} onChange={setAddress} compact
              options={[{ label: "0x27 (default)", value: "0x27" }, { label: "0x3F (alt)", value: "0x3F" }]} />
          </NodeField>
          <NodeField label="SCL Pin"><NumberInput value={scl} onChange={setScl} /></NodeField>
          <NodeField label="SDA Pin"><NumberInput value={sda} onChange={setSda} /></NodeField>
          <AdvancedSection><PinInfo label="SoftI2C" value={`SCL ${scl} · SDA ${sda} @ 400kHz`} /></AdvancedSection>
        </>}

        {/* Mini LCD preview */}
        <div className="px-3 py-1">
          <div className="rounded-lg border border-[#2a3a2a] bg-[#0a1a0a] px-2 py-1.5">
            {previewUnits.map((units, i) => (
              <div key={i} className="flex">
                {units.map((u, j) => (
                  <span key={j}
                    className={`leading-4 font-mono w-[9px] text-center overflow-hidden ${
                      isLcdToken(u) ? "text-[6px] text-cyan-300 bg-cyan-500/15 rounded-[1px]" : "text-[10px] text-green-300"
                    }`}
                    title={isLcdToken(u) ? u : undefined}>
                    {isLcdToken(u) ? lcdTokenLabel(u).slice(0, 2) : u === " " ? " " : u}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        <NodeField label="Cursor Blink"><ToggleInput value={cursorBlink} onChange={setCursorBlink} leftLabel="Off" rightLabel="On" /></NodeField>
        <NodeField label="Underline"><ToggleInput value={cursorUnderline} onChange={setCursorUnderline} leftLabel="Off" rightLabel="On" /></NodeField>
        <NodeField label="Backlight"><ToggleInput value={backlight} onChange={setBacklight} leftLabel="Off" rightLabel="On" /></NodeField>

        <NodeField label="Variable">
          <input value={varName} onChange={e => setVarName(e.target.value)}
            className="nodrag w-full bg-[var(--k-base-200)] border border-[var(--k-border)] rounded-lg px-2 py-1 text-[11px] font-mono text-green-300 outline-none focus:border-blue-500/60"
            placeholder="e.g. distance" />
        </NodeField>
        <div className="px-3 pb-1.5">
          <p className="text-[9px] text-[var(--k-dim)] leading-relaxed">
            In any line, <span className="font-mono text-[var(--k-muted)]">{"{v}"}</span> inserts the variable above.
            Use any other name like <span className="font-mono text-[var(--k-muted)]">{"{temp}"}</span> for additional variables,
            or <span className="font-mono text-[var(--k-muted)]">{"{c0}"}</span>…<span className="font-mono text-[var(--k-muted)]">{"{c7}"}</span> for custom characters. Each token = 1 column.
          </p>
        </div>

        <div className="px-3 pb-2 flex flex-col gap-1.5">
          <button onClick={() => setShowGrid(true)}
            className="nodrag w-full flex items-center justify-center gap-2 py-1.5 rounded-lg border border-blue-500/40 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-xs font-bold transition-all">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            16×2 Grid Designer
          </button>
          <button onClick={() => setShowCharEditor(true)}
            className="nodrag w-full flex items-center justify-center gap-2 py-1.5 rounded-lg border border-purple-500/40 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 text-xs font-bold transition-all">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            Custom Chars (8 slots · 5×8px)
          </button>
        </div>
      </BaseNode>

      {showGrid && (
        <Modal title="16×2 LCD Grid Designer" onClose={() => setShowGrid(false)} wide>
          <LCD16x2Grid lines={[line1, line2]} onLinesChange={([l1, l2]) => { setLine1(l1); setLine2(l2); }} />
        </Modal>
      )}

      {showCharEditor && (
        <Modal title="Custom Character Editor — 8 Slots (5×8 pixels each)" onClose={() => setShowCharEditor(false)} wide>
          <div className="flex gap-6">
            <div className="flex flex-col gap-2 w-28 flex-shrink-0">
              <span className="text-[9px] uppercase tracking-wider text-[var(--k-muted)] font-bold">Slots</span>
              {customChars.map((ch, i) => (
                <button key={i} onClick={() => setActiveChar(i)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left transition-all ${i === activeChar ? "border-purple-500 bg-purple-500/10" : "border-[var(--k-border)] hover:border-[var(--k-dim)] bg-[var(--k-base-300)]"}`}
                >
                  <div className="w-3 h-3 rounded-sm border border-[var(--k-border)] flex-shrink-0"
                    style={{ background: ch.some(r => r.some(v => v)) ? COLORS.blue : "transparent" }} />
                  <span className="text-[10px] text-[var(--k-muted)]">Char {i}</span>
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-3">
              <div className="text-xs text-[var(--k-muted)] font-bold">Editing Slot {activeChar}</div>
              <CharEditor pixels={customChars[activeChar]}
                onChange={px => setCustomChars(customChars.map((c, i) => i === activeChar ? px : c))} />
              <div className="flex flex-col gap-1">
                <span className="text-[9px] text-[var(--k-muted)]">2× Preview</span>
                <div className="inline-block bg-[#0a1a0a] p-2 rounded-lg border border-[#2a3a2a]">
                  <svg width={5 * 8} height={8 * 8} style={{ imageRendering: "pixelated" }}>
                    {customChars[activeChar].map((row, r) => row.map((on, c) => (
                      <rect key={`${r}-${c}`} x={c * 8} y={r * 8} width={7} height={7} fill={on ? "#4ade80" : "#0a1a0a"} />
                    )))}
                  </svg>
                </div>
              </div>
              <p className="text-[10px] text-[var(--k-dim)]">Loaded into CGRAM slot {activeChar} on startup.</p>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
