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

function ToolBtn({
  active, onClick, icon, label, activeColor, title,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  activeColor: string;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap"
      style={active
        ? { background: `color-mix(in srgb, ${activeColor} 15%, transparent)`,
            color: activeColor,
            border: `1px solid color-mix(in srgb, ${activeColor} 35%, transparent)` }
        : { color: "var(--k-text-muted)", border: "1px solid transparent" }
      }
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.color = activeColor;
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLButtonElement).style.color = "var(--k-text-muted)";
      }}
    >
      {icon}
      {label}
    </button>
  );
}

export function FeatureToolbar({
  showDesignerHub, showIMUViz, showSensorViz, showRadarViz,
  showLibraryManager, showFirmwareFlasher, showESP32Files,
  onOpenDesignerHub, onToggleIMUViz, onToggleSensorViz, onToggleRadarViz,
  onOpenLibraryManager, onOpenFirmwareFlasher, onToggleESP32Files,
}: FeatureToolbarProps) {
  return (
    <div
      className="flex h-9 shrink-0 items-center gap-0.5 px-3 overflow-x-auto border-b"
      style={{ background: "var(--k-base-200)", borderColor: "var(--k-border)" }}
    >
      <ToolBtn
        active={showDesignerHub}
        onClick={onOpenDesignerHub}
        icon={<Palette className="h-3.5 w-3.5" />}
        label="Designers"
        activeColor="var(--k-secondary)"
        title="OLED, NeoPixel & LED Matrix designers"
      />

      <div className="h-4 w-px mx-1 shrink-0" style={{ background: "var(--k-border)" }} />
      <span className="text-[10px] font-bold uppercase tracking-wider px-1 shrink-0" style={{ color: "var(--k-text-dim)" }}>Visualize</span>

      <ToolBtn active={showIMUViz}    onClick={onToggleIMUViz}    icon={<Activity className="h-3.5 w-3.5" />} label="IMU"     activeColor="var(--k-primary)"   title="MPU6050 live plot" />
      <ToolBtn active={showSensorViz} onClick={onToggleSensorViz} icon={
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 2a10 10 0 1 0 10 10" /><path d="M12 6v6l4 2"/>
        </svg>
      } label="Sensors" activeColor="var(--k-success)" title="Sensor gauges" />
      <ToolBtn active={showRadarViz}  onClick={onToggleRadarViz}  icon={
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="12" x2="19" y2="5"/><circle cx="12" cy="12" r="3"/>
        </svg>
      } label="Radar" activeColor="var(--k-accent)" title="Ultrasonic radar" />

      <div className="h-4 w-px mx-1 shrink-0" style={{ background: "var(--k-border)" }} />

      <ToolBtn active={showLibraryManager}  onClick={onOpenLibraryManager}  icon={<Package className="h-3.5 w-3.5" />}   label="Libraries"      activeColor="var(--k-primary)" title="Install MicroPython libraries" />
      <ToolBtn active={showESP32Files}      onClick={onToggleESP32Files}    icon={<HardDrive className="h-3.5 w-3.5" />} label="Files"          activeColor="var(--k-success)" title="Browse ESP32 filesystem" />
      <ToolBtn active={showFirmwareFlasher} onClick={onOpenFirmwareFlasher} icon={<Zap className="h-3.5 w-3.5" />}       label="Flash Firmware" activeColor="var(--k-info)"    title="Flash MicroPython firmware" />
    </div>
  );
}
