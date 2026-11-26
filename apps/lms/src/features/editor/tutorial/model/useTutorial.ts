import { useState, useEffect, useCallback, useRef } from "react";
import type { Node, Edge } from "@xyflow/react";
import { builtinTutorials, type Tutorial } from "@/features/editor/tutorial/lib/tutorials";
import { useBoardStore } from "@/entities/board";
import { useModal } from "@/shared/context/ModalContext";
import type { NodeCanvasRef } from "@/widgets/node-canvas/ui/NodeCanvas";
import type { RefObject } from "react";

interface UseTutorialOptions {
  canvasRef: RefObject<NodeCanvasRef | null>;
  addLog: (msg: string) => void;
  isLoadingDraft: boolean;
}

export function useTutorial({ canvasRef, addLog, isLoadingDraft }: UseTutorialOptions) {
  const { confirm } = useModal();
  const [showTutorialsCatalog, setShowTutorialsCatalog] = useState(false);
  const [activeTutorial, setActiveTutorial] = useState<Tutorial | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedTutorialIds, setCompletedTutorialIds] = useState<string[]>([]);
  const [activeFlowNodes, setActiveFlowNodes] = useState<Node[]>([]);
  const [activeFlowEdges, setActiveFlowEdges] = useState<Edge[]>([]);

  // A previewed built-in example carries board-specific pins. When the board is
  // switched and the example is still untouched, swap in that board's version.
  const boardId = useBoardStore((s) => s.boardId);
  const prevBoardRef = useRef(boardId);
  useEffect(() => {
    const prev = prevBoardRef.current;
    prevBoardRef.current = boardId;
    const ws = canvasRef.current?.getWorkspace();
    if (!ws || ws.nodes.length === 0 || prev === boardId) return;
    // Untouched = same nodes with the previous board's values. Matching ids alone
    // would overwrite an edited (or just loaded) project built from an example.
    const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
    const loaded = builtinTutorials(prev).find((t) =>
      t.nodes.length === ws.nodes.length && t.nodes.every((n) => {
        const live = ws.nodes.find((l) => l.id === n.id);
        return !!live && Object.entries(n.data ?? {}).every(([k, v]) => same(live.data?.[k], v));
      })
    );
    const next = loaded && builtinTutorials(boardId).find((t) => t.id === loaded.id);
    if (next) canvasRef.current?.setWorkspace({ nodes: next.nodes, edges: next.edges });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on board change
  }, [boardId]);

  // Open a built-in example chosen on the dashboard, once the saved draft has loaded.
  useEffect(() => {
    if (isLoadingDraft) return;
    const id = sessionStorage.getItem("codelab-open-demo");
    if (!id) return;
    sessionStorage.removeItem("codelab-open-demo");
    const demo = builtinTutorials(useBoardStore.getState().boardId).find((t) => t.id === id);
    if (!demo) return;
    const open = () => canvasRef.current?.setWorkspace({ nodes: demo.nodes, edges: demo.edges });
    // The sandbox keeps the last draft: ask before replacing blocks the student built.
    const current = canvasRef.current?.getWorkspace().nodes ?? [];
    const sameProject = current.length > 0 && current.every((n) => demo.nodes.some((d) => d.id === n.id));
    if (current.length === 0 || sameProject) open();
    else void confirm(`Open "${demo.title}"? This replaces the blocks currently on your canvas.`).then((ok) => { if (ok) open(); });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once when the draft has loaded
  }, [isLoadingDraft, canvasRef]);

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
    } catch { /* corrupted saved tutorial state */ }
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
