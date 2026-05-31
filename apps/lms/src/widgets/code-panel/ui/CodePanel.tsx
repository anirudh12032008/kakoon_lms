import { Code2, Lock, Pencil } from "lucide-react";
import type { ViewMode } from "@/pages/editor/ui/EditorPage";

// ── Python Syntax Highlighting ────────────────────────────────────────────────

function highlightCode(line: string): React.ReactNode {
  if (!line) return null;
  const elements: { start: number; end: number; className: string; text: string }[] = [];
  let match;

  const stringRe = /(["'])(?:(?=(\\?))\2.)*?\1/g;
  while ((match = stringRe.exec(line)) !== null)
    elements.push({ start: match.index, end: match.index + match[0].length, className: "text-amber-400", text: match[0] });

  const kwRe = /\b(import|from|def|class|if|else|elif|while|for|in|return|True|False|None|and|or|not|try|except|finally|with|as|pass|break|continue)\b/g;
  while ((match = kwRe.exec(line)) !== null)
    if (!elements.some((e) => match!.index >= e.start && match!.index < e.end))
      elements.push({ start: match.index, end: match.index + match[0].length, className: "text-violet-400", text: match[0] });

  const fnRe = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g;
  while ((match = fnRe.exec(line)) !== null)
    if (!elements.some((e) => match!.index >= e.start && match!.index < e.end))
      elements.push({ start: match.index, end: match.index + match[1].length, className: "text-cyan-400", text: match[1] });

  const numRe = /\b(\d+\.?\d*)\b/g;
  while ((match = numRe.exec(line)) !== null)
    if (!elements.some((e) => match!.index >= e.start && match!.index < e.end))
      elements.push({ start: match.index, end: match.index + match[0].length, className: "text-orange-400", text: match[0] });

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
    if (inStr) {
      if (ch === "\\" ) { i++; continue; } // skip escaped char
      if (ch === inStr) inStr = null;
    } else if (ch === '"' || ch === "'") {
      inStr = ch;
    } else if (ch === "#") {
      return i;
    }
  }
  return -1;
}

function highlightPython(line: string): React.ReactNode {
  const idx = findCommentStart(line);
  if (idx !== -1) {
    return <>{highlightCode(line.slice(0, idx))}<span className="text-zinc-500">{line.slice(idx)}</span></>;
  }
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
    <div className={`flex flex-col border-l border-[#1f1f23] bg-[#0c0c0f] transition-all duration-300 ${
      viewMode === "code" ? "flex-1" : "hidden md:flex w-[320px] lg:w-[420px]"
    }`}>
      <div className="flex h-10 items-center justify-between border-b border-[#1f1f23] px-3">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-zinc-500" />
          <span className="text-xs font-medium text-zinc-300">
            {isEditing ? "main.py (edited)" : "main.py"}
          </span>
          {hasManualEdits && !isEditing && (
            <span className="text-[10px] text-amber-400">(has edits)</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {hasManualEdits && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex h-5 items-center gap-1 rounded border border-zinc-700 px-1.5 text-[10px] font-medium text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
            >
              {isEditing ? "Code Mode" : "Block Mode"}
            </button>
          )}
          <div className="flex items-center gap-2">
            <Lock className={`h-3 w-3 ${!isEditing ? "text-zinc-400" : "text-zinc-600"}`} />
            <button
              onClick={() => {
                if (!isEditing && !hasManualEdits) onSetEditableCode(generatedCode);
                setIsEditing(!isEditing);
              }}
              className={`relative inline-flex h-4 w-7 flex-shrink-0 items-center rounded-full transition-colors ${isEditing ? "bg-[#7c3aed]" : "bg-[#3f3f46]"}`}
            >
              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isEditing ? "translate-x-3.5" : "translate-x-0.5"}`} />
            </button>
            <Pencil className={`h-3 w-3 ${isEditing ? "text-violet-400" : "text-zinc-600"}`} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {isEditing ? (
          <textarea
            className="w-full h-full bg-transparent p-4 font-mono text-xs leading-6 text-zinc-300 outline-none resize-none"
            value={editableCode}
            onChange={(e) => onEditableCodeChange(e.target.value)}
            placeholder="# Write your Python code here"
            spellCheck={false}
          />
        ) : (
          <div className="flex min-h-full">
            <div className="sticky left-0 flex flex-col bg-[#0c0c0f] py-4 pl-4 pr-3 text-right font-mono text-xs leading-6 text-zinc-600 select-none">
              {(generatedCode || "# Add blocks to generate code\n").split("\n").map((_, i) => (
                <span key={i}>{i + 1}</span>
              ))}
            </div>
            <pre className="flex-1 py-4 pr-4 font-mono text-xs leading-6">
              <code className="text-zinc-300">
                {generatedCode
                  ? generatedCode.split("\n").map((line, i) => (
                    <div key={i} className="hover:bg-zinc-800/30">{highlightPython(line)}</div>
                  ))
                  : <span className="text-zinc-500"># Add blocks to generate code</span>
                }
              </code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
