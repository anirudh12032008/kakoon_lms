import { Package, Palette, Activity, Zap, HardDrive } from "lucide-react";

interface FeatureToolbarProps {
  showDesignerHub: boolean;
  showIMUViz: boolean;
  showSensorViz: boolean;
  showRadarViz: boolean;
  showLibraryManager: boolean;
  showFirmwareFlasher: boolean;
  showESP32Files: boolean;
  onOpenDesignerHub: () => void;
  onToggleIMUViz: () => void;
  onToggleSensorViz: () => void;
  onToggleRadarViz: () => void;
  onOpenLibraryManager: () => void;
  onOpenFirmwareFlasher: () => void;
  onToggleESP32Files: () => void;
}

interface ToolBtnProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  title?: string;
  activeColor?: string; // tailwind color name for active state
}

function ToolBtn({ active, onClick, icon, label, title, activeColor = "violet" }: ToolBtnProps) {
  const activeStyles: Record<string, string> = {
    violet: "bg-violet-500/15 text-violet-400 border-violet-500/30",
    fuchsia: "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30",
    cyan: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    emerald: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    blue: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  };
  return (
    <button
      onClick={onClick}
      title={title}
      className={`flex items-center gap-1.5 h-6 px-2.5 rounded-md text-[11px] font-semibold whitespace-nowrap border transition-all ${
        active
          ? activeStyles[activeColor]
          : "border-transparent text-sub hover:text-body hover:bg-hover"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-4 bg-[var(--k-border)] mx-0.5 shrink-0" />;
}

export function FeatureToolbar({
  showDesignerHub, showIMUViz, showSensorViz, showRadarViz,
  showLibraryManager, showFirmwareFlasher, showESP32Files,
  onOpenDesignerHub, onToggleIMUViz, onToggleSensorViz, onToggleRadarViz,
  onOpenLibraryManager, onOpenFirmwareFlasher, onToggleESP32Files,
}: FeatureToolbarProps) {
  return (
    <div className="flex h-9 shrink-0 items-center gap-1 px-3 overflow-x-auto bg-panel border-b border-subtle">

      {/* — Design — */}
      <ToolBtn active={showDesignerHub} onClick={onOpenDesignerHub}
        icon={<Palette className="h-3.5 w-3.5" />} label="Designers"
        activeColor="fuchsia" title="OLED, NeoPixel & LED Matrix designers" />

      <Sep />

      {/* — Visualize — */}
      <ToolBtn active={showIMUViz} onClick={onToggleIMUViz}
        icon={<Activity className="h-3.5 w-3.5" />} label="IMU"
        activeColor="violet" title="MPU6050 live motion plot" />
      <ToolBtn active={showSensorViz} onClick={onToggleSensorViz}
        icon={<svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/>
        </svg>} label="Sensors"
        activeColor="emerald" title="Sensor gauges & timelines" />
      <ToolBtn active={showRadarViz} onClick={onToggleRadarViz}
        icon={<svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="12" x2="19" y2="5"/><circle cx="12" cy="12" r="3"/>
        </svg>} label="Radar"
        activeColor="cyan" title="Ultrasonic radar polar plot" />

      <Sep />

      {/* — Manage — */}
      <ToolBtn active={showLibraryManager} onClick={onOpenLibraryManager}
        icon={<Package className="h-3.5 w-3.5" />} label="Libraries"
        activeColor="violet" title="Install MicroPython libraries" />
      <ToolBtn active={showESP32Files} onClick={onToggleESP32Files}
        icon={<HardDrive className="h-3.5 w-3.5" />} label="Files"
        activeColor="emerald" title="Browse ESP32 filesystem" />
      <ToolBtn active={showFirmwareFlasher} onClick={onOpenFirmwareFlasher}
        icon={<Zap className="h-3.5 w-3.5" />} label="Flash"
        activeColor="blue" title="Flash MicroPython firmware" />
    </div>
  );
}
