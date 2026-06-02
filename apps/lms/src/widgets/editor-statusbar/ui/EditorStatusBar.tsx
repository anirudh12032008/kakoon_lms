import {
  PanelLeftClose, Circle, Usb, Wifi, ChevronDown,
  Loader2, Upload, HardDrive, Cpu, Play, Square,
} from "lucide-react";

interface EditorStatusBarProps {
  showTerminal: boolean;
  onToggleTerminal: () => void;
  logCount: number;
  isConnected: boolean;
  isConnecting: boolean;
  isSupported: boolean;
  connectionMode: "usb" | "wifi";
  isConfiguringWifi: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onConnectWifi: () => void;
  showWifiInput: boolean;
  setShowWifiInput: (v: boolean) => void;
  setConnectionMode: (m: "usb" | "wifi") => void;
  wifiSsid: string;
  setWifiSsid: (v: string) => void;
  wifiPassword: string;
  setWifiPassword: (v: string) => void;
  wifiSubnet: string;
  setWifiSubnet: (v: string) => void;
  isUploading: boolean;
  isSending: boolean;
  isRunning: boolean;
  onUpload: () => void;
  onRun: () => void;
  onStop: () => void;
  onOpenFileManager: () => void;
  onOpenFirmwareFlasher: () => void;
}

export function EditorStatusBar({
  showTerminal, onToggleTerminal, logCount,
  isConnected, isConnecting, isSupported, connectionMode, isConfiguringWifi,
  onConnect, onDisconnect, onConnectWifi,
  showWifiInput, setShowWifiInput, setConnectionMode,
  wifiSsid, setWifiSsid, wifiPassword, setWifiPassword, wifiSubnet, setWifiSubnet,
  isUploading, isSending, isRunning, onUpload, onRun, onStop, onOpenFileManager, onOpenFirmwareFlasher,
}: EditorStatusBarProps) {
  return (
    <footer
      className="flex h-12 shrink-0 items-center justify-between gap-2 px-3 border-t"
      style={{ background: "var(--k-base-200)", borderColor: "var(--k-border)" }}
    >
      {/* Terminal toggle */}
      <div className="flex items-center">
        <button
          onClick={onToggleTerminal}
          className="btn btn-xs btn-ghost gap-1.5"
          style={showTerminal ? { color: "var(--k-accent)" } : { color: "var(--k-text-muted)" }}
        >
          <PanelLeftClose className="h-3.5 w-3.5" />
          <span className="hidden sm:inline text-xs">Terminal</span>
          {logCount > 0 && (
            <span className="badge badge-sm" style={{ background: "var(--k-elevated)", color: "var(--k-text-muted)", fontSize: "10px" }}>
              {logCount}
            </span>
          )}
        </button>
      </div>

      {/* Device status + connection mode */}
      <div className="flex items-center gap-2">
        {/* Status pill */}
        <div
          className="hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
          style={isConnected
            ? { background: "color-mix(in srgb, var(--k-success) 15%, transparent)", color: "var(--k-success)" }
            : { background: "var(--k-elevated)", color: "var(--k-text-muted)" }
          }
        >
          <Circle className="h-2 w-2" style={{ fill: isConnected ? "var(--k-success)" : "var(--k-text-dim)" }} />
          {isConnected ? "ESP32" : "No Device"}
        </div>

        {/* Connection mode picker */}
        <div className="relative">
          <button
            onClick={() => setShowWifiInput(!showWifiInput)}
            className="btn btn-xs btn-ghost gap-1"
            style={{ color: "var(--k-text-muted)" }}
          >
            {connectionMode === "usb" ? <Usb className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline text-xs">{connectionMode === "usb" ? "USB" : "WiFi"}</span>
            <ChevronDown className="h-3 w-3" />
          </button>

          {showWifiInput && (
            <div
              className="absolute bottom-full left-0 mb-2 w-56 rounded-xl p-2 shadow-xl z-30"
              style={{ border: "1px solid var(--k-border)", background: "var(--k-base-200)" }}
            >
              {(["usb", "wifi"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => { setConnectionMode(mode); if (mode === "usb") setShowWifiInput(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors"
                  style={connectionMode === mode
                    ? { background: "color-mix(in srgb, var(--k-primary) 15%, transparent)", color: "var(--k-primary)" }
                    : { color: "var(--k-text-muted)" }
                  }
                >
                  {mode === "usb" ? <Usb className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
                  {mode === "usb" ? "USB Serial" : "WiFi (WebREPL)"}
                </button>
              ))}

              {connectionMode === "wifi" && (
                <div className="mt-2 space-y-1.5 pt-2" style={{ borderTop: "1px solid var(--k-border)" }}>
                  {[
                    { value: wifiSsid,     setter: setWifiSsid,     placeholder: "WiFi Name (SSID)",          type: "text"     },
                    { value: wifiPassword, setter: setWifiPassword,  placeholder: "WiFi Password (not saved)", type: "password" },
                    { value: wifiSubnet,   setter: setWifiSubnet,    placeholder: "ESP32 IP (e.g. 192.168.1.105)", type: "text" },
                  ].map(({ value, setter, placeholder, type }) => (
                    <input
                      key={placeholder}
                      type={type}
                      placeholder={placeholder}
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      className="input input-bordered input-xs w-full text-xs"
                      style={{ background: "var(--k-base-300)" }}
                    />
                  ))}
                  <p className="text-[10px]" style={{ color: "var(--k-text-dim)" }}>Password is never stored.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5">
        {!isSupported && connectionMode === "usb" && (
          <span className="badge badge-error badge-sm hidden sm:inline-flex text-[9px]">Chrome/Edge only</span>
        )}

        {/* Connect / Disconnect */}
        <button
          onClick={isConnected ? onDisconnect : (connectionMode === "wifi" ? onConnectWifi : onConnect)}
          disabled={isConnecting || isConfiguringWifi || (!isSupported && connectionMode === "usb")}
          className="btn btn-xs gap-1.5 disabled:opacity-40"
          style={isConnected
            ? { border: "1px solid color-mix(in srgb, var(--k-success) 50%, transparent)",
                background: "color-mix(in srgb, var(--k-success) 10%, transparent)",
                color: "var(--k-success)" }
            : { border: "1px solid var(--k-border)", color: "var(--k-text-muted)" }
          }
        >
          {isConnecting || isConfiguringWifi ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span className="hidden sm:inline">Connecting…</span></>
          ) : isConnected ? (
            <><Circle className="h-2 w-2" style={{ fill: "var(--k-success)" }} /><span className="hidden sm:inline">Connected</span></>
          ) : (
            <>{connectionMode === "usb" ? <Usb className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}<span className="hidden sm:inline">Connect</span></>
          )}
        </button>

        <button
          onClick={onUpload}
          disabled={!isConnected || isUploading}
          className="btn btn-xs gap-1.5 disabled:opacity-40"
          style={{ border: "1px solid var(--k-border)", color: "var(--k-text-muted)" }}
          title="Save code to ESP32 (persists after reboot)"
        >
          {isUploading
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span className="hidden sm:inline">Uploading…</span></>
            : <><Upload className="h-3.5 w-3.5" /><span className="hidden sm:inline">Upload</span></>
          }
        </button>

        <button
          onClick={onOpenFileManager}
          disabled={!isConnected}
          className="btn btn-xs gap-1.5 disabled:opacity-40 hidden md:flex"
          style={{ border: "1px solid var(--k-border)", color: "var(--k-text-muted)" }}
          title="Manage ESP32 files"
        >
          <HardDrive className="h-3.5 w-3.5" />
          Files
        </button>

        <button
          onClick={onOpenFirmwareFlasher}
          className="btn btn-xs gap-1.5 hidden md:flex"
          style={{ border: "1px solid var(--k-border)", color: "var(--k-text-muted)" }}
          title="Flash MicroPython firmware"
        >
          <Cpu className="h-3.5 w-3.5" />
          Flash
        </button>

        {isRunning && (
          <button
            onClick={onStop}
            className="btn btn-xs gap-1.5 animate-pulse"
            style={{
              border: "1px solid color-mix(in srgb, var(--k-error) 60%, transparent)",
              background: "color-mix(in srgb, var(--k-error) 15%, transparent)",
              color: "var(--k-error)",
            }}
            title="Stop running program (Ctrl+C)"
          >
            <Square className="h-3.5 w-3.5" style={{ fill: "var(--k-error)" }} />
            <span className="hidden sm:inline">Stop</span>
          </button>
        )}

        <button
          onClick={onRun}
          disabled={!isConnected || isSending}
          className="btn btn-sm gap-1.5 font-bold disabled:opacity-40 text-white"
          style={{ background: "linear-gradient(135deg, var(--k-primary), var(--k-secondary))" }}
        >
          {isSending
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span className="hidden sm:inline">Running…</span></>
            : <><Play className="h-3.5 w-3.5" style={{ fill: "white" }} /><span className="hidden sm:inline">Run</span></>
          }
        </button>
      </div>
    </footer>
  );
}
