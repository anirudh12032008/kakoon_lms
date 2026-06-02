import { useRef, useEffect, useCallback, useState } from "react";
import { Trash2, X, Terminal } from "lucide-react";

function logColor(log: string): string {
  if (log.includes("❌") || log.includes("error") || log.includes("Error")) return "var(--k-error)";
  if (log.includes("✅") || log.includes("🚀") || log.includes("success"))  return "var(--k-success)";
  if (log.includes("⚠️") || log.includes("warning"))                        return "var(--k-warning)";
  if (log.includes("📥") || log.includes(">>>"))                            return "var(--k-accent)";
  if (log.includes("📤") || log.includes("Sending"))                        return "var(--k-primary)";
  return "var(--k-text-muted)";
}

interface FloatingTerminalProps {
  logs: string[];
  onClearLogs: () => void;
  onClose: () => void;
}

export function FloatingTerminal({ logs, onClearLogs, onClose }: FloatingTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const logsEndRef  = useRef<HTMLDivElement>(null);
  const [position, setPosition]     = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (terminalRef.current) {
      const rect = terminalRef.current.getBoundingClientRect();
      setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setIsDragging(true);
      e.preventDefault();
    }
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => setPosition({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
    const onUp   = () => setIsDragging(false);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }, [isDragging, dragOffset]);

  return (
    <div
      ref={terminalRef}
      className="fixed z-20 w-[700px] max-w-[95vw] overflow-hidden rounded-2xl shadow-2xl"
      style={{
        border: "1px solid var(--k-border)",
        background: "var(--k-base-100)",
        ...(position
          ? { left: position.x, top: position.y }
          : { left: "50%", bottom: 64, transform: "translateX(-50%)" }),
      }}
    >
      {/* Title bar */}
      <div
        className="flex h-9 cursor-move items-center justify-between px-3 select-none"
        style={{
          background: "linear-gradient(90deg, color-mix(in srgb, var(--k-accent) 15%, transparent), color-mix(in srgb, var(--k-primary) 10%, transparent))",
          borderBottom: "1px solid var(--k-border)",
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5" style={{ color: "var(--k-accent)" }} />
          <span className="text-xs font-bold" style={{ color: "var(--k-accent)" }}>WebTerminal</span>
          <button
            className="btn btn-ghost btn-xs"
            onClick={onClearLogs}
            onMouseDown={(e) => e.stopPropagation()}
            title="Clear logs"
            style={{ color: "var(--k-text-dim)" }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <button
          onClick={onClose}
          onMouseDown={(e) => e.stopPropagation()}
          className="btn btn-ghost btn-xs"
          style={{ color: "var(--k-text-muted)" }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Log output */}
      <div className="h-[250px] overflow-auto p-3 font-mono text-xs">
        {logs.length === 0
          ? <p style={{ color: "var(--k-text-dim)" }}>Connected. Waiting for output…</p>
          : logs.map((log, i) => (
            <div key={i} className="py-0.5 leading-5" style={{ color: logColor(log) }}>{log}</div>
          ))
        }
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}
