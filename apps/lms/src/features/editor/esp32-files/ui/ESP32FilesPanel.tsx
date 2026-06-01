/**
 * ESP32 File Explorer — floating panel for browsing and deleting
 * files on the connected ESP32's filesystem via Web Serial.
 *
 * Currently focused on the /anim/ folder but can browse any path.
 */

import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, FolderOpen, RefreshCw, Trash2, HardDrive } from "lucide-react";
import { markOnDevice, loadAnimRegistry, saveAnimRegistry } from "@/shared/lib/animRegistry";

interface ESP32FilesPanelProps {
  isConnected: boolean;
  onClose: () => void;
  /** Send a one-shot Python snippet and return its stdout output */
  sendPythonCode: (code: string, timeoutMs?: number) => Promise<string | null>;
  /** Raw sendCode for delete operations */
  sendCode: (code: string) => Promise<boolean>;
}

interface DeviceFile {
  name: string;
  path: string;
  size?: number;
}

function useDrag(initial: { x: number; y: number }) {
  const [pos, setPos] = useState(initial);
  const dragging = { current: false };
  const offset = { current: { x: 0, y: 0 } };

  const onMouseDown = (e: React.MouseEvent) => {
    dragging.current = true;
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.preventDefault();
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      setPos({ x: ev.clientX - offset.current.x, y: ev.clientY - offset.current.y });
    };
    const onUp = () => { dragging.current = false; window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return { pos, onMouseDown };
}

export function ESP32FilesPanel({ isConnected, onClose, sendPythonCode, sendCode }: ESP32FilesPanelProps) {
  const { pos, onMouseDown } = useDrag({ x: 60, y: 80 });

  const [path, setPath] = useState("/anim");
  const [files, setFiles] = useState<DeviceFile[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState("");
  const [deletingFile, setDeletingFile] = useState<string | null>(null);

  const scan = useCallback(async () => {
    if (!isConnected) { setScanMsg("⚠️ Connect to ESP32 first"); return; }
    setScanning(true);
    setScanMsg("Scanning…");
    setFiles([]);

    const code =
      `import os, ujson\n` +
      `try:\n` +
      `    items=[]\n` +
      `    for f in os.listdir('${path}'):\n` +
      `        full='${path}/'+f\n` +
      `        try: sz=os.stat(full)[6]\n` +
      `        except: sz=0\n` +
      `        items.append({'name':f,'size':sz})\n` +
      `    print('FS_LIST:'+ujson.dumps(items))\n` +
      `except Exception as e:\n` +
      `    print('FS_ERR:'+str(e))\n`;

    const output = await sendPythonCode(code, 4000);
    if (!output) { setScanMsg("❌ No response — check connection"); setScanning(false); return; }

    const listLine = output.split("\n").find(l => l.includes("FS_LIST:"));
    const errLine  = output.split("\n").find(l => l.includes("FS_ERR:"));

    if (errLine) {
      const msg = errLine.replace(/.*FS_ERR:/, "").trim();
      setScanMsg(msg.includes("ENOENT") || msg.includes("OSError") ? `📁 Folder "${path}" doesn't exist yet` : `❌ ${msg}`);
    } else if (listLine) {
      try {
        const raw = JSON.parse(listLine.replace(/.*FS_LIST:/, "").trim()) as { name: string; size: number }[];
        const parsed: DeviceFile[] = raw.map(r => ({ name: r.name, path: `${path}/${r.name}`, size: r.size }));
        setFiles(parsed);
        setScanMsg(parsed.length === 0 ? "📭 Folder is empty" : `✅ ${parsed.length} file${parsed.length !== 1 ? "s" : ""}`);
      } catch { setScanMsg("❌ Could not parse response"); }
    } else {
      setScanMsg("❌ Unexpected response from device");
    }
    setScanning(false);
  }, [isConnected, path, sendPythonCode]);

  const deleteFile = useCallback(async (file: DeviceFile) => {
    setDeletingFile(file.name);
    const ok = await sendCode(`import os\ntry: os.remove('${file.path}')\nexcept: pass\nprint('FS_DEL:${file.name}')\n`);
    if (ok) {
      setFiles(prev => prev.filter(f => f.name !== file.name));
      // Mark as not-on-device in local registry if it's an animation
      const animName = file.name.replace(/\.bin$/, "");
      const reg = loadAnimRegistry();
      if (reg.some(e => e.name === animName)) {
        markOnDevice(animName, false);
        saveAnimRegistry(reg.map(e => e.name === animName ? { ...e, onDevice: false } : e));
      }
    }
    setDeletingFile(null);
  }, [sendCode]);

  const fmtSize = (b?: number) => {
    if (b === undefined) return "";
    if (b < 1024) return `${b} B`;
    return `${(b / 1024).toFixed(1)} KB`;
  };

  return createPortal(
    <div
      className="fixed z-[8800] flex flex-col overflow-hidden rounded-2xl border border-[#2a2a32] bg-[#09090b] shadow-2xl select-none"
      style={{ left: pos.x, top: pos.y, width: 360 }}
    >
      {/* Header — drag handle */}
      <div
        className="flex items-center justify-between px-3 py-2.5 cursor-move border-b border-[#1a1a20]"
        style={{ background: "#1e193288", borderBottom: "1px solid #2a2a3a" }}
        onMouseDown={onMouseDown}
      >
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-white">ESP32 File Explorer</span>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg text-zinc-500 hover:text-white hover:bg-white/10">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Path bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1a1a20]">
        <FolderOpen className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
        <input
          value={path}
          onChange={e => setPath(e.target.value)}
          className="flex-1 text-[11px] font-mono bg-[#111116] border border-[#2d2d35] rounded-lg px-2 py-1 text-zinc-300 outline-none focus:border-emerald-500/50"
          onKeyDown={e => e.key === "Enter" && scan()}
        />
        <button
          onClick={scan}
          disabled={!isConnected || scanning}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <RefreshCw className={`w-3 h-3 ${scanning ? "animate-spin" : ""}`} />
          Scan
        </button>
      </div>

      {/* Connection notice */}
      {!isConnected && (
        <div className="px-3 py-2 text-[10px] text-amber-400 bg-amber-500/10 border-b border-[#1a1a20]">
          ⚡ Connect to ESP32 to browse files
        </div>
      )}

      {/* File list */}
      <div className="flex-1 overflow-y-auto max-h-72 p-2 space-y-1">
        {files.length === 0 && !scanning ? (
          <div className="text-center py-8 text-zinc-600 text-[11px]">
            {scanMsg || `Press Scan to list files in ${path}`}
          </div>
        ) : (
          files.map(file => (
            <div
              key={file.name}
              className="flex items-center gap-2 px-2.5 py-2 rounded-xl border border-[#1e1e26] bg-[#0c0c10] hover:border-[#2a2a35] transition-all"
            >
              <span className="text-sm">
                {file.name.endsWith(".bin") ? "🎬" : file.name.endsWith(".py") ? "🐍" : "📄"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-mono text-zinc-200 truncate">{file.name}</p>
                {file.size !== undefined && (
                  <p className="text-[9px] text-zinc-600">{fmtSize(file.size)}</p>
                )}
              </div>
              <button
                onClick={() => deleteFile(file)}
                disabled={deletingFile === file.name}
                className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
                title={`Delete ${file.name}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Status bar */}
      {scanMsg && files.length > 0 && (
        <div className="px-3 py-1.5 border-t border-[#1a1a20] text-[9px] text-zinc-600">
          {scanMsg}
        </div>
      )}
    </div>,
    document.body
  );
}
