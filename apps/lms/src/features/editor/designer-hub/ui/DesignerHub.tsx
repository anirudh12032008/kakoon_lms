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
      className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
        active
          ? "border-violet-500 text-violet-400 bg-violet-500/10"
          : "border-transparent text-zinc-500 hover:text-[var(--k-text)] hover:bg-white/5"
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
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--k-border)] bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-sm">🎨</div>
            <div>
              <h2 className="text-sm font-bold text-white">Designer Hub</h2>
              <p className="text-[10px] text-zinc-500">Create pixel art, animations, and LED effects</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-xl border border-[var(--k-border)] overflow-hidden">
              <Tab label="OLED Display" icon="🖥️" active={activeTab === "oled"}     onClick={() => setActiveTab("oled")} />
              <Tab label="NeoPixel LEDs" icon="💡" active={activeTab === "neopixel"} onClick={() => setActiveTab("neopixel")} />
              <Tab label="LED Matrix"   icon="⬛"  active={activeTab === "matrix"}   onClick={() => setActiveTab("matrix")} />
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--k-muted)] hover:text-white hover:bg-white/10 ml-2">
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
