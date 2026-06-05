import { useState } from "react";
import {
  BaseNode,
  NodeField,
  NumberInput,
  useNodeField,
  AdvancedSection,
  COLORS,
} from "./BaseNode";

function ToolIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  );
}

// ServoCalibrationNode has moved to ServoNodes.tsx
export { ServoCalibrationNode } from "./ServoNodes";

// ─── Known I2C device map ─────────────────────────────────────────────────────
const KNOWN_DEVICES: Record<string, string> = {
  "0x3C": "OLED SSD1306",
  "0x3D": "OLED SSD1306 (alt)",
  "0x27": "LCD PCF8574",
  "0x3F": "LCD PCF8574 (alt)",
  "0x68": "MPU6050 IMU",
  "0x69": "LSM6DS3 IMU",
  "0x6A": "LSM6DS3 IMU (alt)",
  "0x6B": "LSM6DS3 IMU (alt)",
  "0x48": "ADS1115 ADC",
  "0x49": "ADS1115 ADC (A1)",
  "0x4A": "ADS1115 ADC (A2)",
  "0x4B": "ADS1115 ADC (A3)",
  "0x76": "BME280 Env",
  "0x77": "BME280 (alt)",
  "0x57": "MAX30102 Pulse",
  "0x29": "VL53L0X ToF",
  "0x1E": "HMC5883L Mag",
};

// Simulated scan result — shows the "what you'd see" demo set
const DEMO_FOUND = ["0x3C", "0x68", "0x76"];

interface FoundDevice {
  addr: string;
  label: string;
}

// ─── I2C Scanner ──────────────────────────────────────────────────────────────
export function I2CScannerNode() {
  const [sda, setSda] = useNodeField<number>("sda", 21);
  const [scl, setScl] = useNodeField<number>("scl", 22);

  const [scanning, setScanning] = useState(false);
  const [found, setFound] = useState<FoundDevice[]>([]);
  const [scanned, setScanned] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);

  const handleScan = () => {
    setScanning(true);
    setScanned(false);
    setFound([]);
    // Simulate a scan delay then show demo results
    setTimeout(() => {
      setFound(
        DEMO_FOUND.map((addr) => ({
          addr,
          label: KNOWN_DEVICES[addr] ?? "Unknown device",
        }))
      );
      setScanning(false);
      setScanned(true);
    }, 1400);
  };

  const handleCopy = (addr: string) => {
    navigator.clipboard.writeText(addr).catch(() => {});
    setCopiedAddr(addr);
    setTimeout(() => setCopiedAddr(null), 1200);
  };

  return (
    <BaseNode title="I2C Scanner" color={COLORS.blue} icon={<ToolIcon />} width="260px">
      <AdvancedSection>
        <NodeField label="SDA Pin"><NumberInput value={sda} onChange={setSda} /></NodeField>
        <NodeField label="SCL Pin"><NumberInput value={scl} onChange={setScl} /></NodeField>
      </AdvancedSection>

      {/* Demo notice */}
      <div className="mx-3 mb-1 px-2.5 py-1 rounded-lg border border-amber-500/20 bg-amber-500/5">
        <span className="text-[9px] text-amber-400/80">Preview mode — shows demo devices. Connect ESP32 and run generated code to scan live.</span>
      </div>

      {/* Range label */}
      <div className="px-3 py-0.5 flex items-center justify-between">
        <span className="text-[9px] text-zinc-500 font-mono">Range: 0x00 – 0x7F</span>
        <span className="text-[9px] text-zinc-600">(128 addresses)</span>
      </div>

      {/* Scan button */}
      <div className="px-3 pb-1 pt-0.5">
        <button
          onClick={handleScan}
          disabled={scanning}
          className="nodrag w-full flex items-center justify-center gap-2 py-1.5 rounded-lg border border-blue-500/40 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {scanning ? (
            <>
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Scanning…
            </>
          ) : (
            <>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              Scan I2C Bus
            </>
          )}
        </button>
      </div>

      {/* Scanning progress animation */}
      {scanning && (
        <div className="px-3 pb-1">
          <div className="w-full h-1 bg-[#1c1c20] rounded-full overflow-hidden border border-[#2d2d35]">
            <div className="h-full bg-blue-500 rounded-full"
              style={{ animation: "i2cScan 1.4s linear forwards", width: "0%" }} />
          </div>
        </div>
      )}

      {/* Results panel */}
      {scanned && (
        <div className="px-3 pb-2">
          <div className="rounded-lg border border-[#2d2d35] bg-[#0a0a0d] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-[#1c1c20]">
              <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">Found Devices</span>
              <span className="text-[9px] font-mono text-blue-400 font-bold">{found.length} found</span>
            </div>

            {found.length === 0 ? (
              <div className="px-3 py-3 text-center text-[10px] text-zinc-600">No devices found</div>
            ) : (
              <div className="flex flex-col">
                {found.map((dev) => (
                  <div key={dev.addr}
                    className="flex items-center justify-between px-2.5 py-1.5 border-b border-[#151518] last:border-0 hover:bg-[#111116] transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      {/* Address badge */}
                      <span className="font-mono text-[11px] font-bold text-blue-400 bg-blue-500/10 border border-blue-500/25 px-1.5 py-0.5 rounded">
                        {dev.addr}
                      </span>
                      {/* Device label */}
                      <span className="text-[10px] text-zinc-400 font-medium">{dev.label}</span>
                    </div>

                    {/* One-click copy button */}
                    <button
                      onClick={() => handleCopy(dev.addr)}
                      className="nodrag opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold text-zinc-400 hover:text-white hover:bg-zinc-700/50 border border-transparent hover:border-zinc-600"
                      title="Copy address"
                    >
                      {copiedAddr === dev.addr ? (
                        <svg className="w-3 h-3 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      ) : (
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Known address legend hint */}
          <p className="text-[8px] text-zinc-600 mt-1.5 leading-tight">
            Auto-labelled: 0x3C OLED · 0x27/0x3F LCD · 0x68 MPU6050 · 0x48 ADS1115 · 0x76 BME280
          </p>
        </div>
      )}
    </BaseNode>
  );
}
