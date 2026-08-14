import { useRef, useEffect, useCallback, useState } from "react";
import { Trash2, X, Terminal, PanelBottom, PictureInPicture2 } from "lucide-react";

function logColor(log: string): string {
  if (log.includes("") || log.includes("error") || log.includes("Error")) return "text-error-c";
  if (log.includes("") || log.includes("") || log.includes("success"))  return "text-success-c";
  if (log.includes("") || log.includes("warning"))                        return "text-warning-c";
  if (log.includes("") || log.includes(">>>"))                            return "text-accent-c";
  if (log.includes("") || log.includes("Sending"))                        return "text-primary-c";
  return "text-sub";
}

interface FloatingTerminalProps {
  logs: string[];
  onClearLogs: () => void;
  onClose: () => void;
}

const DOCK_MIN = 120;
const DOCK_MAX_VH = 0.8; // up to 80% of the viewport height
const LS_DOCKED = "kkn_terminal_docked";
const LS_HEIGHT = "kkn_terminal_dock_height";

export function FloatingTerminal({ logs, onClearLogs, onClose }: FloatingTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const logsEndRef  = useRef<HTMLDivElement>(null);
  const [position, setPosition]     = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [docked, setDocked] = useState<boolean>(() => localStorage.getItem(LS_DOCKED) === "1");
  const [dockHeight, setDockHeight] = useState<number>(() => {
    const saved = Number(localStorage.getItem(LS_HEIGHT));
    return Number.isFinite(saved) && saved >= DOCK_MIN ? saved : 260;
  });
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);
  useEffect(() => { localStorage.setItem(LS_DOCKED, docked ? "1" : "0"); }, [docked]);
  useEffect(() => { localStorage.setItem(LS_HEIGHT, String(dockHeight)); }, [dockHeight]);

  // Title-bar drag (floating mode only)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (docked || !terminalRef.current) return;
    const rect = terminalRef.current.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsDragging(true);
    e.preventDefault();
  }, [docked]);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => setPosition({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
    const onUp   = () => setIsDragging(false);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }, [isDragging, dragOffset]);

  // Top-edge resize handle (docked mode only)
  useEffect(() => {
    if (!isResizing) return;
    const onMove = (e: MouseEvent) => {
      const max = window.innerHeight * DOCK_MAX_VH;
      const next = Math.max(DOCK_MIN, Math.min(max, window.innerHeight - e.clientY));
      setDockHeight(next);
    };
    const onUp = () => setIsResizing(false);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }, [isResizing]);

  const dock = () => { setDocked(true); setPosition(null); };
  const float = () => setDocked(false);

  return (
    <div
      ref={terminalRef}
      className={`fixed z-20 flex flex-col overflow-hidden shadow-2xl bg-page border-subtle ${
        docked
          ? "left-0 right-0 bottom-0 border-t"
          : "w-[700px] max-w-[95vw] rounded-2xl border"
      }`}
      style={
        docked
          ? { height: dockHeight }
          : position
            ? { left: position.x, top: position.y }
            : { left: "50%", bottom: 64, transform: "translateX(-50%)" }
      }
    >
      {/* Top-edge resize handle (docked only) */}
      {docked && (
        <div
          onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }}
          className="absolute inset-x-0 top-0 z-30 h-1.5 cursor-ns-resize hover:bg-accent-c/40"
          title="Drag to resize"
        />
      )}

      {/* Title bar */}
      <div
        className={`flex h-9 items-center justify-between px-3 select-none bg-accent-tint border-b border-subtle ${
          docked ? "" : "cursor-move"
        }`}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-accent-c" />
          <span className="text-xs font-bold text-accent-c">WebTerminal</span>
          <button
            className="btn btn-ghost btn-xs text-hint"
            onClick={onClearLogs}
            onMouseDown={(e) => e.stopPropagation()}
            title="Clear logs"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={docked ? float : dock}
            onMouseDown={(e) => e.stopPropagation()}
            className="btn btn-ghost btn-xs text-sub"
            title={docked ? "Float terminal" : "Dock to bottom"}
          >
            {docked ? <PictureInPicture2 className="h-4 w-4" /> : <PanelBottom className="h-4 w-4" />}
          </button>
          <button
            onClick={onClose}
            onMouseDown={(e) => e.stopPropagation()}
            className="btn btn-ghost btn-xs text-sub"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Log output */}
      <div className={`overflow-auto p-3 font-mono text-xs ${docked ? "flex-1 min-h-0" : "h-[250px]"}`}>
        {logs.length === 0
          ? <p className="text-hint">Connected. Waiting for output…</p>
          : logs.map((log, i) => (
            <div key={i} className={`py-0.5 leading-5 ${logColor(log)}`}>{log}</div>
          ))
        }
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}
