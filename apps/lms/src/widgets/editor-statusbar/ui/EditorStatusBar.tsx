import {
  PanelLeftClose, Circle, Usb, Wifi, ChevronDown,
  Loader2, Upload, HardDrive, Play, Square,
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
}

export function EditorStatusBar({
  showTerminal, onToggleTerminal, logCount,
  isConnected, isConnecting, isSupported, connectionMode, isConfiguringWifi,
  onConnect, onDisconnect, onConnectWifi,
  showWifiInput, setShowWifiInput, setConnectionMode,
  wifiSsid, setWifiSsid, wifiPassword, setWifiPassword, wifiSubnet, setWifiSubnet,
  isUploading, isSending, isRunning, onUpload, onRun, onStop, onOpenFileManager,
}: EditorStatusBarProps) {
  return (
    <footer className="flex h-12 shrink-0 items-center justify-between gap-2 px-3 bg-panel border-t border-subtle">

      {/* Terminal toggle */}
      <button
        onClick={onToggleTerminal}
        className={`btn btn-ghost btn-xs gap-1.5 ${showTerminal ? "text-accent-c bg-accent-tint" : "text-sub"}`}
      >
        <PanelLeftClose className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Terminal</span>
        {logCount > 0 && (
          <span className="badge badge-ghost badge-sm text-[10px]">{logCount}</span>
        )}
      </button>

      {/* Device status + connection mode */}
      <div className="flex items-center gap-2">
        {/* Status pill */}
        <div className={`hidden sm:flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
          isConnected ? "bg-success-tint text-success-c" : "bg-hover text-sub"
        }`}>
          <Circle className="h-2 w-2" fill="currentColor" />
          {isConnected ? "ESP32" : "No Device"}
        </div>

        {/* Connection mode picker */}
        <div className="relative">
          <button
            onClick={() => setShowWifiInput(!showWifiInput)}
            className="btn btn-ghost btn-xs gap-1 text-sub"
          >
            {connectionMode === "usb" ? <Usb className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{connectionMode === "usb" ? "USB" : "WiFi"}</span>
            <ChevronDown className="h-3 w-3" />
          </button>

          {showWifiInput && (
            <div className="absolute bottom-full left-0 mb-2 w-56 rounded-xl p-2 shadow-xl z-30 bg-panel border border-subtle">
              {(["usb", "wifi"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => { setConnectionMode(mode); if (mode === "usb") setShowWifiInput(false); }}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                    connectionMode === mode ? "bg-primary-tint text-primary-c" : "text-sub hover:bg-hover"
                  }`}
                >
                  {mode === "usb" ? <Usb className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
                  {mode === "usb" ? "USB Serial" : "WiFi (WebREPL)"}
                </button>
              ))}

              {connectionMode === "wifi" && (
                <div className="mt-2 space-y-1.5 pt-2 border-t border-subtle">
                  {[
                    { value: wifiSsid,     setter: setWifiSsid,    placeholder: "WiFi Name (SSID)",          type: "text"     },
                    { value: wifiPassword, setter: setWifiPassword, placeholder: "WiFi Password (not saved)", type: "password" },
                    { value: wifiSubnet,   setter: setWifiSubnet,   placeholder: "ESP32 IP (e.g. 192.168.1.105)", type: "text" },
                  ].map(({ value, setter, placeholder, type }) => (
                    <input key={placeholder} type={type} placeholder={placeholder}
                      value={value} onChange={(e) => setter(e.target.value)}
                      className="input input-bordered input-xs w-full bg-raised" />
                  ))}
                  <p className="text-[10px] text-hint">Password is never stored.</p>
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
          className={`btn btn-xs gap-1.5 ${
            isConnected
              ? "bg-success-tint text-success-c border-success-tint"
              : "btn-ghost text-sub border border-subtle"
          }`}
        >
          {isConnecting || isConfiguringWifi ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span className="hidden sm:inline">Connecting…</span></>
          ) : isConnected ? (
            <><Circle className="h-2 w-2" fill="currentColor" /><span className="hidden sm:inline">Connected</span></>
          ) : (
            <>{connectionMode === "usb" ? <Usb className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}<span className="hidden sm:inline">Connect</span></>
          )}
        </button>

        <button onClick={onUpload} disabled={!isConnected || isUploading}
          className="btn btn-ghost btn-xs gap-1.5 text-sub border border-subtle"
          title="Save code to ESP32">
          {isUploading
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span className="hidden sm:inline">Uploading…</span></>
            : <><Upload className="h-3.5 w-3.5" /><span className="hidden sm:inline">Upload</span></>
          }
        </button>

        <button onClick={onOpenFileManager} disabled={!isConnected}
          className="btn btn-ghost btn-xs gap-1.5 text-sub border border-subtle hidden md:flex"
          title="Manage ESP32 files">
          <HardDrive className="h-3.5 w-3.5" />
          Files
        </button>

        {isRunning && (
          <button onClick={onStop}
            className="btn btn-xs gap-1.5 bg-error-tint text-error-c border-error-tint animate-pulse"
            title="Stop running program">
            <Square className="h-3.5 w-3.5" fill="currentColor" />
            <span className="hidden sm:inline">Stop</span>
          </button>
        )}

        <button onClick={onRun} disabled={!isConnected || isSending}
          className="btn btn-sm gap-1.5 font-bold text-white bg-brand-gradient border-0 hover:opacity-90">
          {isSending
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span className="hidden sm:inline">Running…</span></>
            : <><Play className="h-3.5 w-3.5" fill="white" /><span className="hidden sm:inline">Run</span></>
          }
        </button>
      </div>
    </footer>
  );
}
