import { Code2, Lock, Pencil } from "lucide-react";
import type { ViewMode } from "@/pages/editor/ui/EditorPage";

// ── Python Syntax Highlighting ─────────────────────────────────────────────────

function highlightCode(line: string): React.ReactNode {
  if (!line) return null;
  const elements: { start: number; end: number; className: string; text: string }[] = [];
  let match;

  const stringRe = /(["'])(?:(?=(\\?))\2.)*?\1/g;
  while ((match = stringRe.exec(line)) !== null)
    elements.push({ start: match.index, end: match.index + match[0].length, className: "k-syn-str", text: match[0] });

  const kwRe = /\b(import|from|def|class|if|else|elif|while|for|in|return|True|False|None|and|or|not|try|except|finally|with|as|pass|break|continue)\b/g;
  while ((match = kwRe.exec(line)) !== null)
    if (!elements.some((e) => match!.index >= e.start && match!.index < e.end))
      elements.push({ start: match.index, end: match.index + match[0].length, className: "k-syn-kw", text: match[0] });

  const fnRe = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g;
  while ((match = fnRe.exec(line)) !== null)
    if (!elements.some((e) => match!.index >= e.start && match!.index < e.end))
      elements.push({ start: match.index, end: match.index + match[1].length, className: "k-syn-fn", text: match[1] });

  const numRe = /\b(\d+\.?\d*)\b/g;
  while ((match = numRe.exec(line)) !== null)
    if (!elements.some((e) => match!.index >= e.start && match!.index < e.end))
      elements.push({ start: match.index, end: match.index + match[0].length, className: "k-syn-num", text: match[0] });

  elements.sort((a, b) => a.start - b.start);
  if (elements.length === 0) return line;

  const parts: React.ReactNode[] = [];
  let lastEnd = 0;
  elements.forEach((el, i) => {
    if (el.start > lastEnd) parts.push(line.slice(lastEnd, el.start));
    parts.push(<span key={i} className={el.className}>{el.text}</span>);
    lastEnd = el.end;
  });
  if (lastEnd < line.length) parts.push(line.slice(lastEnd));
  return <>{parts}</>;
}

function findCommentStart(line: string): number {
  let inStr: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inStr) { if (ch === "\\" ) { i++; continue; } if (ch === inStr) inStr = null; }
    else if (ch === '"' || ch === "'") { inStr = ch; }
    else if (ch === "#") { return i; }
  }
  return -1;
}

function highlightPython(line: string): React.ReactNode {
  const idx = findCommentStart(line);
  if (idx !== -1) return <>{highlightCode(line.slice(0, idx))}<span className="k-syn-comment">{line.slice(idx)}</span></>;
  return highlightCode(line);
}

// ─────────────────────────────────────────────────────────────────────────────

interface CodePanelProps {
  viewMode: ViewMode;
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  generatedCode: string;
  editableCode: string;
  hasManualEdits: boolean;
  onEditableCodeChange: (code: string) => void;
  onSetEditableCode: (code: string) => void;
}

export function CodePanel({
  viewMode, isEditing, setIsEditing,
  generatedCode, editableCode, hasManualEdits,
  onEditableCodeChange, onSetEditableCode,
}: CodePanelProps) {
  return (
    <div
      className={`flex flex-col transition-all duration-300 ${viewMode === "code" ? "flex-1" : "hidden md:flex w-[320px] lg:w-[420px]"}`}
      style={{ borderLeft: "1px solid var(--k-border)", background: "var(--k-base-200)" }}
    >
      {/* Header */}
      <div
        className="flex h-10 items-center justify-between px-3"
        style={{ borderBottom: "1px solid var(--k-border)" }}
      >
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4" style={{ color: "var(--k-text-dim)" }} />
          <span className="text-xs font-semibold" style={{ color: "var(--k-text)" }}>
            {isEditing ? "main.py (edited)" : "main.py"}
          </span>
          {hasManualEdits && !isEditing && (
            <span className="badge badge-warning badge-sm text-[10px]">edits</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasManualEdits && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="btn btn-xs btn-ghost text-[10px]"
              style={{ border: "1px solid var(--k-border)", color: "var(--k-text-muted)" }}
            >
              {isEditing ? "Block Mode" : "Code Mode"}
            </button>
          )}
          <div className="flex items-center gap-1.5">
            <Lock className="h-3 w-3" style={{ color: !isEditing ? "var(--k-text-muted)" : "var(--k-text-dim)" }} />
            <button
              onClick={() => {
                if (!isEditing && !hasManualEdits) onSetEditableCode(generatedCode);
                setIsEditing(!isEditing);
              }}
              className="relative inline-flex h-4 w-7 flex-shrink-0 items-center rounded-full transition-colors"
              style={{ background: isEditing ? "var(--k-primary)" : "var(--k-elevated)" }}
            >
              <span
                className="inline-block h-3 w-3 rounded-full bg-white transition-transform"
                style={{ transform: isEditing ? "translateX(14px)" : "translateX(2px)" }}
              />
            </button>
            <Pencil className="h-3 w-3" style={{ color: isEditing ? "var(--k-primary)" : "var(--k-text-dim)" }} />
          </div>
        </div>
      </div>

      {/* Code area */}
      <div className="flex-1 overflow-auto">
        {isEditing ? (
          <textarea
            className="w-full h-full bg-transparent p-4 font-mono text-xs leading-6 outline-none resize-none"
            style={{ color: "var(--k-text)" }}
            value={editableCode}
            onChange={(e) => onEditableCodeChange(e.target.value)}
            placeholder="# Write your Python code here"
            spellCheck={false}
          />
        ) : (
          <div className="flex min-h-full">
            <div
              className="sticky left-0 flex flex-col py-4 pl-4 pr-3 text-right font-mono text-xs leading-6 select-none"
              style={{ background: "var(--k-base-200)", color: "var(--k-text-dim)" }}
            >
              {(generatedCode || "# Add blocks to generate code\n").split("\n").map((_, i) => (
                <span key={i}>{i + 1}</span>
              ))}
            </div>
            <pre className="flex-1 py-4 pr-4 font-mono text-xs leading-6">
              <code>
                {/* Inline styles for syntax tokens — no extra CSS classes needed */}
                <style>{`
                  .k-syn-str     { color: var(--k-warning); }
                  .k-syn-kw      { color: var(--k-primary); }
                  .k-syn-fn      { color: var(--k-accent); }
                  .k-syn-num     { color: #fb923c; }
                  .k-syn-comment { color: var(--k-text-dim); }
                `}</style>
                {generatedCode
                  ? generatedCode.split("\n").map((line, i) => (
                    <div key={i} className="hover:bg-white/5 rounded" style={{ color: "var(--k-text)" }}>
                      {highlightPython(line)}
                    </div>
                  ))
                  : <span style={{ color: "var(--k-text-dim)" }}># Add blocks to generate code</span>
                }
              </code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
