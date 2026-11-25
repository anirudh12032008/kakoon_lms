import { useBoard } from "@/entities/board";
import { Package, Palette, Activity, Zap, HardDrive, Wrench } from "lucide-react";
import { useNodeMode } from "@/shared/context/NodeModeContext";

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
}

/** Toggle button. Every tool shares the one accent when active (plus aria-pressed). */
function ToolBtn({ active, onClick, icon, label, title }: ToolBtnProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={`flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-semibold whitespace-nowrap border transition-colors ${
        active
          ? "bg-primary-tint text-primary-c border-primary-tint"
          : "border-transparent text-sub hover:text-body hover:bg-hover"
      }`}
    >
      <span aria-hidden="true" className="flex">{icon}</span>
      {label}
    </button>
  );
}

function Sep() {
  return <div aria-hidden="true" className="w-px h-4 bg-[var(--k-border)] mx-0.5 shrink-0" />;
}

/** Compact Workshop Mode switch - unlocks the advanced tools on this bar. */
function WorkshopToggle() {
  const { globalAdvanced, setGlobalAdvanced } = useNodeMode();
  return (
    <button
      onClick={() => setGlobalAdvanced(!globalAdvanced)}
      role="switch"
      aria-checked={globalAdvanced}
      aria-label="Workshop Mode"
      title={globalAdvanced
        ? "Workshop Mode on - advanced tools & node fields unlocked"
        : "Turn on Workshop Mode to unlock advanced tools & node fields"}
      className={`flex items-center gap-1.5 h-7 px-2.5 rounded-md text-xs font-semibold whitespace-nowrap border transition-colors ${
        globalAdvanced
          ? "bg-primary-tint text-primary-c border-primary-tint"
          : "border-subtle text-sub hover:text-body hover:bg-hover"
      }`}
    >
      <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="hidden sm:inline lg:hidden">Workshop</span>
      <span className="hidden lg:inline">Workshop Mode</span>
      <span
        aria-hidden="true"
        className={`inline-flex h-3.5 w-6 items-center rounded-full border p-0.5 transition-colors ${
          globalAdvanced ? "border-transparent bg-primary" : "border-strong bg-hover"
        }`}
      >
        <span className={`h-2 w-2 rounded-full transition-transform ${globalAdvanced ? "translate-x-2.5 bg-[var(--k-on-primary)]" : "translate-x-0 bg-[var(--k-muted)]"}`} />
      </span>
    </button>
  );
}

export function FeatureToolbar({
  showDesignerHub, showIMUViz, showSensorViz, showRadarViz,
  showLibraryManager, showFirmwareFlasher, showESP32Files,
  onOpenDesignerHub, onToggleIMUViz, onToggleSensorViz, onToggleRadarViz,
  onOpenLibraryManager, onOpenFirmwareFlasher, onToggleESP32Files,
}: FeatureToolbarProps) {
  const isMicroPython = useBoard().runtime === "micropython";
  const { globalAdvanced } = useNodeMode();

  return (
    <div role="toolbar" aria-label="Tools" className="flex h-10 shrink-0 items-center gap-1 px-3 overflow-x-auto bg-panel border-b border-subtle">

      {/* - Everyday tools - */}
      <ToolBtn active={showDesignerHub} onClick={onOpenDesignerHub}
        icon={<Palette className="h-3.5 w-3.5" />} label="Designers" title="OLED, NeoPixel & LED Matrix designers" />
      <ToolBtn active={showSensorViz} onClick={onToggleSensorViz}
        icon={<svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/>
        </svg>} label="Sensors" title="Sensor gauges & timelines" />

      {/* - Workshop-only tools: visualizers + device management - */}
      {globalAdvanced && (
        <>
          <Sep />
          <ToolBtn active={showIMUViz} onClick={onToggleIMUViz}
            icon={<Activity className="h-3.5 w-3.5" />} label="IMU" title="MPU6050 live motion plot" />
          <ToolBtn active={showRadarViz} onClick={onToggleRadarViz}
            icon={<svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="12" x2="19" y2="5"/><circle cx="12" cy="12" r="3"/>
            </svg>} label="Radar" title="Ultrasonic radar polar plot" />

          {isMicroPython && <>
          <Sep />
          <ToolBtn active={showLibraryManager} onClick={onOpenLibraryManager}
            icon={<Package className="h-3.5 w-3.5" />} label="Libraries" title="Install MicroPython libraries" />
          <ToolBtn active={showESP32Files} onClick={onToggleESP32Files}
            icon={<HardDrive className="h-3.5 w-3.5" />} label="Files" title="Browse ESP32 filesystem" />
          <ToolBtn active={showFirmwareFlasher} onClick={onOpenFirmwareFlasher}
            icon={<Zap className="h-3.5 w-3.5" />} label="Flash" title="Flash MicroPython firmware" />
          </>}
        </>
      )}

      <div className="ml-auto shrink-0 pl-2">
        <WorkshopToggle />
      </div>
    </div>
  );
}
