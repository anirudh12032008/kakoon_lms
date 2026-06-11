/**
 * FirmwareFlasher — flashes MicroPython v1.25.0 onto ESP32-S3 via WebSerial
 * Firmware is bundled at /public/firmware/esp32s3-micropython.bin
 */

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Cpu, AlertTriangle, CheckCircle, Loader2, Zap, Plus, Usb } from "lucide-react";
import { ESPLoader, Transport } from "esptool-js";

type FlashState = "idle" | "connecting" | "erasing" | "flashing" | "done" | "error";

interface Props { onClose: () => void; }

export function FirmwareFlasher({ onClose }: Props) {
  const [state,        setState]        = useState<FlashState>("idle");
  const [progress,     setProgress]     = useState(0);
  const [log,          setLog]          = useState<string[]>([]);
  const [ports,        setPorts]        = useState<SerialPort[]>([]);
  const [selectedPort, setSelectedPort] = useState<SerialPort | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!("serial" in navigator)) return;
    navigator.serial.getPorts().then((p) => {
      setPorts(p);
      if (p.length === 1) setSelectedPort(p[0]);
    });
  }, []);

  const push = (msg: string) => {
    setLog(prev => [...prev.slice(-80), msg]);
    setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const isBusy = state === "connecting" || state === "erasing" || state === "flashing";

  const handleRequestPort = async () => {
    try {
      const port = await navigator.serial.requestPort();
      setPorts(prev => prev.includes(port) ? prev : [...prev, port]);
      setSelectedPort(port);
    } catch { /* user cancelled */ }
  };

  const handleFlash = async () => {
    if (!selectedPort) return;
    setState("connecting");
    setProgress(0);
    setLog([]);
    let transport: InstanceType<typeof Transport> | null = null;

    try {
      push("⏳ Connecting to ESP32-S3 bootloader…");
      transport = new Transport(selectedPort, false);

      const loader = new ESPLoader({
        transport,
        baudrate: 115200,
        terminal: {
          clean: () => {},
          writeLine: (line) => push(`  ${line}`),
          write: (str) => { if (str.trim()) push(`  ${str.trim()}`); },
        },
      });

      await loader.main();
      push("✅ Connected");

      setState("erasing");
      setProgress(10);
      push("🗑  Erasing flash (~10s)…");
      await loader.eraseFlash();
      setProgress(25);
      push("✅ Erased");

      setState("flashing");
      push("⬇️  Loading MicroPython v1.25.0…");
      const res = await fetch("/firmware/esp32s3-micropython.bin");
      if (!res.ok) throw new Error(`Firmware fetch failed (${res.status})`);
      const data = new Uint8Array(await res.arrayBuffer());
      if (data[0] !== 0xE9) throw new Error(`Invalid firmware header (0x${data[0].toString(16)})`);
      push(`✅ ${(data.length / 1024).toFixed(0)} KB ready`);
      push("⚡ Writing…");

      await loader.writeFlash({
        fileArray: [{ data, address: 0x0 }],
        flashMode: "keep", flashFreq: "keep", flashSize: "keep",
        eraseAll: false, compress: true,
        reportProgress: (_i, written, total) =>
          setProgress(Math.round(25 + (written / total) * 73)),
      });

      setProgress(100);
      push("✅ Done!");
      push("🎉 ESP32-S3 is running MicroPython v1.25.0. Connect now.");
      await loader.after();
      setState("done");

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (!msg.toLowerCase().includes("no port selected")) {
        push(`❌ ${msg}`);
        setState("error");
      } else {
        setState("idle");
      }
    } finally {
      try { await transport?.disconnect(); } catch { /* ignore */ }
    }
  };

  const portLabel = (p: SerialPort) => {
    const info = p.getInfo();
    if (info.usbVendorId && info.usbProductId)
      return `USB ${info.usbVendorId.toString(16).padStart(4,"0")}:${info.usbProductId.toString(16).padStart(4,"0")}`;
    return "USB Serial Port";
  };

  const stateColor: Record<FlashState, string> = {
    idle: "#6b7280", connecting: "#3b82f6", erasing: "#f97316",
    flashing: "#8b5cf6", done: "#22c55e", error: "#ef4444",
  };
  const stateLabel: Record<FlashState, string> = {
    idle: "Ready", connecting: "Connecting…", erasing: "Erasing…",
    flashing: "Flashing…", done: "Done! 🎉", error: "Error",
  };

  const noSerial = !("serial" in navigator);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !isBusy) onClose(); }}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--k-border)] bg-[var(--k-base-100)] shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--k-border)] bg-gradient-to-r from-violet-500/10 to-blue-500/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Flash Firmware</h2>
              <p className="text-[10px] text-[var(--k-muted)]">ESP32-S3 · MicroPython v1.25.0</p>
            </div>
          </div>
          {!isBusy && (
            <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--k-muted)] hover:text-[var(--k-text)] hover:bg-[var(--k-base-400)]">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-5 space-y-4">

          {noSerial && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Web Serial not supported — open in Chrome or Edge.
            </div>
          )}

          {/* Port picker */}
          {!noSerial && (
            <div>
              <p className="text-[10px] text-[var(--k-muted)] uppercase tracking-wider font-bold mb-2">Select Port</p>
              <div className="space-y-1.5">
                {ports.map((p, i) => (
                  <button key={i} onClick={() => !isBusy && setSelectedPort(p)} disabled={isBusy}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border text-sm transition-all ${
                      selectedPort === p
                        ? "border-violet-500/50 bg-violet-500/10 text-white"
                        : "border-[var(--k-border)] text-[var(--k-muted)] hover:border-[var(--k-dim)] hover:text-[var(--k-text)]"
                    }`}>
                    <Usb className="w-3.5 h-3.5 shrink-0" style={{ color: selectedPort === p ? "#8b5cf6" : undefined }} />
                    <span className="font-mono text-[11px] flex-1 text-left">{portLabel(p)}</span>
                    {selectedPort === p && <span className="text-[9px] text-violet-400 font-semibold">Selected</span>}
                  </button>
                ))}
                <button onClick={handleRequestPort} disabled={isBusy}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border border-dashed border-[var(--k-border)] text-[var(--k-dim)] hover:border-[var(--k-dim)] hover:text-[var(--k-muted)] text-[11px] transition-all disabled:opacity-40">
                  <Plus className="w-3.5 h-3.5" />
                  {ports.length === 0 ? "Select a port…" : "Add another port"}
                </button>
              </div>
            </div>
          )}

          {/* Boot instructions */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-1.5">
            <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">⚠️ Enter bootloader first</p>
            {[
              <>Hold <kbd className="px-1 py-0.5 rounded bg-[var(--k-base-400)] border border-[var(--k-border)] font-mono text-[10px]">BOOT</kbd> button</>,
              <>Press &amp; release <kbd className="px-1 py-0.5 rounded bg-[var(--k-base-400)] border border-[var(--k-border)] font-mono text-[10px]">RESET</kbd> (or replug USB)</>,
              <>Release <kbd className="px-1 py-0.5 rounded bg-[var(--k-base-400)] border border-[var(--k-border)] font-mono text-[10px]">BOOT</kbd> — then click Flash</>,
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px] text-[var(--k-text)]">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold shrink-0">{i+1}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>

          {/* Progress + log */}
          <div className="rounded-xl border border-[var(--k-base-400)] bg-[var(--k-base-100)] p-3 space-y-2">
            <div className="flex items-center gap-2">
              {isBusy              && <Loader2       className="w-3.5 h-3.5 animate-spin" style={{ color: stateColor[state] }} />}
              {state === "done"    && <CheckCircle   className="w-3.5 h-3.5 text-green-400" />}
              {state === "error"   && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
              {state === "idle"    && <Zap           className="w-3.5 h-3.5 text-[var(--k-muted)]" />}
              <span className="text-xs font-bold" style={{ color: stateColor[state] }}>{stateLabel[state]}</span>
              {isBusy && <span className="ml-auto text-[10px] font-mono text-[var(--k-muted)]">{progress}%</span>}
            </div>
            {state !== "idle" && (
              <div className="w-full h-1.5 rounded-full bg-[var(--k-base-300)] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, background: stateColor[state] }} />
              </div>
            )}
            <div className="bg-[var(--k-base-100)] rounded-lg p-2 h-[90px] overflow-y-auto font-mono text-[9px] space-y-0.5">
              {log.length === 0
                ? <span className="text-[var(--k-dim)]">Log will appear here…</span>
                : log.map((l, i) => (
                  <div key={i} className={
                    l.includes("❌") ? "text-red-400" :
                    l.includes("✅") || l.includes("🎉") ? "text-green-400" :
                    l.includes("⚡") || l.includes("⬇️") ? "text-violet-400" :
                    l.includes("🗑") ? "text-orange-400" : "text-[var(--k-muted)]"
                  }>{l}</div>
                ))
              }
              <div ref={logEndRef} />
            </div>
          </div>

          {state === "done" ? (
            <button onClick={onClose}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500/20 border border-green-500/40 text-green-400 text-sm font-bold hover:bg-green-500/30 transition-all">
              <CheckCircle className="w-4 h-4" /> Close — Board is ready!
            </button>
          ) : (
            <button onClick={handleFlash} disabled={noSerial || isBusy || !selectedPort}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-blue-500 text-white text-sm font-bold hover:from-violet-600 hover:to-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              {isBusy
                ? <><Loader2 className="w-4 h-4 animate-spin" /> {stateLabel[state]}</>
                : <><Zap className="w-4 h-4" /> Flash MicroPython</>
              }
            </button>
          )}

          <p className="text-[9px] text-[var(--k-dim)] text-center">
            Erases the board and installs MicroPython v1.25.0. Save your project first!
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
