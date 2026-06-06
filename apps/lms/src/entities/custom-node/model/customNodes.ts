import { useEffect, useState } from "react";
import type { Edge, Node } from "@xyflow/react";

export interface SavedCustomNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface SavedCustomEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  animated?: boolean;
  label?: string;
  style?: Edge["style"];
}

export interface CustomNodeTemplate {
  id: string;
  label: string;
  sourceType: string;
  color: string;
  previewDot: string;
  nodes: SavedCustomNode[];
  edges: SavedCustomEdge[];
}

const STORAGE_KEY = "kokoon-custom-nodes";
const CUSTOM_NODES_CHANGED_EVENT = "kokoon-custom-nodes-changed";

function cloneData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function emitChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CUSTOM_NODES_CHANGED_EVENT));
}

export function readCustomNodes(): CustomNodeTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCustomNodes(nodes: CustomNodeTemplate[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
  emitChange();
}

function getConnectedNodeIds(anchorId: string, nodes: Node[], edges: Edge[]) {
  const connected = new Set<string>([anchorId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const edge of edges) {
      if (connected.has(edge.source) && !connected.has(edge.target)) {
        connected.add(edge.target);
        changed = true;
      }
      if (connected.has(edge.target) && !connected.has(edge.source)) {
        connected.add(edge.source);
        changed = true;
      }
    }
  }
  return nodes.filter((node) => connected.has(node.id));
}

function normalizeNodeNodes(anchorNode: Node, nodes: Node[]) {
  const origin = anchorNode.position;
  return nodes.map((node) => ({
    id: node.id,
    type: node.type ?? "",
    position: {
      x: node.position.x - origin.x,
      y: node.position.y - origin.y,
    },
    data: cloneData<Record<string, unknown>>(node.data ?? {}),
  }));
}

function normalizeNodeEdges(nodeIds: Set<string>, edges: Edge[]) {
  return edges
    .filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target))
    .map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle ?? undefined,
      targetHandle: edge.targetHandle ?? undefined,
      type: edge.type,
      animated: edge.animated,
      label: typeof edge.label === "string" ? edge.label : undefined,
      style: edge.style,
    }));
}

export function saveCustomNodeTemplate(template: Omit<CustomNodeTemplate, "id">) {
  const savedTemplate: CustomNodeTemplate = {
    ...template,
    id: `custom_node_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    nodes: cloneData(template.nodes),
    edges: cloneData(template.edges),
  };
  writeCustomNodes([...readCustomNodes(), savedTemplate]);
  return savedTemplate;
}

export function saveCustomNodeFromNode(node: Node, label: string) {
  return saveCustomNodeTemplate({
    label,
    sourceType: node.type ?? "",
    color: "#7c3aed",
    previewDot: "#7c3aed",
    nodes: [
      {
        id: node.id,
        type: node.type ?? "",
        position: { x: 0, y: 0 },
        data: cloneData<Record<string, unknown>>(node.data ?? {}),
      },
    ],
    edges: [],
  });
}

export function saveCustomSubflowFromSelection(anchorNode: Node, nodes: Node[], edges: Edge[], label: string) {
  const connectedNodes = getConnectedNodeIds(anchorNode.id, nodes, edges);
  const connectedNodeIds = new Set(connectedNodes.map((node) => node.id));
  const normalizedNodes = normalizeNodeNodes(anchorNode, connectedNodes);
  const normalizedEdges = normalizeNodeEdges(connectedNodeIds, edges);
  return saveCustomNodeTemplate({
    label,
    sourceType: anchorNode.type ?? "",
    color: "#7c3aed",
    previewDot: "#7c3aed",
    nodes: normalizedNodes,
    edges: normalizedEdges,
  });
}

export function removeCustomNode(id: string) {
  writeCustomNodes(readCustomNodes().filter((node) => node.id !== id));
}

export function updateCustomNodeLabel(id: string, label: string) {
  const nextNodes = readCustomNodes().map((node) => (node.id === id ? { ...node, label } : node));
  writeCustomNodes(nextNodes);
}

export function instantiateCustomNodeTemplate(template: CustomNodeTemplate, position: { x: number; y: number }) {
  const idMap = new Map<string, string>();
  const nodes = template.nodes.map((node) => {
    const newId = `custom_${template.id}_${node.id}_${Math.random().toString(36).slice(2, 6)}`;
    idMap.set(node.id, newId);
    return {
      id: newId,
      type: node.type,
      position: {
        x: position.x + node.position.x,
        y: position.y + node.position.y,
      },
      data: cloneData(node.data),
    };
  });

  const edges = template.edges.map((edge) => ({
    ...edge,
    id: `custom_${template.id}_${edge.id}_${Math.random().toString(36).slice(2, 6)}`,
    source: idMap.get(edge.source) ?? edge.source,
    target: idMap.get(edge.target) ?? edge.target,
  }));

  return { nodes: nodes as Node[], edges: edges as Edge[] };
}

export function isCustomNodeTemplateAllowed(template: CustomNodeTemplate, allowedNodeTypes?: Set<string>) {
  if (!allowedNodeTypes) return true;
  return template.nodes.every((node) => allowedNodeTypes.has(node.type));
}

export function useCustomNodes() {
  const [customNodes, setCustomNodes] = useState<CustomNodeTemplate[]>(() => readCustomNodes());

  useEffect(() => {
    const sync = () => setCustomNodes(readCustomNodes());
    window.addEventListener("storage", sync);
    window.addEventListener(CUSTOM_NODES_CHANGED_EVENT, sync);
    sync();
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(CUSTOM_NODES_CHANGED_EVENT, sync);
    };
  }, []);

  return {
    customNodes,
    saveCustomNodeFromNode,
    saveCustomSubflowFromSelection,
    removeCustomNode,
    updateCustomNodeLabel,
  };
}