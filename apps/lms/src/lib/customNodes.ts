import { useEffect, useState } from "react";
import type { Node } from "@xyflow/react";

export interface CustomNodeTemplate {
  id: string;
  label: string;
  sourceType: string;
  data: Record<string, unknown>;
  color: string;
  previewDot: string;
}

const STORAGE_KEY = "kakoon-custom-nodes";
const CUSTOM_NODES_CHANGED_EVENT = "kakoon-custom-nodes-changed";

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

export function saveCustomNodeTemplate(template: Omit<CustomNodeTemplate, "id">) {
  const savedTemplate: CustomNodeTemplate = {
    ...template,
    id: `custom_node_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    data: cloneData(template.data),
  };
  writeCustomNodes([...readCustomNodes(), savedTemplate]);
  return savedTemplate;
}

export function saveCustomNodeFromNode(node: Node, label: string) {
  const data = cloneData<Record<string, unknown>>(node.data ?? {});
  return saveCustomNodeTemplate({
    label,
    sourceType: node.type ?? "",
    data,
    color: typeof data.color === "string" ? data.color : "#7c3aed",
    previewDot: typeof data.previewDot === "string" ? data.previewDot : "#7c3aed",
  });
}

export function removeCustomNode(id: string) {
  writeCustomNodes(readCustomNodes().filter((node) => node.id !== id));
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
    removeCustomNode,
  };
}