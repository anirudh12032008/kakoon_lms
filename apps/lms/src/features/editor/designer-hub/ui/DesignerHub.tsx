/**
 * DesignerHub — full-screen modal with tabs for:
 *   1. OLED Designer (128×64 monochrome pixel canvas, multi-frame)
 *   2. NeoPixel Designer (RGB LED strip/grid, effects, custom frames)
 *   3. Matrix Designer (MAX7219 8×8 LED matrix, animations, scroll text)
 */

import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { OLEDDesigner } from "./OLEDDesigner";
import { NeoPixelDesigner } from "./NeoPixelDesigner";
import { MatrixDesigner } from "./MatrixDesigner";

interface TabProps { label: string; icon: string; active: boolean; onClick: () => void; }

function Tab({ label, icon, active, onClick }: TabProps) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
        active
          ? "bg-brand-gradient text-white shadow-sm"
          : "text-sub hover:text-body hover:bg-hover"
      }`}>
      <span>{icon}</span>{label}
    </button>
  );
}

interface DesignerHubProps {
  onClose: () => void;
  onAddNode?: (type: string, data: Record<string, unknown>) => void;
  defaultTab?: "oled" | "neopixel" | "matrix";
  onSaveOLEDAnimation?: (frames: number[][], fps: number, name: string, onProgress?: (pct: number) => void) => Promise<boolean>;
}

export function DesignerHub({ onClose, onAddNode, defaultTab = "oled", onSaveOLEDAnimation }: DesignerHubProps) {
  const [activeTab, setActiveTab] = useState<"oled" | "neopixel" | "matrix">(defaultTab);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-2">
      <div className="w-full h-full max-w-[1400px] max-h-[92vh] overflow-hidden rounded-2xl border border-[var(--k-border)] bg-[var(--k-base-100)] shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-subtle bg-panel flex-shrink-0">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-base">🎨</div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-black tracking-tight text-body">Designer Hub</h2>
              <p className="truncate text-[11px] text-hint">Draw pixel art & light shows, then drop them onto the canvas as blocks</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex rounded-full bg-raised p-1 gap-0.5">
              <Tab label="OLED" icon="🖥️" active={activeTab === "oled"}     onClick={() => setActiveTab("oled")} />
              <Tab label="NeoPixel" icon="💡" active={activeTab === "neopixel"} onClick={() => setActiveTab("neopixel")} />
              <Tab label="Matrix"   icon="⬛"  active={activeTab === "matrix"}   onClick={() => setActiveTab("matrix")} />
            </div>
            <button onClick={onClose} title="Close" className="rounded-full border border-subtle p-1.5 text-sub transition-colors hover:bg-hover hover:text-body">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "oled"     && <OLEDDesigner     onAddNode={onAddNode} onSaveToDevice={onSaveOLEDAnimation ? async (frames, fps, name, onProgress) => { const ok = await onSaveOLEDAnimation(frames, fps, name, onProgress); if (!ok) throw new Error("upload failed"); } : undefined} />}
          {activeTab === "neopixel" && <NeoPixelDesigner onAddNode={onAddNode} />}
          {activeTab === "matrix"   && <MatrixDesigner   onAddNode={onAddNode} />}
        </div>
      </div>
    </div>,
    document.body
  );
}
