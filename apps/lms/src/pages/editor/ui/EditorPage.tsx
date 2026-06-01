import { useCallback, useMemo, useRef, useState } from "react";
import { useModal } from "@/shared/context/ModalContext";
import { Trash2 } from "lucide-react";
import { NodeCanvas, type NodeCanvasRef } from "@/widgets/node-canvas/ui/NodeCanvas";
import { useSerialConnection } from "@/features/editor/serial-connect/model/useSerial";
import { TutorialsDashboard } from "@/features/editor/tutorial/ui/TutorialsDashboard";
import { TutorialHelper } from "@/features/editor/tutorial/ui/TutorialHelper";
import { LibraryManager } from "@/features/editor/install-library/ui/LibraryManager";
import { DesignerHub } from "@/features/editor/designer-hub/ui/DesignerHub";
import { FirmwareFlasher } from "@/features/editor/flash-firmware/ui/FirmwareFlasher";
import { IMUVisualizerPanel, SensorVizPanel, RadarPanel } from "@/features/editor/data-viz/ui/DataViz";

import { EditorHeader } from "@/widgets/editor-header/ui/EditorHeader";
import { FeatureToolbar } from "@/widgets/feature-toolbar/ui/FeatureToolbar";
import { CodePanel } from "@/widgets/code-panel/ui/CodePanel";
import { FloatingTerminal } from "@/widgets/floating-terminal/ui/FloatingTerminal";
import { EditorStatusBar } from "@/widgets/editor-statusbar/ui/EditorStatusBar";

import { useWifi } from "@/features/editor/wifi-connect/model/useWifi";
import { useDraft } from "@/features/editor/save-draft/model/useDraft";
import { useTutorial } from "@/features/editor/tutorial/model/useTutorial";

import type { EditorLaunchContext } from "@/entities/editor-launch/model/config";
import { NodeActionsProvider } from "@/shared/context/NodeActionsContext";
import { ESP32FilesPanel } from "@/features/editor/esp32-files/ui/ESP32FilesPanel";
import { removeAnim, markOnDevice } from "@/shared/lib/animRegistry";

export type LessonContext = EditorLaunchContext;
export type ViewMode = "blocks" | "split" | "code";

interface EditorPageProps {
  launchContext?: EditorLaunchContext;
  onBackToDashboard?: () => void;
}

export default function EditorPage({ launchContext, onBackToDashboard }: EditorPageProps) {
  const canvasRef = useRef<NodeCanvasRef>(null);

  // ── Core state ──────────────────────────────────────────────────────────────
  const [generatedCode, setGeneratedCode] = useState("");
  const [editableCode, setEditableCode] = useState("");
  const [hasManualEdits, setHasManualEdits] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(
    launchContext?.mode === "challenge" ? "code" : "split"
  );
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [connectionMode, setConnectionMode] = useState<"usb" | "wifi">("usb");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const { confirm } = useModal();

  // ── Feature panel visibility ────────────────────────────────────────────────
  const [showTerminal, setShowTerminal] = useState(false);
  const [showLibraryManager, setShowLibraryManager] = useState(false);
  const [showDesignerHub, setShowDesignerHub] = useState(false);
  const [designerTab, setDesignerTab] = useState<"oled" | "neopixel" | "matrix">("oled");
  const [showESP32Files, setShowESP32Files] = useState(false);
  const [showFirmwareFlasher, setShowFirmwareFlasher] = useState(false);
  const [showIMUViz, setShowIMUViz] = useState(false);
  const [showSensorViz, setShowSensorViz] = useState(false);
  const [showRadarViz, setShowRadarViz] = useState(false);

  // ── Serial ──────────────────────────────────────────────────────────────────
  const {
    isConnected, isConnecting, isSupported, isRunning,
    connect, connectWifi, disconnect,
    sendCode, stopCode, sendPythonCode, uploadCode,
    logs, addLog, clearLogs,
  } = useSerialConnection();

  // ── Draft persistence ────────────────────────────────────────────────────────
  useDraft({
    canvasRef, isLoadingDraft, setIsLoadingDraft,
    generatedCode, editableCode, hasManualEdits, viewMode, isEditing,
    setGeneratedCode, setEditableCode, setHasManualEdits, setViewMode, setIsEditing,
  });

  // ── WiFi ─────────────────────────────────────────────────────────────────────
  const wifi = useWifi({ connectWifi, setConnectionMode, addLog });

  // ── Tutorials ───────────────────────────────────────────────────────────────
  const tutorial = useTutorial({ canvasRef, addLog, isLoadingDraft });

  // ── Launch restrictions ──────────────────────────────────────────────────────
  const launchRestrictions = useMemo(() => ({
    allowedCategories: launchContext?.allowedCategories,
    allowedNodeTypes: launchContext?.allowedNodeTypes,
  }), [launchContext]);

  // ── Context menu ─────────────────────────────────────────────────────────────
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  // ── Library file upload ───────────────────────────────────────────────────────
  // Writes the file in 200-byte chunks so the REPL paste buffer never overflows.
  const uploadLibFile = useCallback(async (
    filename: string, content: string, onProgress: (p: number) => void
  ): Promise<boolean> => {
    if (!isConnected) { addLog("⚠️ Not connected"); return false; }

    // Guard: if the content looks like HTML (e.g. a 404 from the dev server),
    // bail out immediately with a clear error rather than writing garbage to the board.
    if (content.trimStart().startsWith("<!") || content.trimStart().startsWith("<html")) {
      addLog(`❌ ${filename}: library file not found on server (got HTML instead of Python)`);
      return false;
    }

    addLog(`📦 Installing ${filename}…`);
    onProgress(5);

    try {
      // Create parent directory if needed (e.g. umqtt/simple.py → mkdir umqtt)
      const dir = filename.includes("/") ? filename.split("/").slice(0, -1).join("/") : null;
      const mkdirCode = dir
        ? `try:\n import os\n os.mkdir('${dir}')\nexcept: pass\n`
        : "";

      // Open file for writing
      const openCode = `${mkdirCode}import os\n_kf = open('${filename.replace(/'/g, "\\'")}', 'wb')\n`;
      await sendCode(openCode);
      onProgress(10);

      // Chunk the content as escaped bytes, 200 chars of source per chunk
      const CHUNK = 200;
      const total = content.length;
      for (let i = 0; i < total; i += CHUNK) {
        const slice = content.slice(i, i + CHUNK);
        // JSON.stringify gives us a safe escaped string literal including quotes
        const chunkCode = `_kf.write(${JSON.stringify(slice)})\n`;
        await sendCode(chunkCode);
        onProgress(10 + Math.round((i / total) * 80));
      }

      // Close & confirm
      const closeCode = `_kf.close()\nprint('LIB_OK:${filename}')\n`;
      await sendCode(closeCode);
      onProgress(100);
      addLog(`✅ ${filename} installed to ESP32`);
      return true;
    } catch {
      addLog(`❌ Failed to install ${filename}`);
      return false;
    }
  }, [isConnected, addLog, sendCode]);

  // ── OLED Animation Upload ─────────────────────────────────────────────────────
  const uploadOLEDAnimation = useCallback(async (
    frames: number[][], fps: number, name: string
  ): Promise<boolean> => {
    if (!isConnected) { addLog("⚠️ Not connected to ESP32"); return false; }

    addLog(`📤 Saving animation "${name}" to ESP32...`);

    const safeName = name.replace(/[^a-z0-9_]/gi, '_').toLowerCase();
    const numFrames = frames.length;

    function frameToBinary(frame: number[]): Uint8Array {
      const bytes = new Uint8Array(1024); // 128*64/8
      for (let y = 0; y < 64; y++) {
        for (let xb = 0; xb < 16; xb++) { // 128/8 = 16 bytes per row
          let byte = 0;
          for (let bit = 0; bit < 8; bit++) {
            if (frame[y * 128 + xb * 8 + bit]) byte |= (0x80 >> bit);
          }
          bytes[y * 16 + xb] = byte;
        }
      }
      return bytes;
    }

    const totalBytes = 8 + numFrames * 1024;
    const payload = new Uint8Array(totalBytes);
    payload[0] = 0x4F; payload[1] = 0x41; payload[2] = 0x4E; payload[3] = 0x4D; // "OANM"
    payload[4] = (fps >> 8) & 0xFF; payload[5] = fps & 0xFF;
    payload[6] = (numFrames >> 8) & 0xFF; payload[7] = numFrames & 0xFF;
    frames.forEach((f, i) => {
      payload.set(frameToBinary(f), 8 + i * 1024);
    });

    const CHUNK_BYTES = 256;

    try {
      const openCode = `import os, binascii\ntry: os.mkdir('/anim')\nexcept: pass\n_oaf = open('/anim/${safeName}.bin', 'wb')\n`;
      await sendCode(openCode);

      for (let i = 0; i < totalBytes; i += CHUNK_BYTES) {
        const chunk = payload.slice(i, i + CHUNK_BYTES);
        const hexStr = Array.from(chunk).map(b => b.toString(16).padStart(2, '0')).join('');
        await sendCode(`_oaf.write(binascii.unhexlify('${hexStr}'))\n`);
      }

      await sendCode(`_oaf.close()\nprint('ANIM_SAVED:${safeName}')\n`);
      addLog(`✅ Animation "${name}" saved to /anim/${safeName}.bin`);

      // Mark as on-device in the local animation registry
      markOnDevice(safeName, true);

      return true;
    } catch {
      addLog(`❌ Failed to save animation "${name}"`);
      return false;
    }
  }, [isConnected, addLog, sendCode]);

  // ── OLED Animation Delete ─────────────────────────────────────────────────────
  const deleteOLEDAnim = useCallback(async (name: string): Promise<void> => {
    const safeName = name.replace(/[^a-z0-9_]/gi, "_").toLowerCase();
    // Always remove from local registry
    removeAnim(name);
    addLog(`🗑 Removed "${name}" from library`);
    // If connected, also delete from device
    if (isConnected) {
      try {
        await sendCode(`import os\ntry: os.remove('/anim/${safeName}.bin')\nexcept: pass\nprint('ANIM_DEL:${safeName}')\n`);
        addLog(`🗑 Deleted /anim/${safeName}.bin from ESP32`);
      } catch {
        addLog(`⚠️ Could not delete from device — file may still be there`);
      }
    }
  }, [isConnected, addLog, sendCode]);

  // ── Run / Upload ──────────────────────────────────────────────────────────────
  const getCurrentCode = useCallback(() =>
    isEditing ? editableCode : (canvasRef.current?.getCode() || generatedCode),
    [isEditing, editableCode, generatedCode]
  );

  const handleRun = useCallback(async () => {
    const code = getCurrentCode();
    if (!code.trim()) { addLog("⚠️ No code to run. Add some blocks first!"); return; }
    if (!isConnected) { addLog("⚠️ Not connected to ESP32. Click Connect first."); return; }
    setIsSending(true);
    const success = await sendCode(code);
    setIsSending(false);
    if (success) addLog("🚀 Code sent to ESP32!");
  }, [getCurrentCode, isConnected, sendCode, addLog]);

  const handleStop = useCallback(async () => {
    await stopCode();
  }, [stopCode]);

  const handleUpload = useCallback(async () => {
    const code = getCurrentCode();
    if (!code.trim()) { addLog("⚠️ No code to upload."); return; }
    if (!isConnected) { addLog("⚠️ Not connected to ESP32."); return; }
    setIsUploading(true);
    const success = await uploadCode(code);
    setIsUploading(false);
    if (success) addLog("💾 Code saved to ESP32! It will run on boot.");
  }, [getCurrentCode, isConnected, uploadCode, addLog]);

  return (
    <NodeActionsProvider
      openMatrixDesigner={() => { setDesignerTab("matrix"); setShowDesignerHub(true); }}
      deleteOLEDAnim={deleteOLEDAnim}
    >
    <div
      className="flex h-screen flex-col bg-[#09090b]"
      onClick={() => setContextMenu(null)}
    >
      <EditorHeader
        viewMode={viewMode}
        setViewMode={setViewMode}
        setIsEditing={setIsEditing}
        launchContext={launchContext}
        showTutorialsCatalog={tutorial.showTutorialsCatalog}
        onToggleTutorials={() => tutorial.setShowTutorialsCatalog(!tutorial.showTutorialsCatalog)}
        onBackToDashboard={onBackToDashboard}
      />

      <FeatureToolbar
        showDesignerHub={showDesignerHub}
        showIMUViz={showIMUViz}
        showSensorViz={showSensorViz}
        showRadarViz={showRadarViz}
        showLibraryManager={showLibraryManager}
        showFirmwareFlasher={showFirmwareFlasher}
        showESP32Files={showESP32Files}
        onOpenDesignerHub={() => setShowDesignerHub(true)}
        onToggleIMUViz={() => setShowIMUViz((v) => !v)}
        onToggleSensorViz={() => setShowSensorViz((v) => !v)}
        onToggleRadarViz={() => setShowRadarViz((v) => !v)}
        onOpenLibraryManager={() => setShowLibraryManager(true)}
        onOpenFirmwareFlasher={() => setShowFirmwareFlasher(true)}
        onToggleESP32Files={() => setShowESP32Files((v) => !v)}
      />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden relative">
        <div
          className={`overflow-hidden transition-all duration-300 ${viewMode === "code" ? "w-0" : "flex-1"}`}
          onContextMenu={handleContextMenu}
        >
          {viewMode !== "code" && (
            <NodeCanvas
              ref={canvasRef}
              onCodeChange={setGeneratedCode}
              onFlowChange={(nds, eds) => {
                tutorial.setActiveFlowNodes(nds);
                tutorial.setActiveFlowEdges(eds);
              }}
              allowedCategories={launchRestrictions.allowedCategories}
              allowedNodeTypes={launchRestrictions.allowedNodeTypes}
            />
          )}
        </div>

        {(viewMode === "split" || viewMode === "code") && (
          <CodePanel
            viewMode={viewMode}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            generatedCode={generatedCode}
            editableCode={editableCode}
            hasManualEdits={hasManualEdits}
            onEditableCodeChange={(code) => { setEditableCode(code); setHasManualEdits(true); }}
            onSetEditableCode={setEditableCode}
          />
        )}
      </div>

      {showTerminal && (
        <FloatingTerminal
          logs={logs}
          onClearLogs={clearLogs}
          onClose={() => setShowTerminal(false)}
        />
      )}

      <EditorStatusBar
        showTerminal={showTerminal}
        onToggleTerminal={() => setShowTerminal(!showTerminal)}
        logCount={logs.length}
        isConnected={isConnected}
        isConnecting={isConnecting}
        isSupported={isSupported}
        connectionMode={connectionMode}
        isConfiguringWifi={wifi.isConfiguringWifi}
        onConnect={connect}
        onDisconnect={disconnect}
        onConnectWifi={wifi.handleWifiConnect}
        showWifiInput={wifi.showWifiInput}
        setShowWifiInput={wifi.setShowWifiInput}
        setConnectionMode={setConnectionMode}
        wifiSsid={wifi.wifiSsid}
        setWifiSsid={wifi.setWifiSsid}
        wifiPassword={wifi.wifiPassword}
        setWifiPassword={wifi.setWifiPassword}
        wifiSubnet={wifi.wifiSubnet}
        setWifiSubnet={wifi.setWifiSubnet}
        isUploading={isUploading}
        isSending={isSending}
        isRunning={isRunning}
        onUpload={handleUpload}
        onRun={handleRun}
        onStop={handleStop}
        onOpenFileManager={() => setShowLibraryManager(true)}
        onOpenFirmwareFlasher={() => setShowFirmwareFlasher(true)}
      />

      {/* Tutorials */}
      {tutorial.activeTutorial && (
        <TutorialHelper
          tutorial={tutorial.activeTutorial}
          nodes={tutorial.activeFlowNodes}
          edges={tutorial.activeFlowEdges}
          currentStepIndex={tutorial.currentStepIndex}
          onStepComplete={tutorial.handleStepComplete}
          onQuit={() => tutorial.setActiveTutorial(null)}
          onCompleteTutorial={tutorial.handleCompleteTutorial}
        />
      )}

      {tutorial.showTutorialsCatalog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 md:p-8">
          <div className="relative w-full h-[90vh] max-w-6xl overflow-hidden rounded-2xl border border-zinc-800 bg-[#08080a] shadow-2xl flex flex-col">
            <div className="flex-1 overflow-hidden">
              <TutorialsDashboard
                onBack={() => tutorial.setShowTutorialsCatalog(false)}
                onSelectTutorial={tutorial.handleSelectTutorial}
                completedTutorialIds={tutorial.completedTutorialIds}
              />
            </div>
          </div>
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-[9999] min-w-[200px] overflow-hidden rounded-xl border border-zinc-800 bg-[#0e0e12]/95 backdrop-blur-md p-1.5 shadow-2xl"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={async () => {
              if (await confirm("Clear the canvas?")) {
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

      {/* Feature modals */}
      {showLibraryManager && (
        <LibraryManager
          code={isEditing ? editableCode : generatedCode}
          isConnected={isConnected}
          onUploadFile={uploadLibFile}
          onClose={() => setShowLibraryManager(false)}
        />
      )}

      {showDesignerHub && (
        <DesignerHub
          defaultTab={designerTab}
          onClose={() => setShowDesignerHub(false)}
          onAddNode={(type, data) => { canvasRef.current?.addNode(type, data); setShowDesignerHub(false); }}
          onSaveOLEDAnimation={uploadOLEDAnimation}
        />
      )}

      {showFirmwareFlasher && (
        <FirmwareFlasher onClose={() => setShowFirmwareFlasher(false)} />
      )}

      {showESP32Files && (
        <ESP32FilesPanel
          isConnected={isConnected}
          onClose={() => setShowESP32Files(false)}
          sendPythonCode={sendPythonCode}
          sendCode={sendCode}
        />
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
    </NodeActionsProvider>
  );
}
