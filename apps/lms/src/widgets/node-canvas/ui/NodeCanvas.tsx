import {
  forwardRef,
  useImperativeHandle,
  useCallback,
  useState,
  useEffect,
  useRef,
} from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  BaseEdge,
  getBezierPath,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type EdgeProps,
  type EdgeTypes,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import { NODE_TYPES } from "@/entities/node/model";
import { generatePythonFromFlow } from "@/entities/node/lib/codegen";
import { instantiateCustomNodeTemplate, isCustomNodeTemplateAllowed, type CustomNodeTemplate } from "@/entities/custom-node/model/customNodes";
import { CONNECTION_RADIUS } from "@/shared/lib/canvasConfig";

// ─── Glow edge — selected edges get a colored halo via Framer Motion ──────────

function GlowEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, selected, style, markerEnd }: EdgeProps) {
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  // Wires follow the active theme accent instead of a fixed violet.
  const baseStroke = (style?.stroke as string) ?? "var(--k-primary)";
  const sel = selected ?? false;
  const activeStroke = "color-mix(in srgb, var(--k-primary) 55%, white)";

  return (
    <>
      <AnimatePresence>
        {sel && (
          <motion.path
            key={`halo-${id}`}
            d={edgePath}
            fill="none"
            stroke={activeStroke}
            strokeWidth={16}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.22 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ filter: "blur(7px)", pointerEvents: "none" }}
          />
        )}
      </AnimatePresence>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: sel ? activeStroke : baseStroke,
          strokeWidth: sel ? 2.5 : ((style?.strokeWidth as number) ?? 2),
          filter: sel ? "drop-shadow(0 0 5px var(--k-primary))" : "none",
          transition: "stroke 0.18s ease, stroke-width 0.18s ease, filter 0.18s ease",
        }}
      />
    </>
  );
}

const EDGE_TYPES: EdgeTypes = { default: GlowEdge };

export interface NodeCanvasRef {
  getCode: () => string;
  getWorkspace: () => { nodes: Node[]; edges: Edge[] };
  setWorkspace: (workspace: { nodes: Node[]; edges: Edge[] }) => void;
  addNode: (type: string, data?: Record<string, unknown>) => string;
  removeNode: (id: string) => void;
  getRequiredLibraries: () => string[];
}

interface NodeCanvasProps {
  onCodeChange?: (code: string) => void;
  onFlowChange?: (nodes: Node[], edges: Edge[]) => void;
  className?: string;
  allowedCategories?: string[];
  allowedNodeTypes?: string[];
}

const getId = () => `node_${crypto.randomUUID().slice(0, 8)}`;

/** True when the user is typing somewhere — copy/paste must not hijack inputs. */
function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return (
    el.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)
  );
}

function NodeCanvasInner({
  onCodeChange,
  onFlowChange,
  allowedNodeTypes,
  canvasRef,
}: NodeCanvasProps & { canvasRef: React.Ref<NodeCanvasRef> }) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const FIT_VIEW_MAX_ZOOM = 1.3;
  const MIN_ZOOM = 0.35;
  const MAX_ZOOM = 2;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, getViewport } = useReactFlow();

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds) as Node[]),
    []
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds) as Edge[]),
    []
  );
  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge({ ...params, style: { stroke: "var(--k-primary)", strokeWidth: 2 }, animated: true }, eds) as Edge[]
      ),
    []
  );

  useEffect(() => {
    const code = generatePythonFromFlow(nodes, edges);
    onCodeChange?.(code);
    onFlowChange?.(nodes, edges);
  }, [nodes, edges, onCodeChange, onFlowChange]);

  // ── Copy / paste / duplicate (Ctrl/Cmd + C, V, D) ──────────────────────────
  // Clipboard lives in a ref: per-canvas, survives re-renders, never persisted.
  const clipboardRef = useRef<{ nodes: Node[]; edges: Edge[] } | null>(null);
  const pasteCountRef = useRef(0);

  const copySelection = useCallback(() => {
    const selNodes = nodes.filter((n) => n.selected);
    if (selNodes.length === 0) return false;
    const selIds = new Set(selNodes.map((n) => n.id));
    // Only keep wires whose both ends are inside the selection.
    const selEdges = edges.filter((e) => selIds.has(e.source) && selIds.has(e.target));
    clipboardRef.current = {
      nodes: structuredClone(selNodes),
      edges: structuredClone(selEdges),
    };
    pasteCountRef.current = 0;
    return true;
  }, [nodes, edges]);

  const pasteClipboard = useCallback(() => {
    const clip = clipboardRef.current;
    if (!clip || clip.nodes.length === 0) return;
    pasteCountRef.current += 1;
    const offset = 36 * pasteCountRef.current;

    const idMap = new Map<string, string>();
    const newNodes = clip.nodes.map((n) => {
      const id = getId();
      idMap.set(n.id, id);
      return {
        ...structuredClone(n),
        id,
        position: { x: n.position.x + offset, y: n.position.y + offset },
        selected: true,
      };
    });
    const newEdges = clip.edges.map((e) => ({
      ...structuredClone(e),
      id: `edge_${crypto.randomUUID().slice(0, 8)}`,
      source: idMap.get(e.source)!,
      target: idMap.get(e.target)!,
      selected: false,
    }));

    // Deselect everything else so the pasted copies become the active selection.
    setNodes((nds) => nds.map((n) => ({ ...n, selected: false })).concat(newNodes));
    setEdges((eds) => eds.map((e) => ({ ...e, selected: false })).concat(newEdges));
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || isTypingTarget(e.target)) return;
      // Don't fight the browser when the user has text selected.
      if (window.getSelection()?.toString()) return;
      const key = e.key.toLowerCase();
      if (key === "c") {
        if (copySelection()) e.preventDefault();
      } else if (key === "v") {
        if (clipboardRef.current) { e.preventDefault(); pasteClipboard(); }
      } else if (key === "d") {
        if (copySelection()) { e.preventDefault(); pasteClipboard(); }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [copySelection, pasteClipboard]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    const customRaw = e.dataTransfer.getData("application/reactflow-custom-node");
    if (customRaw) {
      try {
        const template = JSON.parse(customRaw) as CustomNodeTemplate;
        const allowedNodeTypeSet = allowedNodeTypes ? new Set(allowedNodeTypes) : undefined;
        if (!isCustomNodeTemplateAllowed(template, allowedNodeTypeSet)) return;
        const instanced = instantiateCustomNodeTemplate(template, position);
        setNodes((nds) => nds.concat(instanced.nodes as Node[]));
        setEdges((eds) => eds.concat(instanced.edges as Edge[]));
        return;
      } catch {
        return;
      }
    }

    const nodeType = e.dataTransfer.getData("application/reactflow-nodetype");
    if (!nodeType) return;
    if (allowedNodeTypes && !allowedNodeTypes.includes(nodeType)) return;
    setNodes((nds) => nds.concat({ id: getId(), type: nodeType, position, data: { label: nodeType } }));
  }, [allowedNodeTypes, screenToFlowPosition]);

  useImperativeHandle(canvasRef, () => ({
    getCode: () => generatePythonFromFlow(nodes, edges),
    getWorkspace: () => ({ nodes, edges }),
    // Drop persisted selection state — restoring `selected: true` edges would
    // light up their glow halos on load.
    setWorkspace: (ws) => {
      setNodes((ws.nodes || []).map((n) => ({ ...n, selected: false })));
      setEdges((ws.edges || []).map((e) => ({ ...e, selected: false })));
    },
    addNode: (type: string, data: Record<string, unknown> = {}) => {
      let position = { x: 200, y: 200 };
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        const { x: vpX, y: vpY, zoom } = getViewport();
        position = {
          x: (rect.width  / 2 - vpX) / zoom,
          y: (rect.height / 2 - vpY) / zoom,
        };
        position.x += (Math.random() - 0.5) * 40;
        position.y += (Math.random() - 0.5) * 40;
      }
      const id = getId();
      setNodes((nds) => [...nds, { id, type, position, data: { label: type, ...data } }]);
      return id;
    },
    removeNode: (id: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
    },
    getRequiredLibraries: () => {
      const code = generatePythonFromFlow(nodes, edges);
      // Scan import statements for known third-party MicroPython libraries
      const THIRD_PARTY = ["ssd1306", "mpu6050", "ds18x20", "onewire", "umqtt", "neopixel", "bme280", "vl53l0x", "ads1x15"];
      const found = new Set<string>();
      for (const line of code.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("import") && !trimmed.startsWith("from")) continue;
        for (const lib of THIRD_PARTY) {
          if (trimmed.includes(lib)) found.add(lib);
        }
      }
      return Array.from(found);
    },
  }));

  return (
    <div
      ref={wrapperRef}
      className="canvas-vignette relative h-full w-full"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      {/* Empty-state guide — fades out the moment the first block lands */}
      <AnimatePresence>
        {nodes.length === 0 && (
          <motion.div
            key="canvas-empty-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            // Delay past the saved-workspace fetch so it never flashes on restore.
            transition={{ duration: 0.25, delay: 0.6 }}
            className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-subtle bg-raised text-3xl shadow-sm">
              🤖
            </div>
            <p className="text-[15px] font-bold text-sub">Let's build something!</p>
            <p className="max-w-[260px] text-center text-[13px] leading-relaxed text-hint">
              Drag a block from the left panel onto the canvas — wire blocks together and
              hit <span className="font-bold text-primary-c">Run</span> to see your robot move.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.6, maxZoom: FIT_VIEW_MAX_ZOOM }}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        connectionRadius={CONNECTION_RADIUS}
        deleteKeyCode={["Backspace", "Delete"]}
        connectionLineStyle={{ stroke: "var(--k-primary)", strokeWidth: 2, filter: "drop-shadow(0 0 6px var(--k-primary))" }}
        defaultEdgeOptions={{ style: { stroke: "var(--k-primary)", strokeWidth: 2 }, animated: true }}
      >
        <Background id="dots" color="var(--k-dim)" gap={52} size={1.5} variant={BackgroundVariant.Dots} style={{ backgroundColor: "var(--k-base-100)" }} />
        <Controls style={{ background: "var(--k-base-300)", border: "1px solid var(--k-base-400)", borderRadius: "8px" }} />
        <MiniMap
          nodeColor="var(--k-primary)"
          maskColor="color-mix(in srgb, var(--k-base-100) 78%, transparent)"
          style={{ backgroundColor: "var(--k-base-300)", border: "1px solid var(--k-base-400)", borderRadius: "8px" }}
        />
      </ReactFlow>
    </div>
  );
}

export const NodeCanvas = forwardRef<NodeCanvasRef, NodeCanvasProps>(
  function NodeCanvas({ onCodeChange, onFlowChange, className = "", allowedCategories, allowedNodeTypes }, ref) {
    const [sidebarWidth, setSidebarWidth] = useState(280);
    const isResizing = useRef(false);

    const startResizing = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      isResizing.current = true;
    }, []);

    const stopResizing = useCallback(() => { isResizing.current = false; }, []);

    const resize = useCallback((e: MouseEvent) => {
      if (!isResizing.current) return;
      setSidebarWidth(Math.max(200, Math.min(500, e.clientX)));
    }, []);

    useEffect(() => {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
      return () => {
        window.removeEventListener("mousemove", resize);
        window.removeEventListener("mouseup", stopResizing);
      };
    }, [resize, stopResizing]);

    return (
      <ReactFlowProvider>
        <div className={`flex h-full w-full ${className}`}>
          <NodePaletteWrapper width={sidebarWidth} allowedCategories={allowedCategories} allowedNodeTypes={allowedNodeTypes} />
          <div
            onMouseDown={startResizing}
            className="w-1 hover:w-1.5 bg-[var(--k-base-400)] hover:bg-[var(--k-primary)]/50 active:bg-[var(--k-primary)] cursor-col-resize transition-all flex-shrink-0 z-50"
            style={{ marginRight: "-2px", marginLeft: "-2px" }}
          />
          <NodeCanvasInner onCodeChange={onCodeChange} onFlowChange={onFlowChange} allowedNodeTypes={allowedNodeTypes} canvasRef={ref} />
        </div>
      </ReactFlowProvider>
    );
  }
);

// Lazy import to avoid circular dep
import { NodePalette as NodePaletteWrapper } from "./NodePalette";
