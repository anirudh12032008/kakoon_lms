import {
  PanelLeftClose, Circle, Usb, Wifi, ChevronDown,
  Loader2, Upload, HardDrive, Cpu, Play,
} from "lucide-react";

interface EditorStatusBarProps {
  // Terminal
  showTerminal: boolean;
  onToggleTerminal: () => void;
  logCount: number;
  // Connection
  isConnected: boolean;
  isConnecting: boolean;
  isSupported: boolean;
  connectionMode: "usb" | "wifi";
  isConfiguringWifi: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onConnectWifi: () => void;
  // WiFi panel
  showWifiInput: boolean;
  setShowWifiInput: (v: boolean) => void;
  setConnectionMode: (m: "usb" | "wifi") => void;
  wifiSsid: string;
  setWifiSsid: (v: string) => void;
  wifiPassword: string;
  setWifiPassword: (v: string) => void;
  wifiSubnet: string;
  setWifiSubnet: (v: string) => void;
  // Actions
  isUploading: boolean;
  isSending: boolean;
  onUpload: () => void;
  onRun: () => void;
  onOpenFileManager: () => void;
  onOpenFirmwareFlasher: () => void;
}

export function EditorStatusBar({
  showTerminal, onToggleTerminal, logCount,
  isConnected, isConnecting, isSupported, connectionMode, isConfiguringWifi,
  onConnect, onDisconnect, onConnectWifi,
  showWifiInput, setShowWifiInput, setConnectionMode,
  wifiSsid, setWifiSsid, wifiPassword, setWifiPassword, wifiSubnet, setWifiSubnet,
  isUploading, isSending, onUpload, onRun, onOpenFileManager, onOpenFirmwareFlasher,
}: EditorStatusBarProps) {
  return (
    <footer className="flex h-12 shrink-0 items-center justify-between border-t border-[#1f1f23] bg-[#0c0c0f] px-3 gap-1">
      {/* Terminal toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleTerminal}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
            showTerminal ? "bg-cyan-500/20 text-cyan-400" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
          }`}
        >
          <PanelLeftClose className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Terminal</span>
          {logCount > 0 && (
            <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-700 px-1 text-[10px]">
              {logCount}
            </span>
          )}
        </button>
      </div>

      {/* Device status + connection mode */}
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
          isConnected ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-400"
        }`}>
          <Circle className={`h-2 w-2 ${isConnected ? "fill-emerald-400 text-emerald-400" : "fill-zinc-500 text-zinc-500"}`} />
          <span className="hidden sm:inline">{isConnected ? "ESP32" : "No Device"}</span>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowWifiInput(!showWifiInput)}
            className="flex items-center gap-1.5 rounded-md bg-zinc-800/50 px-2.5 py-1.5 text-xs text-zinc-400 hover:bg-zinc-700/50"
          >
            {connectionMode === "usb" ? <Usb className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{connectionMode === "usb" ? "USB" : "WiFi"}</span>
            <ChevronDown className="h-3 w-3" />
          </button>

          {showWifiInput && (
            <div className="absolute bottom-full left-0 mb-2 w-56 rounded-lg border z-30 border-zinc-800 bg-[#0c0c0f] p-2 shadow-xl">
              <button
                onClick={() => { setConnectionMode("usb"); setShowWifiInput(false); }}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs ${connectionMode === "usb" ? "bg-violet-500/20 text-violet-400" : "text-zinc-400 hover:bg-zinc-800"}`}
              >
                <Usb className="h-3.5 w-3.5" /> USB Serial
              </button>
              <button
                onClick={() => setConnectionMode("wifi")}
                className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs ${connectionMode === "wifi" ? "bg-violet-500/20 text-violet-400" : "text-zinc-400 hover:bg-zinc-800"}`}
              >
                <Wifi className="h-3.5 w-3.5" /> WiFi (WebREPL)
              </button>

              {connectionMode === "wifi" && (
                <div className="mt-2 space-y-2 border-t border-zinc-800 pt-2">
                  <input
                    type="text"
                    placeholder="WiFi Name (SSID)"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none"
                  />
                  <input
                    type="password"
                    placeholder="WiFi Password (not saved)"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-zinc-500">Password is never stored anywhere.</p>
                  <div className="border-t border-zinc-800 pt-2">
                    <input
                      type="text"
                      placeholder="ESP32 IP (e.g. 192.168.1.105)"
                      value={wifiSubnet}
                      onChange={(e) => setWifiSubnet(e.target.value)}
                      className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-zinc-500 mt-1">Enter IP to connect directly.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {!isSupported && connectionMode === "usb" && (
          <span className="text-[9px] text-red-400 bg-red-900/30 px-1.5 py-0.5 rounded border border-red-800 hidden sm:flex">Chrome/Edge</span>
        )}

        <button
          onClick={isConnected ? onDisconnect : (connectionMode === "wifi" ? onConnectWifi : onConnect)}
          disabled={isConnecting || isConfiguringWifi || (!isSupported && connectionMode === "usb")}
          className={`flex h-8 items-center gap-2 rounded-md border px-3 text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
            isConnected
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
              : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          }`}
        >
          {isConnecting || isConfiguringWifi ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span className="hidden sm:inline">Connecting</span></>
          ) : isConnected ? (
            <><Circle className="h-2 w-2 fill-emerald-400" /><span className="hidden sm:inline">Connected</span></>
          ) : (
            <>{connectionMode === "usb" ? <Usb className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}<span className="hidden sm:inline">Connect</span></>
          )}
        </button>

        <button
          onClick={onUpload}
          disabled={!isConnected || isUploading}
          className="flex h-8 items-center gap-2 rounded-md border border-zinc-700 px-3 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
          title="Save code to ESP32 (persists after reboot)"
        >
          {isUploading
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span className="hidden sm:inline">Uploading</span></>
            : <><Upload className="h-3.5 w-3.5" /><span className="hidden sm:inline">Upload</span></>
          }
        </button>

        <button
          onClick={onOpenFileManager}
          disabled={!isConnected}
          className="flex h-8 items-center gap-2 rounded-md border border-zinc-700 px-3 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
          title="Manage ESP32 files"
        >
          <HardDrive className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Files</span>
        </button>

        <button
          onClick={onOpenFirmwareFlasher}
          className="flex h-8 items-center gap-2 rounded-md border border-zinc-700 px-3 text-xs text-zinc-300 hover:bg-zinc-800"
          title="Flash MicroPython firmware"
        >
          <Cpu className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Flash</span>
        </button>

        <button
          onClick={onRun}
          disabled={!isConnected || isSending}
          className="flex h-8 items-center gap-2 rounded-md bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 text-xs font-medium text-white hover:from-violet-600 hover:to-fuchsia-600 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSending
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span className="hidden sm:inline">Running</span></>
            : <><Play className="h-3.5 w-3.5 fill-white" /><span className="hidden sm:inline">Run</span></>
          }
        </button>
      </div>
    </footer>
  );
}
