import {
  PanelLeftClose, Circle, Usb, Wifi, ChevronDown,
  Loader2, Upload, HardDrive, Play, Square, Check,
} from "lucide-react";
import { useGamification } from "@/entities/gamification";
import { useBoard } from "@/entities/board";

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
  const award = useGamification((s) => s.award);
  const board = useBoard();
  // Arduino sketches are compiled and flashed in one step, so Run works unconnected.
  const isArduino = board.runtime === "arduino";
  const canRun = (isConnected || isArduino) && !isSending;

  // Plain classes, not daisy .btn: the global .btn override forces a transparent border.
  const outlineBtn =
    "h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
  const neutralBtn = `${outlineBtn} border-strong text-body hover:bg-hover`;

  // XP rewards ride along with the real actions (daily-capped in the store).
  const handleRun = () => { award("runCode", "Code sent to your board"); onRun(); };
  const handleUpload = () => { award("uploadCode", `Program saved to ${board.label}`); onUpload(); };

  return (
    <footer className="flex h-14 shrink-0 items-center justify-between gap-2 px-3 bg-panel border-t border-subtle">

      {/* Terminal toggle */}
      <button
        onClick={onToggleTerminal}
        aria-pressed={showTerminal}
        aria-label={logCount > 0 ? `Terminal, ${logCount} log lines` : "Terminal"}
        title="Terminal"
        className={`btn btn-ghost btn-sm gap-1.5 ${showTerminal ? "text-primary-c bg-primary-tint" : "text-sub"}`}
      >
        <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Terminal</span>
        {logCount > 0 && (
          <span className="badge badge-ghost badge-sm hidden text-xs sm:inline-flex" aria-hidden="true">{logCount}</span>
        )}
      </button>

      {/* Device status + connection mode */}
      <div className="flex items-center gap-2">
        {/* Status pill */}
        <div role="status" className={`hidden sm:flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold ${
          isConnected ? "bg-success-tint text-success-c" : "bg-hover text-sub"
        }`}>
          <Circle className="h-2 w-2" fill={isConnected ? "currentColor" : "none"} aria-hidden="true" />
          {isConnected ? "Board connected" : "Not connected"}
        </div>

        {/* Connection mode picker */}
        <div className="relative">
          <button
            onClick={() => setShowWifiInput(!showWifiInput)}
            aria-expanded={showWifiInput}
            aria-haspopup="true"
            aria-label={`Connection type: ${connectionMode === "usb" ? "USB" : "WiFi"}`}
            title="Connection type"
            className="btn btn-ghost btn-sm gap-1 text-sub"
          >
            {connectionMode === "usb" ? <Usb className="h-4 w-4" aria-hidden="true" /> : <Wifi className="h-4 w-4" aria-hidden="true" />}
            <span className="hidden sm:inline">{connectionMode === "usb" ? "USB" : "WiFi"}</span>
            <ChevronDown className="h-3 w-3" aria-hidden="true" />
          </button>

          {showWifiInput && (
            <div className="anim-pop-in absolute bottom-full left-0 mb-2 w-60 rounded-lg p-2 shadow-xl z-30 bg-panel border border-subtle" style={{ transformOrigin: "bottom left" }}>
              {(["usb", "wifi"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => { setConnectionMode(mode); if (mode === "usb") setShowWifiInput(false); }}
                  aria-pressed={connectionMode === mode}
                  className={`flex min-h-8 w-full items-center gap-2 rounded-md px-2 text-[13px] font-medium transition-colors ${
                    connectionMode === mode ? "bg-primary-tint text-primary-c" : "text-sub hover:bg-hover"
                  }`}
                >
                  {mode === "usb" ? <Usb className="h-4 w-4" aria-hidden="true" /> : <Wifi className="h-4 w-4" aria-hidden="true" />}
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
                    <input key={placeholder} type={type} placeholder={placeholder} aria-label={placeholder}
                      value={value} onChange={(e) => setter(e.target.value)}
                      className="input input-bordered input-sm w-full bg-raised" />
                  ))}
                  <p className="text-xs text-sub">Password is never stored.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5">
        {!isSupported && connectionMode === "usb" && (
          <span className="hidden text-xs font-semibold text-error-c lg:inline">USB needs Chrome or Edge</span>
        )}

        {/* Connect / Disconnect */}
        <button
          onClick={isConnected ? onDisconnect : (connectionMode === "wifi" ? onConnectWifi : onConnect)}
          disabled={isConnecting || isConfiguringWifi || (!isSupported && connectionMode === "usb")}
          aria-label={isConnecting || isConfiguringWifi ? "Connecting" : isConnected ? "Connected. Disconnect board" : "Connect board"}
          title={!isSupported && connectionMode === "usb" ? "USB needs Chrome or Edge" : isConnected ? "Disconnect board" : "Connect board"}
          className={`flex ${
            isConnected ? `${outlineBtn} bg-success-tint text-success-c border-success-tint` : neutralBtn
          }`}
        >
          {isConnecting || isConfiguringWifi ? (
            <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /><span className="hidden sm:inline">Connecting…</span></>
          ) : isConnected ? (
            <><Check className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Connected</span></>
          ) : (
            <>{connectionMode === "usb" ? <Usb className="h-4 w-4" aria-hidden="true" /> : <Wifi className="h-4 w-4" aria-hidden="true" />}<span className="hidden sm:inline">Connect</span></>
          )}
        </button>

        {!isArduino && <>
        <button onClick={handleUpload} disabled={!isConnected || isUploading}
          className={`flex ${neutralBtn}`}
          aria-label={`Upload: save code to ${board.label} so it runs on boot`}
          title={`Save code to ${board.label} so it runs on boot`}>
          {isUploading
            ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /><span className="hidden sm:inline">Uploading…</span></>
            : <><Upload className="h-4 w-4" aria-hidden="true" /><span className="hidden sm:inline">Upload</span></>
          }
        </button>

        <button onClick={onOpenFileManager} disabled={!isConnected}
          className={`hidden sm:flex ${neutralBtn}`}
          title={isConnected ? "Browse files on your board" : "Connect your board to browse its files"}>
          <HardDrive className="h-4 w-4" aria-hidden="true" />
          Files
        </button>
        </>}

        {isRunning && (
          <button onClick={onStop}
            className={`flex ${outlineBtn} bg-error-tint text-error-c border-error-tint`}
            aria-label="Stop running program"
            title="Stop running program">
            <Square className="h-3.5 w-3.5" fill="currentColor" aria-hidden="true" />
            <span className="hidden sm:inline">Stop</span>
          </button>
        )}

        <button onClick={handleRun} disabled={!canRun}
          title={isArduino ? `Compile and upload to ${board.label}` : "Run on the board"}
          aria-label={isArduino ? `Compile and upload to ${board.label}` : "Run on the board"}
          className="flex h-11 items-center gap-2 rounded-md bg-brand-gradient px-4 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:px-5">
          {isSending
            ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /><span className="hidden sm:inline">{isArduino ? "Uploading…" : "Running…"}</span></>
            : <><Play className="h-4 w-4" fill="currentColor" aria-hidden="true" /><span className="hidden sm:inline">{isArduino ? "Upload" : "Run"}</span></>
          }
        </button>
      </div>
    </footer>
  );
}
