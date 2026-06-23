import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Node, Edge } from "@xyflow/react";
import { useModal } from "@/shared/context/ModalContext";
import { Trash2 } from "lucide-react";
import { NodeCanvas, type NodeCanvasRef } from "@/widgets/node-canvas/ui/NodeCanvas";
import { useSerialConnection } from "@/features/editor/serial-connect/model/useSerial";
import { TutorialsDashboard } from "@/features/editor/tutorial/ui/TutorialsDashboard";
import { TutorialHelper } from "@/features/editor/tutorial/ui/TutorialHelper";
import { SaveAsTutorialModal } from "@/features/editor/tutorial/ui/SaveAsTutorialModal";
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
import { useCourseSync } from "@/features/editor/save-draft/model/useCourseSync";
import { useProject } from "@/features/editor/save-project/model/useProject";
import { useProjectStore } from "@/shared/launch/projectStore";
import { useCourseMissions } from "@/features/editor/missions/model/useCourseMissions";
import { MissionsPanel } from "@/features/editor/missions/ui/MissionsPanel";
import { useTutorial } from "@/features/editor/tutorial/model/useTutorial";

import type { EditorLaunchContext } from "@/entities/editor-launch/model/config";
import { NodeActionsProvider } from "@/shared/context/NodeActionsContext";
import { ESP32FilesPanel } from "@/features/editor/esp32-files/ui/ESP32FilesPanel";
import { HardwareView, syncAddHwNode, syncRemoveHwNode, isFlowSyncSuppressed, resyncHwFromBlocks } from "@/widgets/hardware-view/ui/HardwareView";
import { removeAnim, markOnDevice } from "@/shared/lib/animRegistry";

export type LessonContext = EditorLaunchContext;
export type ViewMode = "blocks" | "split" | "code" | "hardware";

interface EditorPageProps {
  launchContext?: EditorLaunchContext;
  onBackToDashboard?: () => void;
  /** View-only shared session — no palette, no editing, no persistence. */
  readOnly?: boolean;
  /** Author label shown in read-only mode ("Created by …"). */
  sharedAuthorName?: string;
  /** Workspace + code to inject when viewing a shared project read-only. */
  initialWorkspace?: { nodes: Node[]; edges: Edge[] };
  initialCode?: string;
}

export default function EditorPage({
  launchContext, onBackToDashboard,
  readOnly = false, sharedAuthorName, initialWorkspace, initialCode,
}: EditorPageProps) {
  const canvasRef = useRef<NodeCanvasRef>(null);
  const prevBlocksNodesRef = useRef<Node[]>([]);

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
  const { confirm, prompt } = useModal();

  // ── Feature panel visibility ────────────────────────────────────────────────
  const [showTerminal, setShowTerminal] = useState(false);
  const [showLibraryManager, setShowLibraryManager] = useState(false);
  const [showDesignerHub, setShowDesignerHub] = useState(false);
  const [showSaveAsTutorial, setShowSaveAsTutorial] = useState(false);
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
    sendCode, stopCode, uploadCode,
    logs, addLog, clearLogs,
  } = useSerialConnection();

  // ── Persistence ──────────────────────────────────────────────────────────────
  // Course sessions sync to the learner's LMS account; sandbox sessions keep a
  // local draft.
  const courseSlug = launchContext?.courseSlug;
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  // A standalone session is bound to a saved project; otherwise it's a sandbox
  // that keeps a local draft until the user saves it.
  const isProjectSession = !courseSlug && !!activeProjectId;

  useDraft({
    canvasRef, enabled: !readOnly && !courseSlug && !activeProjectId, isLoadingDraft, setIsLoadingDraft,
    generatedCode, editableCode, hasManualEdits, viewMode, isEditing,
    setGeneratedCode, setEditableCode, setHasManualEdits, setViewMode, setIsEditing,
  });

  const { syncState } = useCourseSync({
    canvasRef, courseSlug: readOnly ? undefined : courseSlug, isLoadingDraft, setIsLoadingDraft,
    generatedCode, editableCode,
  });

  const project = useProject({
    canvasRef, enabled: !readOnly && !courseSlug, isLoadingDraft, setIsLoadingDraft, launchContext,
    generatedCode, editableCode, hasManualEdits, viewMode, isEditing,
    setGeneratedCode, setEditableCode, setHasManualEdits, setViewMode, setIsEditing,
  });

  // Read-only shared view: inject the provided workspace once the canvas mounts.
  useEffect(() => {
    if (!readOnly || !initialWorkspace) { if (readOnly) setIsLoadingDraft(false); return; }
    if (initialCode) { setGeneratedCode(initialCode); setEditableCode(initialCode); }
    const apply = (attempt: number) => {
      if (canvasRef.current) canvasRef.current.setWorkspace(initialWorkspace);
      else if (attempt < 40) setTimeout(() => apply(attempt + 1), 50);
    };
    apply(0);
    setIsLoadingDraft(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly]);

  // Save / rename the current sandbox as a named project on the user's account.
  const handleSaveProject = useCallback(async () => {
    if (isProjectSession) {
      const next = await prompt("Rename project", project.projectName ?? "");
      if (next && next.trim()) await project.rename(next);
      return;
    }
    const name = await prompt("Save project as", launchContext?.title ?? "My project");
    if (name && name.trim()) await project.saveAsNew(name);
  }, [isProjectSession, project, prompt, launchContext]);

  // Copy a public share link for the active project (saving first if needed).
  const [shareCopied, setShareCopied] = useState(false);
  const handleShareProject = useCallback(async () => {
    let slug = project.projectSlug;
    if (!isProjectSession || !slug) {
      const name = await prompt("Name this project to share", launchContext?.title ?? "My project");
      if (!name || !name.trim()) return;
      await project.saveAsNew(name);
      slug = useProjectStore.getState().activeProjectSlug;
    }
    if (!slug) return;
    const url = `${window.location.origin}/p/${slug}`;
    try { await navigator.clipboard.writeText(url); } catch { /* clipboard blocked */ }
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  }, [project, isProjectSession, prompt, launchContext]);

  // ── Course missions (auto-tracked levels & challenges) ───────────────────────
  const missions = useCourseMissions(courseSlug);

  // ── WiFi ─────────────────────────────────────────────────────────────────────
  const wifi = useWifi({ connectWifi, setConnectionMode, addLog });

  // ── Tutorials ───────────────────────────────────────────────────────────────
  const tutorial = useTutorial({ canvasRef, addLog, isLoadingDraft });

  // ── Blocks ↔ Hardware bidirectional sync ─────────────────────────────────────
  const handleFlowChange = useCallback((nds: Node[], eds: Edge[]) => {
    tutorial.setActiveFlowNodes(nds);
    tutorial.setActiveFlowEdges(eds);

    const prev = prevBlocksNodesRef.current;
    const prevIds = new Set(prev.map(n => n.id));
    const currIds = new Set(nds.map(n => n.id));

    // Detect newly added blocks nodes → mirror to hardware view
    for (const node of nds) {
      if (!prevIds.has(node.id) && !isFlowSyncSuppressed(node.id)) {
        syncAddHwNode(node.id, node.type ?? "", node.data as Record<string, unknown>);
      }
    }

    // Detect removed blocks nodes → remove from hardware view
    for (const node of prev) {
      if (!currIds.has(node.id)) {
        syncRemoveHwNode(node.id);
      }
    }

    prevBlocksNodesRef.current = nds;

    // Auto-evaluate course missions against the live node graph.
    missions.evaluate(nds.map((n) => n.type ?? ""), nds.length);
  }, [tutorial, missions]);

  // ── Sync: reconcile hardware view on every switch into it ───────────────────
  // The incremental diff in handleFlowChange can drift (e.g. draft load,
  // project switch, hardware-initiated changes). A full reconcile on each
  // view transition guarantees both canvases always show the same state.
  useEffect(() => {
    if (viewMode === "hardware") {
      const workspace = canvasRef.current?.getWorkspace();
      if (workspace) resyncHwFromBlocks(workspace.nodes);
    } else {
      // Returning from hardware view: reset prevBlocksNodesRef to the current
      // blocks state so the next handleFlowChange diff starts from a clean baseline.
      const workspace = canvasRef.current?.getWorkspace();
      if (workspace) prevBlocksNodesRef.current = workspace.nodes;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

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
    frames: number[][], fps: number, name: string,
    onProgress?: (pct: number) => void
  ): Promise<boolean> => {
    if (!isConnected) { addLog("⚠️ Not connected to ESP32"); return false; }
    onProgress?.(0);

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
        onProgress?.(Math.round((i / totalBytes) * 100));
      }

      await sendCode(`_oaf.close()\nprint('ANIM_SAVED:${safeName}')\n`);
      onProgress?.(100);
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

  // ── Export / Import ───────────────────────────────────────────────────────────
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleExportProject = useCallback(() => {
    const workspace = canvasRef.current?.getWorkspace();
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      flowData: workspace ? JSON.stringify(workspace) : "",
      generatedCode,
      editableCode,
      hasManualEdits,
      viewMode,
      isEditing,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kokoon-project-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [canvasRef, generatedCode, editableCode, hasManualEdits, viewMode, isEditing]);

  const handleImportProject = useCallback(() => {
    importInputRef.current?.click();
  }, []);

  const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.editableCode !== undefined) setEditableCode(data.editableCode);
        if (data.hasManualEdits !== undefined) setHasManualEdits(data.hasManualEdits);
        if (data.viewMode) setViewMode(data.viewMode);
        if (data.isEditing !== undefined) setIsEditing(data.isEditing);
        if (data.generatedCode !== undefined) setGeneratedCode(data.generatedCode);
        if (data.flowData) {
          try {
            const workspace = JSON.parse(data.flowData);
            requestAnimationFrame(() => {
              canvasRef.current?.setWorkspace(workspace);
            });
          } catch { /* corrupted flow data */ }
        }
      } catch {
        addLog("❌ Failed to import project — invalid JSON file.");
      }
    };
    reader.readAsText(file);
    // Reset so the same file can be imported again if needed
    e.target.value = "";
  }, [canvasRef, setEditableCode, setHasManualEdits, setViewMode, setIsEditing, setGeneratedCode, addLog]);

  return (
    <NodeActionsProvider
      openMatrixDesigner={() => { setDesignerTab("matrix"); setShowDesignerHub(true); }}
      deleteOLEDAnim={deleteOLEDAnim}
    >
    <div
      className="flex h-screen flex-col bg-page"
      onClick={() => setContextMenu(null)}
    >
      <input
        ref={importInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportFile}
      />
      <EditorHeader
        viewMode={viewMode}
        setViewMode={setViewMode}
        setIsEditing={setIsEditing}
        launchContext={launchContext}
        isCourse={!!courseSlug}
        syncState={syncState}
        projectSyncState={isProjectSession ? project.syncState : undefined}
        projectName={isProjectSession ? project.projectName : undefined}
        canSaveProject={!courseSlug && !readOnly}
        onSaveProject={handleSaveProject}
        onShareProject={readOnly ? undefined : handleShareProject}
        shareCopied={shareCopied}
        readOnly={readOnly}
        sharedAuthorName={sharedAuthorName}
        showTutorialsCatalog={tutorial.showTutorialsCatalog}
        onToggleTutorials={() => tutorial.setShowTutorialsCatalog(!tutorial.showTutorialsCatalog)}
        onBackToDashboard={onBackToDashboard}
        onSaveAsTutorial={() => setShowSaveAsTutorial(true)}
        onExportProject={handleExportProject}
        onImportProject={handleImportProject}
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
        <AnimatePresence>
          {viewMode === "hardware" && (
            <motion.div
              key="hardware-view"
              className="absolute inset-0 z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <HardwareView canvasRef={canvasRef} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Node canvas — always mounted so canvasRef stays valid */}
        <div
          className={`overflow-hidden transition-all duration-300 ${
            viewMode === "code" || viewMode === "hardware" ? "w-0" : "flex-1"
          }`}
          onContextMenu={handleContextMenu}
        >
          <NodeCanvas
            ref={canvasRef}
            onCodeChange={setGeneratedCode}
            onFlowChange={handleFlowChange}
            allowedCategories={launchRestrictions.allowedCategories}
            allowedNodeTypes={launchRestrictions.allowedNodeTypes}
            readOnly={readOnly}
          />
        </div>

        <AnimatePresence>
          {(viewMode === "split" || viewMode === "code") && (
            <motion.div
              key="code-panel"
              className="flex h-full"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            >
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
            </motion.div>
          )}
        </AnimatePresence>

        {/* Course missions — auto-tracked levels & challenges */}
        {courseSlug && missions.enabled && <MissionsPanel missions={missions} />}
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
        onOpenFileManager={() => setShowESP32Files(true)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 backdrop-blur-md"
          style={{ background: "rgba(0,0,0,0.85)" }}>
          <div className="relative w-full h-[90vh] max-w-6xl overflow-hidden rounded-2xl shadow-2xl flex flex-col bg-page border border-subtle">
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
          className="fixed z-[9999] min-w-[180px] overflow-hidden rounded-xl p-1.5 shadow-2xl bg-panel border border-subtle backdrop-blur-md"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={async () => {
              if (await confirm("Clear the canvas?")) {
                canvasRef.current?.setWorkspace({ nodes: [], edges: [] });
              }
              setContextMenu(null);
            }}
            className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors text-error-c hover:bg-error-tint"
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
          logs={logs}
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

      {showSaveAsTutorial && (
        <SaveAsTutorialModal
          onClose={() => setShowSaveAsTutorial(false)}
          getWorkspace={() => canvasRef.current?.getWorkspace() ?? { nodes: [], edges: [] }}
        />
      )}
    </div>
    </NodeActionsProvider>
  );
}
