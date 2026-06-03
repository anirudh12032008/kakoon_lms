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
  Controls,
  MiniMap,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { NODE_TYPES } from "@/entities/node/model";
import { generatePythonFromFlow } from "@/entities/node/lib/codegen";
import { instantiateCustomNodeTemplate, isCustomNodeTemplateAllowed, type CustomNodeTemplate } from "@/entities/custom-node/model/customNodes";

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
        addEdge({ ...params, style: { stroke: "#7c3aed", strokeWidth: 2 }, animated: true }, eds) as Edge[]
      ),
    []
  );

  useEffect(() => {
    const code = generatePythonFromFlow(nodes, edges);
    onCodeChange?.(code);
    onFlowChange?.(nodes, edges);
  }, [nodes, edges, onCodeChange, onFlowChange]);

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
    setWorkspace: (ws) => { setNodes(ws.nodes || []); setEdges(ws.edges || []); },
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
      className="h-full w-full"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.6, maxZoom: FIT_VIEW_MAX_ZOOM }}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        deleteKeyCode={["Backspace", "Delete"]}
        connectionLineStyle={{ stroke: "#7c3aed", strokeWidth: 2 }}
        defaultEdgeOptions={{ style: { stroke: "#7c3aed", strokeWidth: 2 }, animated: true }}
      >
        <Background color="#1f1f23" gap={24} size={1.5} style={{ backgroundColor: "#09090b" }} />
        <Controls style={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }} />
        <MiniMap
          nodeColor="#8b5cf6"
          maskColor="rgba(9, 9, 11, 0.85)"
          style={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }}
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
            className="w-1 hover:w-1.5 bg-[#1f1f23] hover:bg-[#7c3aed]/50 active:bg-[#7c3aed] cursor-col-resize transition-all flex-shrink-0 z-50"
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
