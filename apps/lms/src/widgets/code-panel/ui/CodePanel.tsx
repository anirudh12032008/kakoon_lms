import { Code2, Lock, Pencil } from "lucide-react";
import type { ViewMode } from "@/pages/editor/ui/EditorPage";

// ── Syntax Highlighting ────────────────────────────────────────────────────────

function highlightCode(line: string): React.ReactNode {
  if (!line) return null;
  const elements: { start: number; end: number; cls: string; text: string }[] = [];
  let match;

  const stringRe = /(["'])(?:(?=(\\?))\2.)*?\1/g;
  while ((match = stringRe.exec(line)) !== null)
    elements.push({ start: match.index, end: match.index + match[0].length, cls: "text-warning-c", text: match[0] });

  const kwRe = /\b(import|from|def|class|if|else|elif|while|for|in|return|True|False|None|and|or|not|try|except|finally|with|as|pass|break|continue)\b/g;
  while ((match = kwRe.exec(line)) !== null)
    if (!elements.some((e) => match!.index >= e.start && match!.index < e.end))
      elements.push({ start: match.index, end: match.index + match[0].length, cls: "text-primary-c", text: match[0] });

  const fnRe = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g;
  while ((match = fnRe.exec(line)) !== null)
    if (!elements.some((e) => match!.index >= e.start && match!.index < e.end))
      elements.push({ start: match.index, end: match.index + match[1].length, cls: "text-accent-c", text: match[1] });

  const numRe = /\b(\d+\.?\d*)\b/g;
  while ((match = numRe.exec(line)) !== null)
    if (!elements.some((e) => match!.index >= e.start && match!.index < e.end))
      elements.push({ start: match.index, end: match.index + match[0].length, cls: "text-secondary-c", text: match[0] });

  elements.sort((a, b) => a.start - b.start);
  if (elements.length === 0) return line;

  const parts: React.ReactNode[] = [];
  let lastEnd = 0;
  elements.forEach((el, i) => {
    if (el.start > lastEnd) parts.push(line.slice(lastEnd, el.start));
    parts.push(<span key={i} className={el.cls}>{el.text}</span>);
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
  if (idx !== -1) return <>{highlightCode(line.slice(0, idx))}<span className="text-hint">{line.slice(idx)}</span></>;
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
    <div className={`flex flex-col transition-all duration-300 bg-panel border-l border-subtle ${
      viewMode === "code" ? "flex-1" : "hidden md:flex w-[320px] lg:w-[420px]"
    }`}>
      {/* Header */}
      <div className="flex h-10 items-center justify-between px-3 border-b border-subtle">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-hint" />
          <span className="text-xs font-semibold text-body">
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
              className="btn btn-ghost btn-xs text-sub border border-subtle text-[10px]"
            >
              {isEditing ? "Block Mode" : "Code Mode"}
            </button>
          )}
          <div className="flex items-center gap-1.5">
            <Lock className={`h-3 w-3 ${!isEditing ? "text-sub" : "text-hint"}`} />
            <button
              onClick={() => {
                if (!isEditing && !hasManualEdits) onSetEditableCode(generatedCode);
                setIsEditing(!isEditing);
              }}
              className={`relative inline-flex h-4 w-7 flex-shrink-0 items-center rounded-full transition-colors ${
                isEditing ? "bg-primary-tint" : "bg-hover"
              }`}
            >
              <span className={`inline-block h-3 w-3 rounded-full transition-transform ${
                isEditing ? "bg-[var(--k-primary)] translate-x-3.5" : "bg-[var(--k-dim)] translate-x-0.5"
              }`} />
            </button>
            <Pencil className={`h-3 w-3 ${isEditing ? "text-primary-c" : "text-hint"}`} />
          </div>
        </div>
      </div>

      {/* Code area */}
      <div className="flex-1 overflow-auto">
        {isEditing ? (
          <textarea
            className="w-full h-full bg-transparent p-4 font-mono text-xs leading-6 text-body outline-none resize-none placeholder:text-hint"
            value={editableCode}
            onChange={(e) => onEditableCodeChange(e.target.value)}
            placeholder="# Write your Python code here"
            spellCheck={false}
          />
        ) : (
          <div className="flex min-h-full">
            <div className="sticky left-0 flex flex-col py-4 pl-4 pr-3 text-right font-mono text-xs leading-6 select-none bg-panel text-hint">
              {(generatedCode || "# Add blocks to generate code\n").split("\n").map((_, i) => (
                <span key={i}>{i + 1}</span>
              ))}
            </div>
            <pre className="flex-1 py-4 pr-4 font-mono text-xs leading-6">
              <code>
                {generatedCode
                  ? generatedCode.split("\n").map((line, i) => (
                    <div key={i} className="hover:bg-hover rounded text-body">
                      {highlightPython(line)}
                    </div>
                  ))
                  : <span className="text-hint"># Add blocks to generate code</span>
                }
              </code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
