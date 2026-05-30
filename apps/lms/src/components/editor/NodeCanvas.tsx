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
import { NODE_TYPES } from "./nodes";
import { generatePythonFromFlow } from "@/lib/nodeCodegen";

export interface NodeCanvasRef {
  getCode: () => string;
  getWorkspace: () => { nodes: Node[]; edges: Edge[] };
  setWorkspace: (workspace: { nodes: Node[]; edges: Edge[] }) => void;
  getRequiredLibraries: () => any[];
}

interface NodeCanvasProps {
  onCodeChange?: (code: string) => void;
  onFlowChange?: (nodes: Node[], edges: Edge[]) => void;
  className?: string;
  allowedCategories?: string[];
  allowedNodeTypes?: string[];
}

let nodeIdCounter = 1;
const getId = () => `node_${nodeIdCounter++}`;

function NodeCanvasInner({
  onCodeChange,
  onFlowChange,
  allowedNodeTypes,
  canvasRef,
}: NodeCanvasProps & { canvasRef: React.Ref<NodeCanvasRef> }) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

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
    const nodeType = e.dataTransfer.getData("application/reactflow-nodetype");
    if (!nodeType) return;
    if (allowedNodeTypes && !allowedNodeTypes.includes(nodeType)) return;
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    setNodes((nds) => nds.concat({ id: getId(), type: nodeType, position, data: { label: nodeType } }));
  }, [allowedNodeTypes, screenToFlowPosition]);

  useImperativeHandle(canvasRef, () => ({
    getCode: () => generatePythonFromFlow(nodes, edges),
    getWorkspace: () => ({ nodes, edges }),
    setWorkspace: (ws) => { setNodes(ws.nodes || []); setEdges(ws.edges || []); },
    getRequiredLibraries: () => [],
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
