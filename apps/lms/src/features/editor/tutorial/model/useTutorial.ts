import { useState, useEffect, useCallback } from "react";
import type { Node, Edge } from "@xyflow/react";
import type { Tutorial } from "@/features/editor/tutorial/lib/tutorials";
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

  // Load tutorial state from localStorage on mount
  useEffect(() => {
    try {
      const savedTutorial = localStorage.getItem("kakoon-active-tutorial");
      if (savedTutorial) {
        setActiveTutorial(JSON.parse(savedTutorial));
        const savedStep = localStorage.getItem("kakoon-current-step-index");
        if (savedStep) setCurrentStepIndex(parseInt(savedStep, 10));
      }
      const completed = localStorage.getItem("kakoon-completed-tutorials");
      if (completed) setCompletedTutorialIds(JSON.parse(completed));
    } catch { }
  }, []);

  // Persist active tutorial
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

  const handleSelectTutorial = useCallback((tutorial: Tutorial, mode: "preview" | "interactive") => {
    if (mode === "preview") {
      canvasRef.current?.setWorkspace({ nodes: tutorial.nodes, edges: tutorial.edges });
      setShowTutorialsCatalog(false);
      addLog(`✨ Preview loaded: "${tutorial.title}"!`);
    } else {
      canvasRef.current?.setWorkspace({ nodes: [], edges: [] });
      setActiveTutorial(tutorial);
      setCurrentStepIndex(0);
      setShowTutorialsCatalog(false);
      addLog(`🚀 Starting interactive tutorial: "${tutorial.title}"!`);
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
      localStorage.setItem("kakoon-completed-tutorials", JSON.stringify(updated));
      return updated;
    });
    addLog(`🎉 Congratulations! Completed tutorial: "${activeTutorial.title}"!`);
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
