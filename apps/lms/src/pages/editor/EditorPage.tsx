import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NodeCanvas, type NodeCanvasRef } from "@/components/editor/NodeCanvas";
import { useSerialConnection } from "@/lib/useSerial";
import {
  Play, Loader2, Code2, Trash2, Blocks, PanelLeftClose, X,
  Usb, Circle, ChevronDown, SplitSquareHorizontal, Pencil, Lock,
  Upload, Wifi, Cpu, HardDrive, Package, Palette, Activity, Zap,
} from "lucide-react";
import type { Node, Edge } from "@xyflow/react";
import { TutorialsDashboard } from "@/components/editor/TutorialsDashboard";
import { TutorialHelper } from "@/components/editor/TutorialHelper";
import { type Tutorial } from "@/lib/tutorials";
import type { EditorLaunchContext } from "@/config/editorLaunch";
import { LibraryManager } from "@/components/editor/LibraryManager";
import { DesignerHub } from "@/components/editor/DesignerHub";
import { FirmwareFlasher } from "@/components/editor/FirmwareFlasher";
import { IMUVisualizerPanel, SensorVizPanel, RadarPanel } from "@/components/editor/DataViz";

export type LessonContext = EditorLaunchContext;

interface EditorPageProps {
  launchContext?: EditorLaunchContext;
  onBackToDashboard?: () => void;
  onComplete?: (codeSnapshot: string) => void;
}

type ViewMode = "blocks" | "split" | "code";
type ConnectionMode = "usb" | "wifi";

// ─── Python Syntax Highlighting ───────────────────────────────────────────────
function highlightPython(line: string): React.ReactNode {
  if (line.includes("#")) {
    const idx = line.indexOf("#");
    return <>{highlightCode(line.slice(0, idx))}<span className="text-zinc-500">{line.slice(idx)}</span></>;
  }
  return highlightCode(line);
}

function highlightCode(line: string): React.ReactNode {
  if (!line) return null;
  const elements: { start: number; end: number; className: string; text: string }[] = [];
  let match;

  const stringRe = /(["'])(?:(?=(\\?))\2.)*?\1/g;
  while ((match = stringRe.exec(line)) !== null)
    elements.push({ start: match.index, end: match.index + match[0].length, className: "text-amber-400", text: match[0] });

  const kwRe = /\b(import|from|def|class|if|else|elif|while|for|in|return|True|False|None|and|or|not|try|except|finally|with|as|pass|break|continue)\b/g;
  while ((match = kwRe.exec(line)) !== null)
    if (!elements.some((e) => match!.index >= e.start && match!.index < e.end))
      elements.push({ start: match.index, end: match.index + match[0].length, className: "text-violet-400", text: match[0] });

  const fnRe = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(?=\()/g;
  while ((match = fnRe.exec(line)) !== null)
    if (!elements.some((e) => match!.index >= e.start && match!.index < e.end))
      elements.push({ start: match.index, end: match.index + match[1].length, className: "text-cyan-400", text: match[1] });

  const numRe = /\b(\d+\.?\d*)\b/g;
  while ((match = numRe.exec(line)) !== null)
    if (!elements.some((e) => match!.index >= e.start && match!.index < e.end))
      elements.push({ start: match.index, end: match.index + match[0].length, className: "text-orange-400", text: match[0] });

  elements.sort((a, b) => a.start - b.start);
  if (elements.length === 0) return line;

  const parts: React.ReactNode[] = [];
  let lastEnd = 0;
  elements.forEach((el, i) => {
    if (el.start > lastEnd) parts.push(line.slice(lastEnd, el.start));
    parts.push(<span key={i} className={el.className}>{el.text}</span>);
    lastEnd = el.end;
  });
  if (lastEnd < line.length) parts.push(line.slice(lastEnd));
  return <>{parts}</>;
}

function getLogColor(log: string): string {
  if (log.includes("❌") || log.includes("error") || log.includes("Error")) return "text-red-400";
  if (log.includes("✅") || log.includes("🚀") || log.includes("success")) return "text-emerald-400";
  if (log.includes("⚠️") || log.includes("warning")) return "text-amber-400";
  if (log.includes("📥") || log.includes(">>>")) return "text-cyan-400";
  if (log.includes("📤") || log.includes("Sending")) return "text-violet-400";
  return "text-zinc-400";
}

// ─── Main EditorPage ──────────────────────────────────────────────────────────
export default function EditorPage({ launchContext, onBackToDashboard, onComplete: _onComplete }: EditorPageProps) {
  const canvasRef = useRef<NodeCanvasRef>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const [generatedCode, setGeneratedCode] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(launchContext?.mode === "challenge" ? "code" : "split");
  const [showTerminal, setShowTerminal] = useState(false);
  const [terminalPosition, setTerminalPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isEditing, setIsEditing] = useState(false);
  const [editableCode, setEditableCode] = useState("");
  const [hasManualEdits, setHasManualEdits] = useState(false);
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>("usb");
  const [showWifiInput, setShowWifiInput] = useState(false);
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [wifiSubnet, setWifiSubnet] = useState("");
  const [isConfiguringWifi, setIsConfiguringWifi] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);
  const [activeFlowNodes, setActiveFlowNodes] = useState<Node[]>([]);
  const [activeFlowEdges, setActiveFlowEdges] = useState<Edge[]>([]);
  const launchRestrictions = useMemo(() => ({
    title: launchContext?.title ?? "Full Workspace",
    description: launchContext?.description ?? "All blocks are available.",
    launchType: launchContext?.launchType ?? "mode",
    allowedCategories: launchContext?.allowedCategories,
    allowedNodeTypes: launchContext?.allowedNodeTypes,
  }), [launchContext]);

  // ─── Feature Panel State ──────────────────────────────────────────────────
  const [showLibraryManager, setShowLibraryManager] = useState(false);
  const [showDesignerHub, setShowDesignerHub] = useState(false);
  const [showFirmwareFlasher, setShowFirmwareFlasher] = useState(false);
  const [showIMUViz, setShowIMUViz] = useState(false);
  const [showSensorViz, setShowSensorViz] = useState(false);
  const [showRadarViz, setShowRadarViz] = useState(false);

  // ─── Tutorial State ───────────────────────────────────────────────────────
  const [showTutorialsCatalog, setShowTutorialsCatalog] = useState(false);
  const [activeTutorial, setActiveTutorial] = useState<Tutorial | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedTutorialIds, setCompletedTutorialIds] = useState<string[]>([]);

  const {
    isConnected, isConnecting, isSupported,
    connect, connectWifi, disconnect,
    sendCode, uploadCode,
    logs, addLog, clearLogs,
  } = useSerialConnection();

  // ─── Draft persistence ───────────────────────────────────────────────────
  useEffect(() => {
    if (isLoadingDraft) return;
    const timeout = setTimeout(() => {
      const workspace = canvasRef.current?.getWorkspace();
      localStorage.setItem("kakoon-draft", JSON.stringify({
        flowData: workspace ? JSON.stringify(workspace) : "",
        generatedCode, editableCode, hasManualEdits, viewMode, isEditing,
        timestamp: Date.now(),
      }));
    }, 1000);
    return () => clearTimeout(timeout);
  }, [generatedCode, editableCode, hasManualEdits, viewMode, isEditing, isLoadingDraft]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("kakoon-draft");
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.editableCode) setEditableCode(draft.editableCode);
        if (draft.hasManualEdits) setHasManualEdits(draft.hasManualEdits);
        if (draft.viewMode) setViewMode(draft.viewMode);
        if (draft.isEditing) setIsEditing(draft.isEditing);
        if (draft.generatedCode) setGeneratedCode(draft.generatedCode);
        if (draft.flowData) {
          const check = setInterval(() => {
            if (canvasRef.current) {
              clearInterval(check);
              try { canvasRef.current.setWorkspace(JSON.parse(draft.flowData)); } catch { }
            }
          }, 100);
          setTimeout(() => clearInterval(check), 5000);
        }
        const wifi = localStorage.getItem("kakoon-wifi");
        if (wifi) {
          const w = JSON.parse(wifi);
          if (w.ssid) setWifiSsid(w.ssid);
          if (w.password) setWifiPassword(w.password);
          if (w.subnet) setWifiSubnet(w.subnet);
        }

        const savedTutorial = localStorage.getItem("kakoon-active-tutorial");
        if (savedTutorial) {
          try {
            setActiveTutorial(JSON.parse(savedTutorial));
            const savedStep = localStorage.getItem("kakoon-current-step-index");
            if (savedStep) setCurrentStepIndex(parseInt(savedStep, 10));
          } catch { }
        }

        const completed = localStorage.getItem("kakoon-completed-tutorials");
        if (completed) setCompletedTutorialIds(JSON.parse(completed));
      }
    } catch { }
    finally { setIsLoadingDraft(false); }
  }, []);

  useEffect(() => {
    if (isLoadingDraft) return;
    localStorage.setItem("kakoon-wifi", JSON.stringify({ ssid: wifiSsid, password: wifiPassword, subnet: wifiSubnet }));
  }, [wifiSsid, wifiPassword, wifiSubnet, isLoadingDraft]);

  // ─── Context menu ────────────────────────────────────────────────────────
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  // ─── Terminal drag ────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (terminalRef.current) {
      const rect = terminalRef.current.getBoundingClientRect();
      setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setIsDragging(true);
      e.preventDefault();
    }
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => setTerminalPosition({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
    const onUp = () => setIsDragging(false);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }, [isDragging, dragOffset]);

  useEffect(() => { logsEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);

  // ─── Library file upload (for LibraryManager) ─────────────────────────────
  const uploadLibFile = useCallback(async (
    filename: string, content: string, onProgress: (p: number) => void
  ): Promise<boolean> => {
    if (!isConnected) { addLog("⚠️ Not connected"); return false; }
    addLog(`📦 Installing ${filename}…`);
    onProgress(10);
    try {
      // Reuse the same upload mechanism but targeting a named file
      const code = `
import os
_f = open('${filename.replace(/'/g, "\\'")}', 'w')
_f.write(${JSON.stringify(content)})
_f.close()
print('LIB_OK:${filename}')
`;
      onProgress(30);
      const ok = await sendCode(code);
      onProgress(100);
      if (ok) addLog(`✅ ${filename} installed to ESP32`);
      return ok;
    } catch {
      addLog(`❌ Failed to install ${filename}`);
      return false;
    }
  }, [isConnected, addLog, sendCode]);

  // ─── Run / Upload ─────────────────────────────────────────────────────────
  const getCurrentCode = useCallback(() => {
    return isEditing ? editableCode : (canvasRef.current?.getCode() || generatedCode);
  }, [isEditing, editableCode, generatedCode]);

  const handleRun = useCallback(async () => {
    const code = getCurrentCode();
    if (!code.trim()) { addLog("⚠️ No code to run. Add some blocks first!"); return; }
    if (!isConnected) { addLog("⚠️ Not connected to ESP32. Click Connect first."); return; }
    setIsSending(true);
    const success = await sendCode(code);
    setIsSending(false);
    if (success) addLog("🚀 Code sent to ESP32!");
  }, [getCurrentCode, isConnected, sendCode, addLog]);

  const handleUpload = useCallback(async () => {
    const code = getCurrentCode();
    if (!code.trim()) { addLog("⚠️ No code to upload."); return; }
    if (!isConnected) { addLog("⚠️ Not connected to ESP32."); return; }
    setIsUploading(true);
    const success = await uploadCode(code);
    setIsUploading(false);
    if (success) addLog("💾 Code saved to ESP32! It will run on boot.");
  }, [getCurrentCode, isConnected, uploadCode, addLog]);

  // ─── Tutorial persistence ─────────────────────────────────────────────────
  useEffect(() => {
    if (isLoadingDraft) return;
    if (activeTutorial) {
      localStorage.setItem("kakoon-active-tutorial", JSON.stringify(activeTutorial));
      localStorage.setItem("kakoon-current-step-index", currentStepIndex.toString());
    } else {
      localStorage.removeItem("kakoon-active-tutorial");
      localStorage.removeItem("kakoon-current-step-index");
    }
  }, [activeTutorial, currentStepIndex, isLoadingDraft]);

  // ─── Tutorial handlers ────────────────────────────────────────────────────
  const handleSelectTutorial = useCallback((tutorial: Tutorial, mode: "preview" | "interactive") => {
    if (mode === "preview") {
      setIsEditing(false);
      setHasManualEdits(false);
      canvasRef.current?.setWorkspace({ nodes: tutorial.nodes, edges: tutorial.edges });
      setShowTutorialsCatalog(false);
      addLog(`✨ Preview loaded: "${tutorial.title}"!`);
    } else {
      setIsEditing(false);
      setHasManualEdits(false);
      canvasRef.current?.setWorkspace({ nodes: [], edges: [] });
      setActiveTutorial(tutorial);
      setCurrentStepIndex(0);
      setShowTutorialsCatalog(false);
      addLog(`🚀 Starting interactive tutorial: "${tutorial.title}"!`);
    }
  }, [addLog]);

  const handleStepComplete = useCallback(() => {
    if (!activeTutorial) return;
    if (currentStepIndex < activeTutorial.steps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setCurrentStepIndex(activeTutorial.steps.length);
    }
  }, [activeTutorial, currentStepIndex]);

  const handleCompleteTutorial = useCallback(() => {
    if (!activeTutorial) return;
    setCompletedTutorialIds((prev) => {
      const updated = Array.from(new Set([...prev, activeTutorial.id]));
      localStorage.setItem("kakoon-completed-tutorials", JSON.stringify(updated));
      return updated;
    });
    addLog(`🎉 Congratulations! Completed tutorial: "${activeTutorial.title}"!`);
    setActiveTutorial(null);
  }, [activeTutorial, addLog]);

  // ─── WiFi connect ─────────────────────────────────────────────────────────
  const handleWifiConnect = useCallback(async () => {
    setIsConfiguringWifi(true);
    addLog("🔍 Searching for ESP32 on network...");
    const userInput = wifiSubnet.trim();
    const tryConnect = async (ip: string) => {
      try {
        return await new Promise<boolean>((resolve) => {
          const ws = new WebSocket(`ws://${ip}:8266`);
          const t = setTimeout(() => { ws.close(); resolve(false); }, 3000);
          ws.onopen = () => { clearTimeout(t); ws.close(); resolve(true); };
          ws.onerror = () => { clearTimeout(t); resolve(false); };
        });
      } catch { return false; }
    };

    if (userInput) {
      const parts = userInput.split(".");
      if (parts.length === 4 && parts.every((p) => !isNaN(Number(p)))) {
        addLog(`📡 Trying ${userInput}...`);
        if (await tryConnect(userInput)) {
          await connectWifi(userInput, "Kakoon");
          setConnectionMode("wifi");
          setIsConfiguringWifi(false);
          return;
        }
      }
    }
    addLog("❌ ESP32 not found. Make sure it's on the network.");
    setIsConfiguringWifi(false);
  }, [wifiSubnet, connectWifi, addLog]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen flex-col bg-[#09090b]">

      {/* ── Top Header ─────────────────────────────────────────────────────── */}
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#1f1f23] bg-[#0c0c0f] px-2 gap-1">
        {/* Logo */}
        <div className="flex items-center gap-1.5 px-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-500">
            <Blocks className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-white hidden sm:inline">Kakoon</span>
        </div>

        <div className="hidden min-w-0 flex-1 items-center justify-center px-2 md:flex">
          <div className="flex max-w-[42rem] items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/70">
            <span className="rounded-full bg-white/10 px-2 py-1 uppercase tracking-[0.24em] text-white/50">{launchRestrictions.launchType}</span>
            <span className="truncate font-medium text-white">{launchRestrictions.title}</span>
            <span className="truncate text-white/45">{launchContext?.description ?? launchRestrictions.description}</span>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center">
          <div className="flex rounded-full bg-[#1a1a1f] p-1">
            {([
              { mode: "blocks" as ViewMode, icon: (
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>
                  <line x1="8" y1="6" x2="16" y2="6"/><line x1="6" y1="8" x2="6" y2="16"/>
                  <line x1="18" y1="8" x2="18" y2="16"/><line x1="8" y1="18" x2="16" y2="18"/>
                </svg>
              ), label: "Nodes" },
              { mode: "split" as ViewMode, icon: <SplitSquareHorizontal className="h-3.5 w-3.5" />, label: "Split" },
              { mode: "code" as ViewMode, icon: <Code2 className="h-3.5 w-3.5" />, label: "Python" },
            ] as const).map(({ mode, icon, label }) => (
              <button
                key={mode}
                onClick={() => { setViewMode(mode); if (mode !== "code") setIsEditing(false); }}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                  viewMode === mode
                    ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {icon}
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="hidden h-8 items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 text-xs text-white/75 hover:bg-white/[0.08] md:flex"
            >
              <Blocks className="h-3.5 w-3.5" />
              Dashboard
            </button>
          )}

          <div className="hidden md:flex items-center gap-2 rounded-md bg-[#1a1a1f] px-3 py-1.5">
            <span className="text-xs text-zinc-400">Kakoon Editor</span>
          </div>

          {/* Tutorials Button */}
          <button
            onClick={() => setShowTutorialsCatalog(!showTutorialsCatalog)}
            className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
              showTutorialsCatalog
                ? "bg-violet-500/20 text-violet-400"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-violet-400"
            }`}
            title="Robotics Tutorials"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Feature Toolbar ──────────────────────────────────────────────────── */}
      <div className="flex h-9 shrink-0 items-center gap-1 border-b border-[#1a1a20] bg-[#0a0a0d] px-3 overflow-x-auto">
        {/* Designer Hub */}
        <button
          onClick={() => setShowDesignerHub(true)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${
            showDesignerHub ? "bg-fuchsia-500/20 text-fuchsia-400 border border-fuchsia-500/30" : "text-zinc-400 hover:bg-zinc-800 hover:text-fuchsia-400"
          }`}
          title="OLED, NeoPixel & LED Matrix designers"
        >
          <Palette className="h-3.5 w-3.5" />
          <span>Designers</span>
        </button>

        <div className="h-4 w-px bg-[#2a2a32] mx-0.5" />

        {/* Visualize submenu */}
        <span className="text-[10px] text-zinc-600 uppercase tracking-wider font-bold px-1">Visualize</span>
        <button
          onClick={() => setShowIMUViz((v) => !v)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${
            showIMUViz ? "bg-violet-500/20 text-violet-400 border border-violet-500/30" : "text-zinc-400 hover:bg-zinc-800 hover:text-violet-400"
          }`}
          title="MPU6050 IMU live plot"
        >
          <Activity className="h-3.5 w-3.5" />
          IMU
        </button>
        <button
          onClick={() => setShowSensorViz((v) => !v)}
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
          onClick={() => setShowRadarViz((v) => !v)}
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

        {/* Library Manager */}
        <button
          onClick={() => setShowLibraryManager(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${
            showLibraryManager ? "bg-violet-500/20 text-violet-400 border border-violet-500/30" : "text-zinc-400 hover:bg-zinc-800 hover:text-violet-400"
          }`}
          title="Install MicroPython libraries"
        >
          <Package className="h-3.5 w-3.5" />
          Libraries
        </button>

        {/* Firmware Flash */}
        <button
          onClick={() => setShowFirmwareFlasher(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${
            showFirmwareFlasher ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "text-zinc-400 hover:bg-zinc-800 hover:text-blue-400"
          }`}
          title="Flash MicroPython firmware"
        >
          <Zap className="h-3.5 w-3.5" />
          Flash Firmware
        </button>
      </div>

      {/* ── Main Content ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Node Editor */}
        <div
          className={`overflow-hidden transition-all duration-300 ${viewMode === "code" ? "w-0" : "flex-1"}`}
          onContextMenu={handleContextMenu}
        >
          {viewMode !== "code" && (
            <NodeCanvas
              ref={canvasRef}
              onCodeChange={setGeneratedCode}
              onFlowChange={(nds, eds) => { setActiveFlowNodes(nds); setActiveFlowEdges(eds); }}
              allowedCategories={launchRestrictions.allowedCategories}
              allowedNodeTypes={launchRestrictions.allowedNodeTypes}
            />
          )}
        </div>

        {/* Code Panel */}
        {(viewMode === "split" || viewMode === "code") && (
          <div className={`flex flex-col border-l border-[#1f1f23] bg-[#0c0c0f] transition-all duration-300 ${
            viewMode === "code" ? "flex-1" : "hidden md:flex w-[320px] lg:w-[420px]"
          }`}>
            {/* Code Header */}
            <div className="flex h-10 items-center justify-between border-b border-[#1f1f23] px-3">
              <div className="flex items-center gap-2">
                <Code2 className="h-4 w-4 text-zinc-500" />
                <span className="text-xs font-medium text-zinc-300">
                  {isEditing ? "main.py (edited)" : "main.py"}
                </span>
                {hasManualEdits && !isEditing && (
                  <span className="text-[10px] text-amber-400">(has edits)</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {hasManualEdits && (
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="flex h-5 items-center gap-1 rounded border border-zinc-700 px-1.5 text-[10px] font-medium text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
                  >
                    {isEditing ? "Code Mode" : "Block Mode"}
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <Lock className={`h-3 w-3 ${!isEditing ? "text-zinc-400" : "text-zinc-600"}`} />
                  <button
                    onClick={() => {
                      if (!isEditing && !hasManualEdits) setEditableCode(generatedCode);
                      setIsEditing(!isEditing);
                    }}
                    className={`relative inline-flex h-4 w-7 flex-shrink-0 items-center rounded-full transition-colors ${isEditing ? "bg-[#7c3aed]" : "bg-[#3f3f46]"}`}
                  >
                    <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isEditing ? "translate-x-3.5" : "translate-x-0.5"}`} />
                  </button>
                  <Pencil className={`h-3 w-3 ${isEditing ? "text-violet-400" : "text-zinc-600"}`} />
                </div>
              </div>
            </div>

            {/* Code Content */}
            <div className="flex-1 overflow-auto">
              {isEditing ? (
                <textarea
                  className="w-full h-full bg-transparent p-4 font-mono text-xs leading-6 text-zinc-300 outline-none resize-none"
                  value={editableCode}
                  onChange={(e) => { setEditableCode(e.target.value); setHasManualEdits(true); }}
                  placeholder="# Write your Python code here"
                  spellCheck={false}
                />
              ) : (
                <div className="flex min-h-full">
                  <div className="sticky left-0 flex flex-col bg-[#0c0c0f] py-4 pl-4 pr-3 text-right font-mono text-xs leading-6 text-zinc-600 select-none">
                    {(generatedCode || "# Add blocks to generate code\n").split("\n").map((_, i) => (
                      <span key={i}>{i + 1}</span>
                    ))}
                  </div>
                  <pre className="flex-1 py-4 pr-4 font-mono text-xs leading-6">
                    <code className="text-zinc-300">
                      {generatedCode
                        ? generatedCode.split("\n").map((line, i) => (
                          <div key={i} className="hover:bg-zinc-800/30">{highlightPython(line)}</div>
                        ))
                        : <span className="text-zinc-500"># Add blocks to generate code</span>
                      }
                    </code>
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Floating Terminal ────────────────────────────────────────────────── */}
      {showTerminal && (
        <div
          ref={terminalRef}
          className="fixed z-20 w-[700px] max-w-[95vw] overflow-hidden rounded-lg border border-[#2a2a30] bg-[#0a0a0c] shadow-2xl"
          style={terminalPosition
            ? { left: terminalPosition.x, top: terminalPosition.y }
            : { left: "50%", bottom: 64, transform: "translateX(-50%)" }
          }
        >
          <div
            className="flex h-9 cursor-move items-center justify-between border-b border-[#1f1f23] bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-3 select-none"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-cyan-400">WebTerminal</span>
              <button
                className="rounded p-0.5 hover:bg-white/10 text-zinc-500"
                onClick={clearLogs}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              onClick={() => setShowTerminal(false)}
              onMouseDown={(e) => e.stopPropagation()}
              className="rounded p-0.5 text-zinc-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="h-[250px] overflow-auto p-3 font-mono text-xs">
            {logs.length === 0
              ? <p className="text-zinc-500">Connected. Waiting for output...</p>
              : logs.map((log, i) => (
                <div key={i} className={`py-0.5 ${getLogColor(log)}`}>{log}</div>
              ))
            }
            <div ref={logsEndRef} />
          </div>
        </div>
      )}

      {/* ── Bottom Status Bar ────────────────────────────────────────────────── */}
      <footer className="flex h-12 shrink-0 items-center justify-between border-t border-[#1f1f23] bg-[#0c0c0f] px-3 gap-1">
        {/* Left: Terminal toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTerminal(!showTerminal)}
            className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs transition-colors ${
              showTerminal ? "bg-cyan-500/20 text-cyan-400" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
            }`}
          >
            <PanelLeftClose className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Terminal</span>
            {logs.length > 0 && (
              <span className="ml-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-700 px-1 text-[10px]">
                {logs.length}
              </span>
            )}
          </button>
        </div>

        {/* Center: Device Status */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
            isConnected ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-400"
          }`}>
            <Circle className={`h-2 w-2 ${isConnected ? "fill-emerald-400 text-emerald-400" : "fill-zinc-500 text-zinc-500"}`} />
            <span className="hidden sm:inline">{isConnected ? "ESP32" : "No Device"}</span>
          </div>

          {/* Connection mode */}
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
                    <input type="text" placeholder="WiFi Name (SSID)" value={wifiSsid} onChange={(e) => setWifiSsid(e.target.value)}
                      className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none" />
                    <input type="password" placeholder="WiFi Password" value={wifiPassword} onChange={(e) => setWifiPassword(e.target.value)}
                      className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none" />
                    <div className="border-t border-zinc-800 pt-2">
                      <input type="text" placeholder="ESP32 IP (e.g. 192.168.1.105)" value={wifiSubnet} onChange={(e) => setWifiSubnet(e.target.value)}
                        className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Connect / Upload / Files / Flash / Run */}
        <div className="flex items-center gap-2">
          {!isSupported && connectionMode === "usb" && (
            <span className="text-[9px] text-red-400 bg-red-900/30 px-1.5 py-0.5 rounded border border-red-800 hidden sm:flex">Chrome/Edge</span>
          )}

          <button
            onClick={isConnected ? disconnect : (connectionMode === "wifi" ? handleWifiConnect : connect)}
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
            onClick={handleUpload}
            disabled={!isConnected || isUploading}
            className="flex h-8 items-center gap-2 rounded-md border border-zinc-700 px-3 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isUploading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span className="hidden sm:inline">Uploading</span></> : <><Upload className="h-3.5 w-3.5" /><span className="hidden sm:inline">Upload</span></>}
          </button>

          <button
            disabled={!isConnected}
            className="flex h-8 items-center gap-2 rounded-md border border-zinc-700 px-3 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Manage ESP32 files"
          >
            <HardDrive className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Files</span>
          </button>

          <button
            className="flex h-8 items-center gap-2 rounded-md border border-zinc-700 px-3 text-xs text-zinc-300 hover:bg-zinc-800"
            title="Flash MicroPython firmware"
          >
            <Cpu className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Flash</span>
          </button>

          <button
            onClick={handleRun}
            disabled={!isConnected || isSending}
            className="flex h-8 items-center gap-2 rounded-md bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 text-xs font-medium text-white hover:from-violet-600 hover:to-fuchsia-600 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span className="hidden sm:inline">Running</span></> : <><Play className="h-3.5 w-3.5 fill-white" /><span className="hidden sm:inline">Run</span></>}
          </button>
        </div>
      </footer>

      {/* ── Interactive Tutorial Overlay ─────────────────────────────────────── */}
      {activeTutorial && (
        <TutorialHelper
          tutorial={activeTutorial}
          nodes={activeFlowNodes}
          edges={activeFlowEdges}
          currentStepIndex={currentStepIndex}
          onStepComplete={handleStepComplete}
          onQuit={() => setActiveTutorial(null)}
          onCompleteTutorial={handleCompleteTutorial}
        />
      )}

      {/* ── Tutorials Catalog Modal ───────────────────────────────────────────── */}
      {showTutorialsCatalog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 md:p-8">
          <div className="relative w-full h-[90vh] max-w-6xl overflow-hidden rounded-2xl border border-zinc-800 bg-[#08080a] shadow-2xl flex flex-col">
            <div className="flex-1 overflow-hidden">
              <TutorialsDashboard
                onBack={() => setShowTutorialsCatalog(false)}
                onSelectTutorial={handleSelectTutorial}
                completedTutorialIds={completedTutorialIds}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Context Menu ─────────────────────────────────────────────────────── */}
      {contextMenu && (
        <div
          className="fixed z-[9999] min-w-[200px] overflow-hidden rounded-xl border border-zinc-800 bg-[#0e0e12]/95 backdrop-blur-md p-1.5 shadow-2xl"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={() => {
              if (confirm("Clear the canvas?")) {
                canvasRef.current?.setWorkspace({ nodes: [], edges: [] });
              }
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Canvas
          </button>
        </div>
      )}

      {/* ── Feature Modals ────────────────────────────────────────────────────── */}
      {showLibraryManager && (
        <LibraryManager
          code={isEditing ? editableCode : generatedCode}
          isConnected={isConnected}
          onUploadFile={uploadLibFile}
          onClose={() => setShowLibraryManager(false)}
        />
      )}

      {showDesignerHub && (
        <DesignerHub onClose={() => setShowDesignerHub(false)} />
      )}

      {showFirmwareFlasher && (
        <FirmwareFlasher onClose={() => setShowFirmwareFlasher(false)} />
      )}

      {showIMUViz && (
        <IMUVisualizerPanel logs={logs} onClose={() => setShowIMUViz(false)} />
      )}

      {showSensorViz && (
        <SensorVizPanel logs={logs} onClose={() => setShowSensorViz(false)} />
      )}

      {showRadarViz && (
        <RadarPanel logs={logs} onClose={() => setShowRadarViz(false)} />
      )}
    </div>
  );
}
