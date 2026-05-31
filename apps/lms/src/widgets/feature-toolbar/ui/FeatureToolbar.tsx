import { Package, Palette, Activity, Zap } from "lucide-react";

interface FeatureToolbarProps {
  showDesignerHub: boolean;
  showIMUViz: boolean;
  showSensorViz: boolean;
  showRadarViz: boolean;
  showLibraryManager: boolean;
  showFirmwareFlasher: boolean;
  onOpenDesignerHub: () => void;
  onToggleIMUViz: () => void;
  onToggleSensorViz: () => void;
  onToggleRadarViz: () => void;
  onOpenLibraryManager: () => void;
  onOpenFirmwareFlasher: () => void;
}

export function FeatureToolbar({
  showDesignerHub, showIMUViz, showSensorViz, showRadarViz,
  showLibraryManager, showFirmwareFlasher,
  onOpenDesignerHub, onToggleIMUViz, onToggleSensorViz, onToggleRadarViz,
  onOpenLibraryManager, onOpenFirmwareFlasher,
}: FeatureToolbarProps) {
  return (
    <div className="flex h-9 shrink-0 items-center gap-1 border-b border-[#1a1a20] bg-[#0a0a0d] px-3 overflow-x-auto">
      <button
        onClick={onOpenDesignerHub}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${
          showDesignerHub ? "bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30" : "text-zinc-400 hover:bg-zinc-800 hover:text-fuchsia-400"
        }`}
        title="OLED, NeoPixel & LED Matrix designers"
      >
        <Palette className="h-3.5 w-3.5" />
        <span>Designers</span>
      </button>

      <div className="h-4 w-px bg-[#2a2a32] mx-0.5" />

      <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold px-1">Visualize</span>

      <button
        onClick={onToggleIMUViz}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${
          showIMUViz ? "bg-violet-500/20 text-violet-400 border border-violet-500/30" : "text-zinc-400 hover:bg-zinc-800 hover:text-violet-400"
        }`}
        title="MPU6050 IMU live plot"
      >
        <Activity className="h-3.5 w-3.5" />
        IMU
      </button>

      <button
        onClick={onToggleSensorViz}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${
          showSensorViz ? "bg-green-500/20 text-green-400 border border-green-500/30" : "text-zinc-400 hover:bg-zinc-800 hover:text-green-400"
        }`}
        title="Sensor gauges & timelines"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 2a10 10 0 1 0 10 10" /><path d="M12 6v6l4 2"/>
        </svg>
        Sensors
      </button>

      <button
        onClick={onToggleRadarViz}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${
          showRadarViz ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30" : "text-zinc-400 hover:bg-zinc-800 hover:text-cyan-400"
        }`}
        title="Ultrasonic radar polar plot"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="12" x2="19" y2="5"/><circle cx="12" cy="12" r="3"/>
        </svg>
        Radar
      </button>

      <div className="h-4 w-px bg-[#2a2a32] mx-0.5" />

      <button
        onClick={onOpenLibraryManager}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${
          showLibraryManager ? "bg-violet-500/20 text-violet-400 border border-violet-500/30" : "text-zinc-400 hover:bg-zinc-800 hover:text-violet-400"
        }`}
        title="Install MicroPython libraries"
      >
        <Package className="h-3.5 w-3.5" />
        Libraries
      </button>

      <button
        onClick={onOpenFirmwareFlasher}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${
          showFirmwareFlasher ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "text-zinc-400 hover:bg-zinc-800 hover:text-blue-400"
        }`}
        title="Flash MicroPython firmware"
      >
        <Zap className="h-3.5 w-3.5" />
        Flash Firmware
      </button>
    </div>
  );
}
