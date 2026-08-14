/**
 * ESP32 File Explorer — draggable floating panel.
 *
 * Starts at filesystem root `/` and navigates into folders by clicking.
 * Detects directories via os.stat mode bit 0x4000.
 *
 * Parsing strategy: sends Python via sendCode (paste mode), then polls
 * the `logs` array for the tagged FS_LIST/FS_ERR marker lines.
 * This avoids the callback-timing race in sendPythonCode.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, RefreshCw, Trash2, HardDrive, ChevronRight, FolderOpen, FileText } from "lucide-react";
import { markOnDevice, loadAnimRegistry, saveAnimRegistry } from "@/shared/lib/animRegistry";

interface ESP32FilesPanelProps {
  isConnected: boolean;
  onClose: () => void;
  /** The live logs array from useSerialConnection — used to parse scan output */
  logs: string[];
  sendCode: (code: string) => Promise<boolean>;
}

interface DeviceEntry {
  name: string;
  isDir: boolean;
  size: number;
}

// ─── drag ─────────────────────────────────────────────────────────────────────
function useDrag(init: { x: number; y: number }) {
  const [pos, setPos] = useState(init);
  const drag = useRef(false);
  const off  = useRef({ x: 0, y: 0 });
  const onMouseDown = (e: React.MouseEvent) => {
    drag.current = true;
    off.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.preventDefault();
    const move = (ev: MouseEvent) => { if (drag.current) setPos({ x: ev.clientX - off.current.x, y: ev.clientY - off.current.y }); };
    const up   = () => { drag.current = false; window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };
  return { pos, onMouseDown };
}

// ─── path helpers ─────────────────────────────────────────────────────────────
function joinPath(parent: string, child: string) {
  return parent === "/" ? `/${child}` : `${parent}/${child}`;
}
function breadcrumbs(path: string): { label: string; path: string }[] {
  if (path === "/") return [{ label: "root", path: "/" }];
  const parts = path.split("/").filter(Boolean);
  return [
    { label: "root", path: "/" },
    ...parts.map((p, i) => ({ label: p, path: "/" + parts.slice(0, i + 1).join("/") })),
  ];
}

// ─── Python to send (multi-line for readability, safe try/except) ─────────────
// Each line is sent individually through paste mode.
// The output marker is "FS_LIST:" or "FS_ERR:" — parsed from the logs array.
function buildScanPython(path: string): string {
  const p = path.replace(/'/g, "\\'");
  // Build a full path string: for root use just '/' + f, else '/dir/' + f
  const fp = p === "/" ? `'/'+ f` : `'${p}'.rstrip('/')+ '/'+ f`;
  return [
    `import os, ujson`,
    `try:`,
    `  _l = []`,
    `  for f in os.listdir('${p}'):`,
    `    try:`,
    `      _st = os.stat(${fp})`,
    `      _l.append({'n': f, 'd': bool(_st[0] & 0x4000), 's': _st[6]})`,
    `    except:`,
    `      _l.append({'n': f, 'd': False, 's': 0})`,
    `  print('FS_LIST:' + ujson.dumps(_l))`,
    `except Exception as e:`,
    `  print('FS_ERR:' + str(e))`,
  ].join("\n");
}

// ─── strip the "[HH:MM:SS] " prefix that addLog prepends ──────────────────
function stripPrefix(line: string): string {
  return line.replace(/^\[.*?\]\s*\s*/, "").trim();
}

// ─── component ────────────────────────────────────────────────────────────────
export function ESP32FilesPanel({ isConnected, onClose, logs, sendCode }: ESP32FilesPanelProps) {
  const { pos, onMouseDown } = useDrag({ x: 60, y: 80 });

  const [path, setPath]         = useState("/");
  const [entries, setEntries]   = useState<DeviceEntry[]>([]);
  const [scanning, setScanning] = useState(false);
  const [status, setStatus]     = useState("");
  const [deletingName, setDeletingName] = useState<string | null>(null);

  // Track how many log lines existed before we started a scan
  const prevLogLen = useRef(0);
  const scanTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── parse logs for FS_LIST / FS_ERR after scan ────────────────────────────
  useEffect(() => {
    if (!scanning) return;
    // Only look at lines that appeared AFTER we started this scan
    const newLines = logs.slice(prevLogLen.current).map(stripPrefix);
    const listLine = newLines.find(l => l.startsWith("FS_LIST:"));
    const errLine  = newLines.find(l => l.startsWith("FS_ERR:"));

    if (listLine) {
      if (scanTimeout.current) clearTimeout(scanTimeout.current);
      try {
        type Raw = { n: string; d: boolean; s: number };
        const raw = JSON.parse(listLine.slice("FS_LIST:".length)) as Raw[];
        const parsed: DeviceEntry[] = raw
          .map(r => ({ name: r.n, isDir: r.d, size: r.s }))
          .sort((a, b) => (a.isDir === b.isDir ? a.name.localeCompare(b.name) : a.isDir ? -1 : 1));
        setEntries(parsed);
        setStatus(`${parsed.length} item${parsed.length !== 1 ? "s" : ""}`);
      } catch {
        setStatus("Could not parse file listing");
      }
      setScanning(false);
    } else if (errLine) {
      if (scanTimeout.current) clearTimeout(scanTimeout.current);
      const msg = errLine.slice("FS_ERR:".length);
      setStatus(msg.includes("ENOENT") || msg.includes("OSError") ? "Folder doesn't exist yet" : `${msg}`);
      setScanning(false);
    }
  }, [logs, scanning]);

  // ── start a scan ──────────────────────────────────────────────────────────
  const scan = useCallback(async (targetPath: string) => {
    if (!isConnected) { setStatus("Connect to ESP32 first"); return; }
    setScanning(true);
    setStatus("Scanning…");
    setEntries([]);
    prevLogLen.current = logs.length; // snapshot before any new lines arrive

    // Set timeout BEFORE awaiting sendCode so the useEffect success path
    // can always clear it — even if FS_LIST arrives while sendCode is still awaited.
    if (scanTimeout.current) clearTimeout(scanTimeout.current);
    scanTimeout.current = setTimeout(() => {
      setScanning(false);
      setStatus("No response from device (timeout)");
    }, 8000);

    const ok = await sendCode(buildScanPython(targetPath));
    if (!ok) {
      clearTimeout(scanTimeout.current!);
      setScanning(false);
      setStatus("Failed to send — not connected?");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, logs.length, sendCode]);

  // ── navigate into folder ──────────────────────────────────────────────────
  const navigate = (entry: DeviceEntry) => {
    if (!entry.isDir) return;
    const next = joinPath(path, entry.name);
    setPath(next);
    scan(next);
  };

  // ── delete file ───────────────────────────────────────────────────────────
  const deleteEntry = useCallback(async (entry: DeviceEntry) => {
    const fullPath = joinPath(path, entry.name);
    setDeletingName(entry.name);
    await sendCode(`import os\ntry:\n os.remove('${fullPath}')\nexcept: pass\nprint('FS_DEL:done')\n`);
    setEntries(prev => prev.filter(e => e.name !== entry.name));
    // Mark animation as off-device in local registry
    const animName = entry.name.replace(/\.bin$/, "");
    const reg = loadAnimRegistry();
    if (reg.some(e => e.name === animName)) {
      saveAnimRegistry(reg.map(e => e.name === animName ? { ...e, onDevice: false } : e));
      markOnDevice(animName, false);
    }
    setDeletingName(null);
  }, [path, sendCode]);

  const crumbs = breadcrumbs(path);
  const fmtSize = (b: number) => b < 1024 ? `${b} B` : `${(b / 1024).toFixed(1)} KB`;

  return createPortal(
    <div
      className="fixed z-[8800] flex flex-col overflow-hidden rounded-2xl border border-[var(--k-border)] bg-[var(--k-base-100)] shadow-2xl select-none"
      style={{ left: pos.x, top: pos.y, width: 380, maxHeight: "72vh" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2.5 cursor-move flex-shrink-0"
        style={{ background: "var(--k-base-300)", borderBottom: "1px solid var(--k-border)" }}
        onMouseDown={onMouseDown}
      >
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-white">ESP32 File Explorer</span>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg text-[var(--k-muted)] hover:text-[var(--k-text)] hover:bg-[var(--k-base-400)] transition-all">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-0.5 px-3 py-2 bg-[var(--k-base-300)] border-b border-[var(--k-border)] flex-shrink-0 flex-wrap min-h-[36px]">
        {crumbs.map((c, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={c.path} className="flex items-center">
              {i > 0 && <ChevronRight className="w-3 h-3 text-[var(--k-dim)] mx-0.5 flex-shrink-0" />}
              <button
                onClick={() => { if (!isLast) { setPath(c.path); scan(c.path); } }}
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-all ${
                  isLast ? "text-emerald-400 font-bold cursor-default" : "text-[var(--k-muted)] hover:text-[var(--k-text)] hover:bg-[var(--k-base-400)]"
                }`}
              >{c.label}</button>
            </span>
          );
        })}
        <button
          onClick={() => scan(path)}
          disabled={!isConnected || scanning}
          title="Refresh"
          className="ml-auto p-1 rounded-lg text-[var(--k-muted)] hover:text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${scanning ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Not connected banner */}
      {!isConnected && (
        <div className="px-3 py-2 text-[10px] text-amber-400 bg-amber-500/10 border-b border-[var(--k-border)] flex-shrink-0">
          Connect to ESP32 to browse files
        </div>
      )}

      {/* File list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 min-h-0">
        {entries.length === 0 && !scanning ? (
          <div className="text-center py-10 flex flex-col items-center gap-3">
            <HardDrive className="w-8 h-8 text-[var(--k-dim)]" />
            <p className="text-[11px] text-[var(--k-dim)] max-w-48 text-center leading-relaxed">
              {status || (isConnected ? "Tap Scan to browse the ESP32 filesystem" : "Connect your ESP32 first")}
            </p>
            {isConnected && (
              <button
                onClick={() => scan(path)}
                disabled={scanning}
                className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-bold hover:bg-emerald-500/20 transition-all disabled:opacity-40"
              >
                {scanning ? "Scanning…" : `Scan ${path}`}
              </button>
            )}
          </div>
        ) : (
          entries.map(entry => (
            <div
              key={entry.name}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl border transition-all ${
                entry.isDir
                  ? "border-transparent hover:border-amber-500/20 hover:bg-amber-500/5 cursor-pointer"
                  : "border-transparent hover:border-[var(--k-base-400)] hover:bg-[var(--k-base-100)]"
              }`}
              onClick={() => navigate(entry)}
            >
              <span className="flex-shrink-0">
                {entry.isDir
                  ? <FolderOpen className="w-4 h-4 text-amber-400" />
                  : entry.name.endsWith(".bin")
                    ? <span className="text-base leading-none"></span>
                    : entry.name.endsWith(".py")
                      ? <span className="text-base leading-none"></span>
                      : <FileText className="w-4 h-4 text-[var(--k-muted)]" />
                }
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] font-mono truncate ${entry.isDir ? "text-amber-300" : "text-[var(--k-text)]"}`}>
                  {entry.name}
                </p>
                {!entry.isDir && <p className="text-[9px] text-[var(--k-dim)]">{fmtSize(entry.size)}</p>}
              </div>
              {entry.isDir
                ? <ChevronRight className="w-3.5 h-3.5 text-[var(--k-dim)] flex-shrink-0" />
                : (
                  <button
                    onClick={e => { e.stopPropagation(); deleteEntry(entry); }}
                    disabled={deletingName === entry.name}
                    className="p-1.5 rounded-lg text-[var(--k-dim)] hover:text-red-400 hover:bg-red-500/10 disabled:opacity-40 transition-all flex-shrink-0"
                    title={`Delete ${entry.name}`}
                  >
                    {deletingName === entry.name
                      ? <RefreshCw className="w-3 h-3 animate-spin" />
                      : <Trash2 className="w-3 h-3" />
                    }
                  </button>
                )
              }
            </div>
          ))
        )}
      </div>

      {/* Status bar */}
      <div className="px-3 py-1.5 border-t border-[var(--k-border)] bg-[var(--k-base-100)] flex items-center justify-between flex-shrink-0">
        <span className="text-[9px] text-[var(--k-dim)] truncate">{scanning ? "" : ""}{status}</span>
        <span className="text-[9px] font-mono text-[var(--k-dim)] flex-shrink-0 ml-2">{path}</span>
      </div>
    </div>,
    document.body
  );
}
