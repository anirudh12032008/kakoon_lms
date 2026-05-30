import { useRef, useEffect, useCallback, useState } from "react";
import { Trash2, X } from "lucide-react";

function getLogColor(log: string): string {
  if (log.includes("❌") || log.includes("error") || log.includes("Error")) return "text-red-400";
  if (log.includes("✅") || log.includes("🚀") || log.includes("success")) return "text-emerald-400";
  if (log.includes("⚠️") || log.includes("warning")) return "text-amber-400";
  if (log.includes("📥") || log.includes(">>>")) return "text-cyan-400";
  if (log.includes("📤") || log.includes("Sending")) return "text-violet-400";
  return "text-zinc-400";
}

interface FloatingTerminalProps {
  logs: string[];
  onClearLogs: () => void;
  onClose: () => void;
}

export function FloatingTerminal({ logs, onClearLogs, onClose }: FloatingTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
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
    const onUp = () => setIsDragging(false);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }, [isDragging, dragOffset]);

  return (
    <div
      ref={terminalRef}
      className="fixed z-20 w-[700px] max-w-[95vw] overflow-hidden rounded-lg border border-[#2a2a30] bg-[#0a0a0c] shadow-2xl"
      style={position
        ? { left: position.x, top: position.y }
        : { left: "50%", bottom: 64, transform: "translateX(-50%)" }
      }
    >
      <div
        className="flex h-9 cursor-move items-center justify-between border-b border-[#1f1f23] bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-3 select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-cyan-400">WebTerminal</span>
          <button
            className="rounded p-0.5 hover:bg-white/10 text-zinc-500"
            onClick={onClearLogs}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
        <button
          onClick={onClose}
          onMouseDown={(e) => e.stopPropagation()}
          className="rounded p-0.5 text-zinc-400 hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="h-[250px] overflow-auto p-3 font-mono text-xs">
        {logs.length === 0
          ? <p className="text-zinc-500">Connected. Waiting for output...</p>
          : logs.map((log, i) => (
            <div key={i} className={`py-0.5 ${getLogColor(log)}`}>{log}</div>
          ))
        }
        <div ref={logsEndRef} />
      </div>
    </div>
  );
}
