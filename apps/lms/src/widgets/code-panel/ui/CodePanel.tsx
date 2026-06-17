import { Code2, Lock, Pencil } from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { python } from "@codemirror/lang-python";
import { EditorView } from "@codemirror/view";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import type { ViewMode } from "@/pages/editor/ui/EditorPage";

// Syntax colors mirror the read-only highlighter in highlightCode() below, so the
// editor and block/code views look identical:
//   keywords → --k-primary (violet) · strings → --k-warning (amber)
//   functions → --k-accent (cyan)   · numbers → --k-secondary (fuchsia)
//   comments → --k-dim               · text    → --k-text
const cmHighlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.operatorKeyword, t.definitionKeyword,
          t.moduleKeyword, t.bool, t.null, t.self], color: "var(--k-primary)" },
  { tag: [t.string, t.special(t.string), t.regexp, t.character], color: "var(--k-warning)" },
  { tag: [t.function(t.variableName), t.function(t.propertyName), t.labelName],
    color: "var(--k-accent)" },
  { tag: [t.number, t.integer, t.float], color: "var(--k-secondary)" },
  { tag: [t.comment, t.lineComment, t.blockComment], color: "var(--k-dim)" },
  { tag: [t.variableName, t.propertyName, t.operator, t.punctuation], color: "var(--k-text)" },
]);

// CodeMirror theme bound to the app's CSS color tokens so the editor matches the
// rest of the panel (and follows light/dark automatically via the same vars).
const cmTheme = EditorView.theme({
  "&": {
    backgroundColor: "transparent",
    color: "var(--k-body, #d4d4d4)",
    fontSize: "12px",
    height: "100%",
  },
  ".cm-content": {
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
    padding: "16px 0",
  },
  ".cm-scroller": { lineHeight: "1.5", overflow: "auto" },
  "&.cm-focused": { outline: "none" },
  ".cm-gutters": {
    backgroundColor: "transparent",
    color: "var(--k-hint, #6b7280)",
    border: "none",
  },
  ".cm-activeLine": { backgroundColor: "var(--k-hover, rgba(255,255,255,0.04))" },
  ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--k-sub, #9ca3af)" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--k-primary, #60a5fa)" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
    backgroundColor: "var(--k-primary-tint, rgba(96,165,250,0.25))",
  },
  ".cm-matchingBracket": {
    backgroundColor: "var(--k-primary-tint, rgba(96,165,250,0.2))",
    outline: "1px solid var(--k-primary, #60a5fa)",
  },
}, { dark: true });

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
      <div className="flex-1 min-h-0 flex flex-col overflow-auto">
        {isEditing ? (
          <CodeMirror
            value={editableCode}
            onChange={onEditableCodeChange}
            height="100%"
            theme={cmTheme}
            extensions={[python(), EditorView.lineWrapping, syntaxHighlighting(cmHighlight)]}
            placeholder="# Write your Python code here"
            basicSetup={{
              lineNumbers: true,
              highlightActiveLine: true,
              highlightActiveLineGutter: true,
              bracketMatching: true,
              closeBrackets: true,
              indentOnInput: true,
              autocompletion: false,
              foldGutter: false,
            }}
            className="flex-1 min-h-0 h-full text-xs"
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
