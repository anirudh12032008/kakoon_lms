import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Package, Upload, CheckCircle, Loader2, AlertTriangle, Search } from "lucide-react";
import {
  LIBRARY_REGISTRY, getRequiredLibraries, CATEGORY_COLORS,
  type LibraryEntry,
} from "@/features/editor/install-library/lib/libraryRegistry";

interface Props {
  code: string;
  isConnected: boolean;
  onUploadFile: (filename: string, content: string, onProgress: (p: number) => void) => Promise<boolean>;
  onClose: () => void;
}

type ProgressState = number | "done" | "error";

export function LibraryManager({ code, isConnected, onUploadFile, onClose }: Props) {
  const [progress, setProgress] = useState<Record<string, ProgressState>>({});
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [customProgress, setCustomProgress] = useState<ProgressState | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedCat, setExpandedCat] = useState<string>("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requiredLibs = getRequiredLibraries(code);

  const setLibProgress = (id: string, p: ProgressState) =>
    setProgress((prev) => ({ ...prev, [id]: p }));

  const installLib = async (lib: LibraryEntry) => {
    if (!isConnected) return;
    setLibProgress(lib.id, 0);
    try {
      const res = await fetch(lib.path);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const content = await res.text();
      const ok = await onUploadFile(lib.name, content, (p) => setLibProgress(lib.id, p));
      setLibProgress(lib.id, ok ? "done" : "error");
    } catch {
      setLibProgress(lib.id, "error");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".py")) { setCustomFile(file); setCustomProgress(null); }
  };

  const uploadCustom = async () => {
    if (!customFile || !isConnected) return;
    setCustomProgress(0);
    const content = await customFile.text();
    const ok = await onUploadFile(customFile.name, content, (p) => setCustomProgress(p));
    setCustomProgress(ok ? "done" : "error");
  };

  const filtered = LIBRARY_REGISTRY.filter((l) =>
    l.name.toLowerCase().includes(search.toLowerCase()) ||
    l.description.toLowerCase().includes(search.toLowerCase())
  );

  const categories = Array.from(new Set(LIBRARY_REGISTRY.map((l) => l.category)));

  function LibRow({ lib }: { lib: LibraryEntry }) {
    const p = progress[lib.id];
    const busy = typeof p === "number";
    const done = p === "done";
    const error = p === "error";
    const cc = CATEGORY_COLORS[lib.category];
    return (
      <div className="flex items-center gap-3 px-3 py-2.5 border-b border-[var(--k-base-200)] last:border-0 hover:bg-[var(--k-base-100)] transition-colors group">
        <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm"
          style={{ background: `${cc}15`, border: `1px solid ${cc}30` }}>
          {done ? "✅" : error ? "❌" : "📄"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs font-mono font-semibold text-white">{lib.name}</span>
            {lib.size && <span className="text-[9px] text-zinc-600">{lib.size}</span>}
          </div>
          <p className="text-[10px] text-zinc-500 leading-tight truncate">{lib.description}</p>
          {busy && (
            <div className="mt-1.5">
              <div className="w-full h-1 rounded-full bg-[var(--k-base-300)] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${p}%`, background: cc }} />
              </div>
            </div>
          )}
        </div>
        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold"
          style={{ color: cc, background: `${cc}15`, border: `1px solid ${cc}30` }}>
          {lib.category}
        </span>
        <button
          onClick={() => !done && installLib(lib)}
          disabled={busy || !isConnected}
          className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
            done
              ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
              : "bg-white/5 border border-white/10 text-[var(--k-text)] hover:bg-white/10"
          }`}
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> :
           done ? <CheckCircle className="w-3 h-3" /> :
           <Upload className="w-3 h-3" />}
          {busy ? `${p}%` : done ? "Installed" : "Install"}
        </button>
      </div>
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-[var(--k-border)] bg-[var(--k-base-100)] shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--k-border)] bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Library Manager</h2>
              <p className="text-[10px] text-zinc-500">Install MicroPython libraries to your ESP32</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--k-muted)] hover:text-white hover:bg-white/10 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Not connected warning */}
        {!isConnected && (
          <div className="mx-4 mt-3 flex items-center gap-2 px-3 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 text-xs">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            Connect to your ESP32 first to install libraries.
          </div>
        )}

        <div className="flex-1 overflow-y-auto">

          {/* Required by current code */}
          {requiredLibs.length > 0 && (
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-widest font-bold text-violet-400">Detected in your code</span>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-violet-500/20 text-violet-400 border border-violet-500/30">
                  {requiredLibs.length}
                </span>
              </div>
              <div className="rounded-xl border border-[var(--k-base-400)] overflow-hidden bg-[var(--k-base-100)]">
                {requiredLibs.map((lib) => <LibRow key={lib.id} lib={lib} />)}
              </div>
            </div>
          )}
          {requiredLibs.length === 0 && (
            <div className="mx-4 mt-4 px-4 py-3 rounded-xl border border-[var(--k-base-400)] bg-[var(--k-base-100)] text-center">
              <p className="text-xs text-zinc-500">No external libraries detected in your current code. Add hardware blocks to see what's needed.</p>
            </div>
          )}

          {/* Search + All libs */}
          <div className="px-4 pt-4 pb-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--k-muted)]">All Bundled Libraries</span>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-zinc-700/50 text-[var(--k-muted)] border border-zinc-700/50">
                {LIBRARY_REGISTRY.length}
              </span>
            </div>
            {/* Search */}
            <div className="flex items-center gap-2 bg-[var(--k-base-100)] border border-[var(--k-base-400)] rounded-xl px-3 py-2 mb-3">
              <Search className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search libraries…"
                className="bg-transparent text-xs text-white outline-none flex-1 placeholder:text-zinc-600"
              />
            </div>

            {/* Category filter pills */}
            <div className="flex gap-1.5 flex-wrap mb-3">
              {["all", ...categories].map((cat) => (
                <button key={cat} onClick={() => setExpandedCat(cat)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                    expandedCat === cat
                      ? "bg-violet-500/25 text-violet-300 border border-violet-500/40"
                      : "bg-[var(--k-border)] text-[var(--k-muted)] border border-[var(--k-border)] hover:border-zinc-600"
                  }`}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  {cat !== "all" && (
                    <span className="ml-1 opacity-60">
                      {LIBRARY_REGISTRY.filter((l) => l.category === cat).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-[var(--k-base-400)] overflow-hidden bg-[var(--k-base-100)]">
              {filtered
                .filter((l) => expandedCat === "all" || l.category === expandedCat)
                .map((lib) => <LibRow key={lib.id} lib={lib} />)
              }
            </div>
          </div>

          {/* Custom upload */}
          <div className="px-4 pt-3 pb-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--k-muted)]">Upload Custom Library</span>
            </div>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
                dragOver
                  ? "border-violet-400 bg-violet-500/10"
                  : "border-[var(--k-border)] bg-[var(--k-base-100)] hover:border-zinc-600 hover:bg-[#0f0f13]"
              }`}
            >
              <div className="text-3xl mb-2">📂</div>
              <p className="text-xs font-semibold text-[var(--k-text)] mb-1">Drop a .py file here or click to browse</p>
              <p className="text-[10px] text-zinc-600">Upload any MicroPython library directly to your ESP32</p>
              <input ref={fileInputRef} type="file" accept=".py" className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f?.name.endsWith(".py")) { setCustomFile(f); setCustomProgress(null); }
                }} />
            </div>

            {customFile && (
              <div className="mt-3 flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[var(--k-base-400)] bg-[var(--k-base-100)]">
                <span className="text-lg">📄</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono font-semibold text-white truncate">{customFile.name}</p>
                  <p className="text-[10px] text-zinc-600">{(customFile.size / 1024).toFixed(1)} KB</p>
                  {typeof customProgress === "number" && (
                    <div className="mt-1.5 w-full h-1 rounded-full bg-[var(--k-base-300)] overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full transition-all duration-300"
                        style={{ width: `${customProgress}%` }} />
                    </div>
                  )}
                  {customProgress === "done" && <p className="text-[10px] text-emerald-400 mt-0.5">✅ Installed successfully!</p>}
                  {customProgress === "error" && <p className="text-[10px] text-red-400 mt-0.5">❌ Upload failed. Try again.</p>}
                </div>
                <button onClick={() => { setCustomFile(null); setCustomProgress(null); }}
                  className="text-zinc-600 hover:text-[var(--k-text)] transition-colors text-lg font-bold">×</button>
              </div>
            )}

            <button
              onClick={uploadCustom}
              disabled={!customFile || !isConnected || typeof customProgress === "number"}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white text-xs font-bold transition-all hover:from-violet-600 hover:to-fuchsia-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {typeof customProgress === "number"
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading {customProgress}%</>
                : <><Upload className="w-3.5 h-3.5" /> Upload to ESP32</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
