/**
 * Hardware ↔ Blocks bidirectional sync state.
 * Kept in a separate non-component module so Vite Fast Refresh stays happy
 * (a file that mixes React components with plain exports breaks HMR).
 */
import type { Node, Edge } from "@xyflow/react";
import type { NodeCanvasRef } from "@/widgets/node-canvas/ui/NodeCanvas";

// ── Re-exported so HardwareView can init from here ───────────────────────────

export type HwSyncSetNodes = (fn: (ns: Node[]) => Node[]) => void;
export type HwSyncSetEdges = (fn: (es: Edge[]) => Edge[]) => void;

/** Live setters — registered by HardwareCanvas when mounted */
export let setNodesRef: HwSyncSetNodes | null = null;
export let setEdgesRef: HwSyncSetEdges | null = null;
/** Global canvas ref so ComponentNode toggle can call addNode/removeNode */
export let canvasRefGlobal: React.RefObject<NodeCanvasRef | null> | null = null;

export function registerHwCanvas(
  sn: HwSyncSetNodes,
  se: HwSyncSetEdges,
  cr: React.RefObject<NodeCanvasRef | null>
) {
  setNodesRef = sn;
  setEdgesRef = se;
  canvasRefGlobal = cr;
}

export function unregisterHwCanvas() {
  setNodesRef = null;
  setEdgesRef = null;
  canvasRefGlobal = null;
}

/** logic canvas id → hw canvas id */
export const logicToHw: Record<string, string> = {};
/** hw canvas id → logic canvas id */
export const hwToLogic: Record<string, string> = {};
/** ports currently occupied */
export const usedPorts: Set<string> = new Set();
/** logic node IDs to skip in the next onFlowChange diff */
export const suppressSyncIds: Set<string> = new Set();

export function isFlowSyncSuppressed(logicId: string): boolean {
  if (suppressSyncIds.has(logicId)) {
    suppressSyncIds.delete(logicId);
    return true;
  }
  return false;
}
