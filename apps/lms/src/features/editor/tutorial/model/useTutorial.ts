import { useState, useEffect, useCallback } from "react";
import type { Node, Edge } from "@xyflow/react";
import { builtinTutorials, type Tutorial } from "@/features/editor/tutorial/lib/tutorials";
import { useBoardStore } from "@/entities/board";
import type { NodeCanvasRef } from "@/widgets/node-canvas/ui/NodeCanvas";
import type { RefObject } from "react";

interface UseTutorialOptions {
  canvasRef: RefObject<NodeCanvasRef | null>;
  addLog: (msg: string) => void;
  isLoadingDraft: boolean;
}

export function useTutorial({ canvasRef, addLog, isLoadingDraft }: UseTutorialOptions) {
  const [showTutorialsCatalog, setShowTutorialsCatalog] = useState(false);
  const [activeTutorial, setActiveTutorial] = useState<Tutorial | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedTutorialIds, setCompletedTutorialIds] = useState<string[]>([]);
  const [activeFlowNodes, setActiveFlowNodes] = useState<Node[]>([]);
  const [activeFlowEdges, setActiveFlowEdges] = useState<Edge[]>([]);

  // A previewed built-in example carries board-specific pins. When the board is
  // switched and the example is still untouched, swap in that board's version.
  const boardId = useBoardStore((s) => s.boardId);
  useEffect(() => {
    const ws = canvasRef.current?.getWorkspace();
    if (!ws || ws.nodes.length === 0) return;
    const ids = ws.nodes.map((n) => n.id).sort().join();
    const all = (["esp32", "arduino_uno"] as const).flatMap((b) => builtinTutorials(b));
    const loaded = all.find((t) => t.nodes.map((n) => n.id).sort().join() === ids);
    const next = loaded && builtinTutorials(boardId).find((t) => t.id === loaded.id);
    if (next) canvasRef.current?.setWorkspace({ nodes: next.nodes, edges: next.edges });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on board change
  }, [boardId]);

  // Load tutorial state from localStorage on mount
  useEffect(() => {
    try {
      const savedTutorial = localStorage.getItem("kokoon-active-tutorial");
      if (savedTutorial) {
        setActiveTutorial(JSON.parse(savedTutorial));
        const savedStep = localStorage.getItem("kokoon-current-step-index");
        if (savedStep) setCurrentStepIndex(parseInt(savedStep, 10));
      }
      const completed = localStorage.getItem("kokoon-completed-tutorials");
      if (completed) setCompletedTutorialIds(JSON.parse(completed));
    } catch { }
  }, []);

  // Persist active tutorial
  useEffect(() => {
    if (isLoadingDraft) return;
    if (activeTutorial) {
      localStorage.setItem("kokoon-active-tutorial", JSON.stringify(activeTutorial));
      localStorage.setItem("kokoon-current-step-index", currentStepIndex.toString());
    } else {
      localStorage.removeItem("kokoon-active-tutorial");
      localStorage.removeItem("kokoon-current-step-index");
    }
  }, [activeTutorial, currentStepIndex, isLoadingDraft]);

  const handleSelectTutorial = useCallback((tutorial: Tutorial, mode: "preview" | "interactive") => {
    if (mode === "preview") {
      canvasRef.current?.setWorkspace({ nodes: tutorial.nodes, edges: tutorial.edges });
      setShowTutorialsCatalog(false);
      addLog(`Preview loaded: "${tutorial.title}"!`);
    } else {
      canvasRef.current?.setWorkspace({ nodes: [], edges: [] });
      setActiveTutorial(tutorial);
      setCurrentStepIndex(0);
      setShowTutorialsCatalog(false);
      addLog(`Starting interactive tutorial: "${tutorial.title}"!`);
    }
  }, [canvasRef, addLog]);

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
      localStorage.setItem("kokoon-completed-tutorials", JSON.stringify(updated));
      return updated;
    });
    addLog(`Congratulations! Completed tutorial: "${activeTutorial.title}"!`);
    setActiveTutorial(null);
  }, [activeTutorial, addLog]);

  return {
    showTutorialsCatalog, setShowTutorialsCatalog,
    activeTutorial, setActiveTutorial,
    currentStepIndex,
    completedTutorialIds,
    activeFlowNodes, setActiveFlowNodes,
    activeFlowEdges, setActiveFlowEdges,
    handleSelectTutorial,
    handleStepComplete,
    handleCompleteTutorial,
  };
}
