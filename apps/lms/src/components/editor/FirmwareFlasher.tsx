/**
 * FirmwareFlasher — flashes MicroPython firmware onto ESP32 boards
 * Uses esptool-js (WebSerial) to detect the chip and write .bin firmware.
 * Firmware binaries should live in /public/firmware/<file>.bin
 */

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Cpu, AlertTriangle, CheckCircle, Loader2, Zap } from "lucide-react";
import { ESPLoader, Transport } from "esptool-js";

// ─── Chip → firmware map ───────────────────────────────────────────────────────
const FIRMWARE_MAP: Record<string, { label: string; file: string; color: string }> = {
  esp32:   { label: "ESP32",    file: "esp32-micropython.bin",   color: "#3b82f6" },
  esp32s3: { label: "ESP32-S3", file: "esp32s3-micropython.bin", color: "#8b5cf6" },
  esp32c3: { label: "ESP32-C3", file: "esp32c3-micropython.bin", color: "#14b8a6" },
  esp32s2: { label: "ESP32-S2", file: "esp32s2-micropython.bin", color: "#f97316" },
  esp32c6: { label: "ESP32-C6", file: "esp32c6-micropython.bin", color: "#22c55e" },
};

type FlashState = "idle" | "detecting" | "ready" | "erasing" | "flashing" | "done" | "error";

interface Props { onClose: () => void; }

export function FirmwareFlasher({ onClose }: Props) {
  const [flashState, setFlashState] = useState<FlashState>("idle");
  const [progress, setProgress] = useState(0);
  const [log, setLog] = useState<string[]>([]);
  const [detectedChip, setDetectedChip] = useState<string | null>(null);
  const [selectedChip, setSelectedChip] = useState("esp32s3");
  const [customFirmware, setCustomFirmware] = useState<File | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pushLog = (msg: string) => {
    setLog((prev) => [...prev.slice(-80), msg]);
    setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  const handleFlash = async () => {
    if (!("serial" in navigator)) {
      pushLog("❌ Web Serial API not supported. Use Chrome or Edge.");
      setFlashState("error");
      return;
    }

    setFlashState("detecting");
    setProgress(0);
    setLog([]);

    let transport: InstanceType<typeof Transport> | null = null;

    try {
      pushLog("🔍 Requesting serial port — select your ESP32 USB port…");
      const port = await navigator.serial.requestPort();
      transport = new Transport(port, true);

      pushLog("🔌 Connecting to ESP32 — hold the BOOT button on your board…");
      const loader = new ESPLoader({
        transport,
        baudrate: 115200,
        terminal: {
          clean: () => {},
          writeLine: (line: string) => pushLog(`  ${line}`),
          write: (str: string) => { if (str.trim()) pushLog(`  ${str.trim()}`); },
        },
      });

      const chip = await loader.main();
      const chipKey = chip.toLowerCase().replace(/[^a-z0-9]/g, "");
      setDetectedChip(chip);
      const mapped = Object.keys(FIRMWARE_MAP).find((k) => chipKey.includes(k)) ?? "esp32";
      setSelectedChip(mapped);
      pushLog(`✅ Detected: ${chip}`);
      pushLog(`📦 Using firmware: ${FIRMWARE_MAP[mapped].label} MicroPython`);
      setFlashState("ready");

      // Erase
      setFlashState("erasing");
      setProgress(10);
      pushLog("🗑  Erasing flash memory (~10 seconds)…");
      await loader.eraseFlash();
      setProgress(25);
      pushLog("✅ Flash erased.");

      // Fetch firmware binary
      setFlashState("flashing");
      let firmwareBuffer: ArrayBuffer;
      if (customFirmware) {
        pushLog(`📂 Loading custom firmware: ${customFirmware.name}`);
        firmwareBuffer = await customFirmware.arrayBuffer();
      } else {
        const fw = FIRMWARE_MAP[mapped];
        pushLog(`⬇️  Fetching /firmware/${fw.file}…`);
        const res = await fetch(`/firmware/${fw.file}`);
        if (!res.ok) throw new Error(`Firmware file not found: ${fw.file} (HTTP ${res.status}). Add it to /public/firmware/.`);
        firmwareBuffer = await res.arrayBuffer();
      }
      const firmwareData = new Uint8Array(firmwareBuffer);
      pushLog(`✅ Firmware loaded — ${(firmwareData.length / 1024).toFixed(0)} KB`);
      pushLog("⚡ Writing to flash…");

      await loader.writeFlash({
        fileArray: [{ data: firmwareData, address: 0x1000 }],
        flashMode: "keep",
        flashFreq: "keep",
        flashSize: "keep",
        eraseAll: false,
        compress: true,
        reportProgress: (_idx: number, written: number, total: number) => {
          const pct = Math.round(25 + (written / total) * 73);
          setProgress(pct);
        },
      });

      setProgress(100);
      pushLog("✅ Firmware written successfully!");
      pushLog("🔄 Resetting board…");
      await loader.after();
      pushLog("🎉 Done! Your ESP32 is now running MicroPython.");
      setFlashState("done");

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      pushLog(`❌ ${msg}`);
      setFlashState("error");
    } finally {
      try { await transport?.disconnect(); } catch { /* ignore */ }
    }
  };

  const stateColor: Record<FlashState, string> = {
    idle: "#6b7280", detecting: "#3b82f6", ready: "#22c55e",
    erasing: "#f97316", flashing: "#8b5cf6", done: "#22c55e", error: "#ef4444",
  };
  const stateLabel: Record<FlashState, string> = {
    idle: "Ready", detecting: "Detecting chip…", ready: "Chip found!",
    erasing: "Erasing flash…", flashing: "Flashing…", done: "Done! 🎉", error: "Error",
  };

  const isBusy = flashState === "detecting" || flashState === "erasing" || flashState === "flashing";

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !isBusy) onClose(); }}
    >
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-[#2a2a32] bg-[#09090b] shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a20] bg-gradient-to-r from-blue-500/10 to-violet-500/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Firmware Flasher</h2>
              <p className="text-[10px] text-zinc-500">Flash MicroPython onto your ESP32 board</p>
            </div>
          </div>
          {!isBusy && (
            <button onClick={onClose} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-5 space-y-4">

          {/* Browser warning */}
          {!("serial" in navigator) && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-xs">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              Web Serial API not supported. Open in Chrome or Edge.
            </div>
          )}

          {/* How-to steps */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: "👆", label: "Hold the BOOT button on your board" },
              { icon: "🔌", label: "Click Flash & select the USB port" },
              { icon: "🐍", label: "Wait for 🎉 — enjoy MicroPython!" },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[#0f0f13] border border-[#1e1e26] text-center">
                <span className="text-xl">{s.icon}</span>
                <span className="text-[9px] text-zinc-500 leading-tight">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Chip selector */}
          <div>
            <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-2">
              <span>Board / Chip</span>
              {detectedChip && (
                <span className="text-green-400 normal-case">✅ Auto-detected: {detectedChip}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(FIRMWARE_MAP).map(([key, fw]) => (
                <button key={key} onClick={() => !isBusy && setSelectedChip(key)}
                  disabled={isBusy}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border disabled:opacity-50 ${
                    selectedChip === key
                      ? "text-white"
                      : "border-[#2a2a32] text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                  }`}
                  style={selectedChip === key ? {
                    background: `${fw.color}20`, color: fw.color, borderColor: `${fw.color}60`,
                  } : {}}>
                  {fw.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom firmware */}
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-2">
              Custom Firmware <span className="normal-case text-zinc-600">(optional — overrides above)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#2a2a32] text-[10px] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 transition-all disabled:opacity-50"
              >
                📂 Browse .bin file
              </button>
              {customFirmware && (
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-[10px] text-zinc-300 font-mono truncate">{customFirmware.name}</span>
                  <span className="text-[9px] text-zinc-600">{(customFirmware.size / 1024).toFixed(0)} KB</span>
                  <button onClick={() => setCustomFirmware(null)} className="text-zinc-600 hover:text-red-400 flex-shrink-0">×</button>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept=".bin" className="hidden"
                onChange={(e) => setCustomFirmware(e.target.files?.[0] ?? null)} />
            </div>
          </div>

          {/* Status + progress + log */}
          <div className="rounded-xl border border-[#1e1e26] bg-[#0a0a0d] p-3">
            <div className="flex items-center gap-2 mb-2">
              {isBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: stateColor[flashState] }} />}
              {flashState === "done" && <CheckCircle className="w-3.5 h-3.5 text-green-400" />}
              {flashState === "error" && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
              {(flashState === "idle" || flashState === "ready") && <Zap className="w-3.5 h-3.5" style={{ color: stateColor[flashState] }} />}
              <span className="text-xs font-bold" style={{ color: stateColor[flashState] }}>{stateLabel[flashState]}</span>
              {isBusy && <span className="ml-auto text-[10px] font-mono text-zinc-400">{progress}%</span>}
            </div>

            {flashState !== "idle" && (
              <div className="w-full h-1.5 rounded-full bg-[#1c1c20] overflow-hidden mb-2">
                <div className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%`, background: stateColor[flashState] }} />
              </div>
            )}

            <div className="bg-[#050507] rounded-lg p-2 h-[110px] overflow-y-auto font-mono text-[9px] space-y-0.5">
              {log.length === 0
                ? <span className="text-zinc-700">Log will appear here…</span>
                : log.map((l, i) => (
                  <div key={i} className={
                    l.includes("❌") ? "text-red-400" :
                    l.includes("✅") || l.includes("🎉") ? "text-green-400" :
                    l.includes("⚡") ? "text-violet-400" :
                    l.includes("⬇️") || l.includes("📂") ? "text-cyan-400" :
                    l.includes("🗑") ? "text-orange-400" :
                    "text-zinc-500"
                  }>{l}</div>
                ))
              }
              <div ref={logEndRef} />
            </div>
          </div>

          {/* CTA button */}
          {flashState === "done" ? (
            <button onClick={onClose}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500/20 border border-green-500/40 text-green-400 text-sm font-bold transition-all hover:bg-green-500/30">
              <CheckCircle className="w-4 h-4" /> Close — Board is ready!
            </button>
          ) : (
            <button
              onClick={handleFlash}
              disabled={!("serial" in navigator) || isBusy}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 text-white text-sm font-bold transition-all hover:from-blue-600 hover:to-violet-600 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isBusy
                ? <><Loader2 className="w-4 h-4 animate-spin" /> {stateLabel[flashState]}</>
                : <><Zap className="w-4 h-4" /> Flash MicroPython</>
              }
            </button>
          )}

          <p className="text-[9px] text-zinc-700 text-center leading-relaxed">
            This will erase the ESP32 and install MicroPython.
            Your existing code will be removed — save your project first!
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
