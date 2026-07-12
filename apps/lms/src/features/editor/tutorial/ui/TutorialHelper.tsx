import { useEffect, useState, useRef } from "react";
import { type Tutorial, type TutorialStep } from "@/features/editor/tutorial/lib/tutorials";
import type { Node, Edge } from "@xyflow/react";
import { Check, X, ArrowRight, Play, Award, ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
import { NODE_CATEGORIES } from "@/entities/node/model";
import { useTutorialFocus } from "@/features/editor/tutorial/model/tutorialFocus";

interface TutorialHelperProps {
  tutorial: Tutorial;
  nodes: Node[];
  edges: Edge[];
  currentStepIndex: number;
  onStepComplete: () => void;
  onQuit: () => void;
  onCompleteTutorial: () => void;
}

const getCategoryForNodeType = (nodeType: string): string => {
  for (const cat of NODE_CATEGORIES) {
    if (cat.nodes.some((n) => n.type === nodeType)) return cat.id;
  }
  return "general";
};

const findLiveNodeByTutorialId = (
  targetId: string | undefined,
  targetType: string | undefined,
  tutorialNodes: Node[],
  liveNodes: Node[]
): Node | null => {
  if (!targetId && !targetType) return null;

  if (targetId && tutorialNodes.length > 0) {
    const tutNode = tutorialNodes.find((n) => n.id === targetId);
    if (tutNode) {
      const type = tutNode.type;
      const sameTypeTutNodes = tutorialNodes.filter((n) => n.type === type);
      const occurrenceIndex = sameTypeTutNodes.findIndex((n) => n.id === targetId);
      const sameTypeLiveNodes = liveNodes.filter((n) => n.type === type);
      if (sameTypeLiveNodes[occurrenceIndex]) return sameTypeLiveNodes[occurrenceIndex];
    }
  }

  if (targetType) {
    const matched = liveNodes.find((n) => n.type === targetType);
    if (matched) return matched;
  }

  return null;
};

function PointingHand() {
  return (
    <div className="pointer-events-none select-none animate-hand-point">
      <svg xmlns="http://www.w3.org/2000/svg" width="47" height="47" viewBox="0 0 36 36"
        style={{ filter: "drop-shadow(rgba(0,0,0,0.5) 0px 2px 6px)" }}>
        <g transform="rotate(0 18 18)">
          <path d="M28.09,9.74a4,4,0,0,0-1.16.19c-.19-1.24-1.55-2.18-3.27-2.18A4,4,0,0,0,22.13,8,3.37,3.37,0,0,0,19,6.3a3.45,3.45,0,0,0-2.87,1.32,3.65,3.65,0,0,0-1.89-.51A3.05,3.05,0,0,0,11,9.89v.91c-1.06.4-4.11,1.8-4.91,4.84s.34,8,2.69,11.78a25.21,25.21,0,0,0,5.9,6.41.9.9,0,0,0,.53.17H25.55a.92.92,0,0,0,.55-.19,13.13,13.13,0,0,0,3.75-6.13A25.8,25.8,0,0,0,31.41,18v-5.5A3.08,3.08,0,0,0,28.09,9.74Z" fill="white" />
          <path d="M28.09,9.74a4,4,0,0,0-1.16.19c-.19-1.24-1.55-2.18-3.27-2.18A4,4,0,0,0,22.13,8,3.37,3.37,0,0,0,19,6.3a3.45,3.45,0,0,0-2.87,1.32,3.65,3.65,0,0,0-1.89-.51A3.05,3.05,0,0,0,11,9.89v.91c-1.06.4-4.11,1.8-4.91,4.84s.34,8,2.69,11.78a25.21,25.21,0,0,0,5.9,6.41.9.9,0,0,0,.53.17H25.55a.92.92,0,0,0,.55-.19,13.13,13.13,0,0,0,3.75-6.13A25.8,25.8,0,0,0,31.41,18v-5.5A3.08,3.08,0,0,0,28.09,9.74ZM29.61,18a24,24,0,0,1-1.47,9.15A12.46,12.46,0,0,1,25.2,32.2H15.47a23.75,23.75,0,0,1-5.2-5.72c-2.37-3.86-3-8.23-2.48-10.39A5.7,5.7,0,0,1,11,12.76v7.65a.9.9,0,0,0,1.8,0V9.89c0-.47.59-1,1.46-1s1.49.52,1.49,1v5.72h1.8V8.81c0-.28.58-.71,1.46-.71s1.53.48,1.53.75v6.89h1.8V10l.17-.12a2.1,2.1,0,0,1,1.18-.32c.93,0,1.5.44,1.5.68l0,6.5H27V11.87a1.91,1.91,0,0,1,1.12-.33c.86,0,1.52.51,1.52.94Z" fill="black" />
        </g>
      </svg>
    </div>
  );
}

function GrabHand() {
  return (
    <div className="pointer-events-none select-none animate-[pulse_1.5s_infinite]">
      <svg xmlns="http://www.w3.org/2000/svg" width="47" height="47" viewBox="0 0 36 36"
        style={{ filter: "drop-shadow(rgba(0,0,0,0.5) 0px 2px 6px)" }}>
        <g transform="rotate(0 18 18)">
          <path d="M28.09,9.74a4,4,0,0,0-1.16.19c-.19-1.24-1.55-2.18-3.27-2.18A4,4,0,0,0,22.13,8,3.37,3.37,0,0,0,19,6.3a3.45,3.45,0,0,0-2.87,1.32,3.65,3.65,0,0,0-1.89-.51A3.05,3.05,0,0,0,11,9.89v.91c-1.06.4-4.11,1.8-4.91,4.84s.34,8,2.69,11.78a25.21,25.21,0,0,0,5.9,6.41.9.9,0,0,0,.53.17H25.55a.92.92,0,0,0,.55-.19,13.13,13.13,0,0,0,3.75-6.13A25.8,25.8,0,0,0,31.41,18v-5.5A3.08,3.08,0,0,0,28.09,9.74Z" fill="white" />
          <path d="M28.09,9.74a4,4,0,0,0-1.16.19c-.19-1.24-1.55-2.18-3.27-2.18A4,4,0,0,0,22.13,8,3.37,3.37,0,0,0,19,6.3a3.45,3.45,0,0,0-2.87,1.32,3.65,3.65,0,0,0-1.89-.51A3.05,3.05,0,0,0,11,9.89v.91c-1.06.4-4.11,1.8-4.91,4.84s.34,8,2.69,11.78a25.21,25.21,0,0,0,5.9,6.41.9.9,0,0,0,.53.17H25.55a.92.92,0,0,0,.55-.19,13.13,13.13,0,0,0,3.75-6.13A25.8,25.8,0,0,0,31.41,18v-5.5A3.08,3.08,0,0,0,28.09,9.74ZM29.61,18a24,24,0,0,1-1.47,9.15A12.46,12.46,0,0,1,25.2,32.2H15.47a23.75,23.75,0,0,1-5.2-5.72c-2.37-3.86-3-8.23-2.48-10.39A5.7,5.7,0,0,1,11,12.76v7.65a.9.9,0,0,0,1.8,0V9.89c0-.47.59-1,1.46-1s1.49.52,1.49,1v5.72h1.8V8.81c0-.28.58-.71,1.46-.71s1.53.48,1.53.75v6.89h1.8V10l.17-.12a2.1,2.1,0,0,1,1.18-.32c.93,0,1.5.44,1.5.68l0,6.5H27V11.87a1.91,1.91,0,0,1,1.12-.33c.86,0,1.52.51,1.52.94Z" fill="black" />
        </g>
      </svg>
    </div>
  );
}

export function TutorialHelper({
  tutorial,
  nodes,
  edges,
  currentStepIndex,
  onStepComplete,
  onQuit,
  onCompleteTutorial,
}: TutorialHelperProps) {
  const step: TutorialStep | undefined = tutorial.steps[currentStepIndex];
  const [isCompleted, setIsCompleted] = useState(false);
  const [isChecklistExpanded, setIsChecklistExpanded] = useState(true);
  const [isInitializing, setIsInitializing] = useState(true);

  const catOutlineRef = useRef<HTMLDivElement>(null);
  const palOutlineRef = useRef<HTMLDivElement>(null);
  const srcNodeOutlineRef = useRef<HTMLDivElement>(null);
  const tgtNodeOutlineRef = useRef<HTMLDivElement>(null);
  const srcHandleRingRef = useRef<HTMLDivElement>(null);
  const tgtHandleRingRef = useRef<HTMLDivElement>(null);
  const svgConnectingRef = useRef<SVGSVGElement>(null);
  const connectingPathRef = useRef<SVGPathElement>(null);
  const pointingHandRef = useRef<HTMLDivElement>(null);
  const grabHandRef = useRef<HTMLDivElement>(null);
  const midpointGrabHandRef = useRef<HTMLDivElement>(null);
  const fieldHighlightRef = useRef<HTMLDivElement>(null);

  // "Initializing" guards against a stale/leftover node graph instantly
  // (mis)completing step 1 right as a fresh tutorial's canvas-clear lands.
  // On a *fresh* start (handleSelectTutorial clears the canvas first),
  // nodes.length hitting 0 confirms the clear landed. On a *resumed* tutorial
  // (e.g. page refresh mid-tutorial), the canvas is restored with nodes
  // already present and length never touches 0 — so a timeout fallback is
  // required, or the completion-check effect below would stay gated forever
  // and no step could ever advance again.
  useEffect(() => {
    setIsInitializing(true);
    const timeout = setTimeout(() => setIsInitializing(false), 600);
    return () => clearTimeout(timeout);
  }, [tutorial.id]);
  useEffect(() => { if (nodes.length === 0) setIsInitializing(false); }, [nodes]);

  // Tell the palette which section to auto-open. Only "add_node" steps need a
  // palette block; connect/edit-field steps act on nodes already on the canvas.
  const setFocus = useTutorialFocus((s) => s.setFocus);
  useEffect(() => {
    if (!isCompleted && step?.actionType === "add_node" && step.nodeType) {
      setFocus(getCategoryForNodeType(step.nodeType), step.nodeType);
    } else {
      setFocus(null, null);
    }
  }, [step, isCompleted, setFocus]);
  // Clear focus when the helper unmounts (tutorial quit/completed).
  useEffect(() => () => setFocus(null, null), [setFocus]);

  const getElementForField = (nodeId: string, fieldName: string): HTMLElement | null => {
    const container = document.querySelector(`[data-id="${nodeId}"]`);
    if (!container) return null;
    if (fieldName === "port") return container.querySelector("select");
    if (["pin", "pin1", "pin2", "pin3", "pin4", "trigPin", "echoPin"].includes(fieldName))
      return container.querySelector('input[type="number"]');
    if (fieldName === "varName" || fieldName === "name")
      return container.querySelector('input[type="text"]') || container.querySelector("input:not([type='number'])");
    if (fieldName === "left") return container.querySelectorAll("input")[0] || null;
    if (fieldName === "right") return container.querySelectorAll("input")[1] || null;
    return container.querySelector("input") || container.querySelector("select");
  };

  useEffect(() => {
    if (isInitializing) return;
    if (!step) { setIsCompleted(true); return; }

    if (step.actionType === "add_node") {
      const required = step.minCount ?? 1;
      const present = nodes.filter((n) => n.type === step.nodeType).length;
      if (present >= required) onStepComplete();
    } else if (step.actionType === "edit_field" && step.fieldName) {
      const liveNode = findLiveNodeByTutorialId(step.nodeId, step.nodeType, tutorial.nodes || [], nodes);
      if (liveNode) {
        const currentValue = liveNode.data?.[step.fieldName];
        if (currentValue !== undefined && String(currentValue) === String(step.fieldValue)) onStepComplete();
      }
    } else if (step.actionType === "connect") {
      // Resolve the exact occurrence this step means (e.g. "Push Button #2"),
      // not just "any node of this type" — otherwise wiring the wrong pair of
      // same-type nodes can falsely complete this step (or never complete it).
      const srcNode = findLiveNodeByTutorialId(step.sourceId, step.sourceType, tutorial.nodes || [], nodes);
      const tgtNode = findLiveNodeByTutorialId(step.targetId, step.targetType, tutorial.nodes || [], nodes);
      const connectionExists = !!srcNode && !!tgtNode && edges.some((edge) =>
        edge.source === srcNode.id &&
        edge.target === tgtNode.id &&
        (!step.sourceHandle || edge.sourceHandle === step.sourceHandle) &&
        (!step.targetHandle || edge.targetHandle === step.targetHandle)
      );
      if (connectionExists) onStepComplete();
    }
  }, [nodes, edges, step, onStepComplete, isInitializing, tutorial.nodes]);

  useEffect(() => {
    let animationFrameId: number;

    const update = () => {
      if (isCompleted || !step) {
        [catOutlineRef, palOutlineRef, srcNodeOutlineRef, tgtNodeOutlineRef,
          srcHandleRingRef, tgtHandleRingRef, svgConnectingRef, pointingHandRef,
          grabHandRef, midpointGrabHandRef, fieldHighlightRef].forEach((r) => {
          if (r.current) r.current.style.display = "none";
        });
        return;
      }

      if (step.actionType === "add_node" && step.nodeType) {
        [srcNodeOutlineRef, tgtNodeOutlineRef, srcHandleRingRef, tgtHandleRingRef,
          svgConnectingRef, midpointGrabHandRef, fieldHighlightRef].forEach((r) => {
          if (r.current) r.current.style.display = "none";
        });

        const categoryId = getCategoryForNodeType(step.nodeType);
        const catBtn = document.querySelector(`[data-category-id="${categoryId}"]`);
        const palItem = document.querySelector(`[data-node-type="${step.nodeType}"]`);

        if (palItem) {
          if (catOutlineRef.current) catOutlineRef.current.style.display = "none";
          const rect = palItem.getBoundingClientRect();
          if (palOutlineRef.current) {
            palOutlineRef.current.style.display = "block";
            palOutlineRef.current.style.left = `${rect.left - 2}px`;
            palOutlineRef.current.style.top = `${rect.top - 2}px`;
            palOutlineRef.current.style.width = `${rect.width + 4}px`;
            palOutlineRef.current.style.height = `${rect.height + 4}px`;
          }
          const cycleDuration = 2200;
          const t = (Date.now() % cycleDuration) / cycleDuration;
          const easedT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          const startX = rect.left + rect.width / 2, startY = rect.top + rect.height / 2;
          const endX = window.innerWidth * 0.6, endY = window.innerHeight * 0.5;
          const currentX = startX + (endX - startX) * easedT;
          const currentY = startY + (endY - startY) * easedT;
          const isGrabbing = t > 0.08 && t < 0.92;
          if (isGrabbing) {
            if (pointingHandRef.current) pointingHandRef.current.style.display = "none";
            if (grabHandRef.current) {
              grabHandRef.current.style.display = "block";
              grabHandRef.current.style.left = `${currentX}px`;
              grabHandRef.current.style.top = `${currentY}px`;
            }
          } else {
            if (grabHandRef.current) grabHandRef.current.style.display = "none";
            if (pointingHandRef.current) {
              pointingHandRef.current.style.display = "block";
              pointingHandRef.current.style.left = `${currentX}px`;
              pointingHandRef.current.style.top = `${currentY}px`;
              const g = pointingHandRef.current.querySelector("g");
              if (g) g.setAttribute("transform", "rotate(0 18 18)");
            }
          }
        } else {
          if (palOutlineRef.current) palOutlineRef.current.style.display = "none";
          if (grabHandRef.current) grabHandRef.current.style.display = "none";
          if (catBtn) {
            const rect = catBtn.getBoundingClientRect();
            if (catOutlineRef.current) {
              catOutlineRef.current.style.display = "block";
              catOutlineRef.current.style.left = `${rect.left - 2}px`;
              catOutlineRef.current.style.top = `${rect.top - 2}px`;
              catOutlineRef.current.style.width = `${rect.width + 4}px`;
              catOutlineRef.current.style.height = `${rect.height + 4}px`;
            }
            if (pointingHandRef.current) {
              pointingHandRef.current.style.display = "block";
              pointingHandRef.current.style.left = `${rect.left + rect.width + 35}px`;
              pointingHandRef.current.style.top = `${rect.top + rect.height / 2}px`;
              const g = pointingHandRef.current.querySelector("g");
              if (g) g.setAttribute("transform", "rotate(-45 18 18)");
            }
          } else {
            if (catOutlineRef.current) catOutlineRef.current.style.display = "none";
            if (pointingHandRef.current) pointingHandRef.current.style.display = "none";
          }
        }
      } else if (step.actionType === "connect") {
        [catOutlineRef, palOutlineRef, pointingHandRef, grabHandRef, fieldHighlightRef].forEach((r) => {
          if (r.current) r.current.style.display = "none";
        });

        const srcNode = findLiveNodeByTutorialId(step.sourceId, step.sourceType, tutorial.nodes || [], nodes);
        const tgtNode = findLiveNodeByTutorialId(step.targetId, step.targetType, tutorial.nodes || [], nodes);

        if (srcNode) {
          const c = document.querySelector(`[data-id="${srcNode.id}"]`);
          if (c && srcNodeOutlineRef.current) {
            const rect = c.getBoundingClientRect();
            srcNodeOutlineRef.current.style.display = "block";
            srcNodeOutlineRef.current.style.left = `${rect.left - 4}px`;
            srcNodeOutlineRef.current.style.top = `${rect.top - 4}px`;
            srcNodeOutlineRef.current.style.width = `${rect.width + 8}px`;
            srcNodeOutlineRef.current.style.height = `${rect.height + 8}px`;
          } else if (srcNodeOutlineRef.current) srcNodeOutlineRef.current.style.display = "none";
        } else if (srcNodeOutlineRef.current) srcNodeOutlineRef.current.style.display = "none";

        if (tgtNode) {
          const c = document.querySelector(`[data-id="${tgtNode.id}"]`);
          if (c && tgtNodeOutlineRef.current) {
            const rect = c.getBoundingClientRect();
            tgtNodeOutlineRef.current.style.display = "block";
            tgtNodeOutlineRef.current.style.left = `${rect.left - 4}px`;
            tgtNodeOutlineRef.current.style.top = `${rect.top - 4}px`;
            tgtNodeOutlineRef.current.style.width = `${rect.width + 8}px`;
            tgtNodeOutlineRef.current.style.height = `${rect.height + 8}px`;
          } else if (tgtNodeOutlineRef.current) tgtNodeOutlineRef.current.style.display = "none";
        } else if (tgtNodeOutlineRef.current) tgtNodeOutlineRef.current.style.display = "none";

        if (srcNode && tgtNode) {
          const srcSel = step.sourceHandle
            ? `.react-flow__handle.source[data-nodeid="${srcNode.id}"][data-handleid="${step.sourceHandle}"]`
            : `.react-flow__handle.source[data-nodeid="${srcNode.id}"]:not([data-handleid])`;
          const tgtSel = step.targetHandle
            ? `.react-flow__handle.target[data-nodeid="${tgtNode.id}"][data-handleid="${step.targetHandle}"]`
            : `.react-flow__handle.target[data-nodeid="${tgtNode.id}"]:not([data-handleid])`;

          const srcHandle = document.querySelector(srcSel);
          const tgtHandle = document.querySelector(tgtSel);
          let sHPos: { x: number; y: number } | null = null;
          let tHPos: { x: number; y: number } | null = null;

          if (srcHandle) {
            const rect = srcHandle.getBoundingClientRect();
            sHPos = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
            if (srcHandleRingRef.current) {
              srcHandleRingRef.current.style.display = "block";
              srcHandleRingRef.current.style.left = `${sHPos.x}px`;
              srcHandleRingRef.current.style.top = `${sHPos.y}px`;
            }
          } else if (srcHandleRingRef.current) srcHandleRingRef.current.style.display = "none";

          if (tgtHandle) {
            const rect = tgtHandle.getBoundingClientRect();
            tHPos = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
            if (tgtHandleRingRef.current) {
              tgtHandleRingRef.current.style.display = "block";
              tgtHandleRingRef.current.style.left = `${tHPos.x}px`;
              tgtHandleRingRef.current.style.top = `${tHPos.y}px`;
            }
          } else if (tgtHandleRingRef.current) tgtHandleRingRef.current.style.display = "none";

          if (sHPos && tHPos) {
            if (svgConnectingRef.current) svgConnectingRef.current.style.display = "block";
            if (connectingPathRef.current) {
              connectingPathRef.current.setAttribute("d",
                `M ${sHPos.x} ${sHPos.y} C ${sHPos.x + 90} ${sHPos.y}, ${tHPos.x - 90} ${tHPos.y}, ${tHPos.x} ${tHPos.y}`);
            }
            const t = (Date.now() % 2400) / 2400;
            const mt = 1 - t, mt2 = mt * mt, mt3 = mt2 * mt, t2 = t * t, t3 = t2 * t;
            const slideX = mt3 * sHPos.x + 3 * mt2 * t * (sHPos.x + 90) + 3 * mt * t2 * (tHPos.x - 90) + t3 * tHPos.x;
            const slideY = mt3 * sHPos.y + 3 * mt2 * t * sHPos.y + 3 * mt * t2 * tHPos.y + t3 * tHPos.y;
            if (midpointGrabHandRef.current) {
              midpointGrabHandRef.current.style.display = "block";
              midpointGrabHandRef.current.style.left = `${slideX}px`;
              midpointGrabHandRef.current.style.top = `${slideY}px`;
            }
          } else {
            if (svgConnectingRef.current) svgConnectingRef.current.style.display = "none";
            if (midpointGrabHandRef.current) midpointGrabHandRef.current.style.display = "none";
          }
        } else {
          [srcHandleRingRef, tgtHandleRingRef, svgConnectingRef, midpointGrabHandRef].forEach((r) => {
            if (r.current) r.current.style.display = "none";
          });
        }
      } else if (step.actionType === "edit_field" && step.fieldName) {
        [catOutlineRef, palOutlineRef, srcNodeOutlineRef, tgtNodeOutlineRef,
          srcHandleRingRef, tgtHandleRingRef, svgConnectingRef, pointingHandRef,
          grabHandRef, midpointGrabHandRef].forEach((r) => {
          if (r.current) r.current.style.display = "none";
        });

        const liveNode = findLiveNodeByTutorialId(step.nodeId, step.nodeType, tutorial.nodes || [], nodes);
        if (liveNode) {
          const fieldEl = getElementForField(liveNode.id, step.fieldName!);
          if (fieldEl && fieldHighlightRef.current) {
            const rect = fieldEl.getBoundingClientRect();
            fieldHighlightRef.current.style.display = "flex";
            fieldHighlightRef.current.style.left = `${rect.right + 12}px`;
            fieldHighlightRef.current.style.top = `${rect.top + rect.height / 2 - 14}px`;
            const span = fieldHighlightRef.current.querySelector("span");
            if (span) span.textContent = `${step.fieldName === "port" ? "Select" : "Type"} ${step.fieldValue}`;
          } else if (fieldHighlightRef.current) fieldHighlightRef.current.style.display = "none";
        } else if (fieldHighlightRef.current) fieldHighlightRef.current.style.display = "none";
      } else if (fieldHighlightRef.current) fieldHighlightRef.current.style.display = "none";

      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [step, nodes, isCompleted, tutorial.nodes]);

  const progressPercent = Math.min(100, Math.round((currentStepIndex / tutorial.steps.length) * 100));

  if (isCompleted || !step) {
    return (
      <div className="fixed bottom-6 right-6 w-full max-w-[360px] z-[9999] p-4 rounded-xl border border-emerald-500/35 bg-[var(--k-base-200)]/95 backdrop-blur-md shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex-shrink-0">
            <Award className="w-4 h-4 animate-bounce" />
          </div>
          <div className="flex-1 text-left min-w-0">
            <h4 className="text-xs font-bold text-white">Tutorial Completed! 🎉</h4>
            <p className="text-[11px] text-[var(--k-muted)] mt-1 leading-relaxed font-medium">
              Awesome work! You've successfully completed "{tutorial.title}". Feel free to keep playing with it!
            </p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={onCompleteTutorial}
                className="flex-1 py-1.5 px-3 rounded-md text-[10px] font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white transition-all"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes handPoint { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-8px) scale(0.95); } }
        .animate-hand-point { animation: handPoint 1s ease-in-out infinite; }
        @keyframes handlePulseRing { 0% { transform: scale(0.8); opacity: 0.9; } 100% { transform: scale(2.2); opacity: 0; } }
        .animate-handle-pulse-ring { animation: handlePulseRing 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; }
        .dimming-backdrop { pointer-events: none; background: radial-gradient(circle, transparent 20%, rgba(9,9,11,0.45) 80%); }
        @keyframes dash { to { stroke-dashoffset: -28; } }
      `}</style>

      <div className="fixed inset-0 z-30 dimming-backdrop pointer-events-none" />

      <div ref={catOutlineRef} style={{ display: "none", boxSizing: "border-box" }}
        className="fixed z-40 pointer-events-none border-2 border-emerald-400/90 bg-emerald-400/10 shadow-[0_0_16px_rgba(16,185,129,0.55)] rounded-lg animate-[pulse_1.5s_infinite]" />

      <div ref={palOutlineRef} style={{ display: "none", boxSizing: "border-box" }}
        className="fixed z-40 pointer-events-none border-2 border-emerald-400/90 bg-emerald-400/10 shadow-[0_0_16px_rgba(16,185,129,0.55)] rounded-lg animate-[pulse_1.5s_infinite]" />

      <div ref={srcNodeOutlineRef} style={{ display: "none", boxSizing: "border-box" }}
        className="fixed z-35 pointer-events-none border border-emerald-500/60 bg-emerald-500/5 shadow-[0_0_10px_rgba(16,185,129,0.2)] rounded-xl" />

      <div ref={tgtNodeOutlineRef} style={{ display: "none", boxSizing: "border-box" }}
        className="fixed z-35 pointer-events-none border border-emerald-500/60 bg-emerald-500/5 shadow-[0_0_10px_rgba(16,185,129,0.2)] rounded-xl" />

      {/* Source Handle Ring */}
      <div ref={srcHandleRingRef} style={{ display: "none", position: "fixed", zIndex: 50, pointerEvents: "none", transform: "translate(-50%, -50%)", width: "32px", height: "32px", boxSizing: "border-box" }}>
        <div className="animate-handle-pulse-ring" style={{ position: "absolute", top: 0, left: 0, width: "32px", height: "32px", borderRadius: "50%", border: "4px solid #10b981", boxSizing: "border-box" }} />
        <div style={{ position: "absolute", top: "6px", left: "6px", width: "20px", height: "20px", borderRadius: "50%", border: "2px solid #10b981", backgroundColor: "rgba(16,185,129,0.2)", boxSizing: "border-box" }} />
      </div>

      {/* Target Handle Ring */}
      <div ref={tgtHandleRingRef} style={{ display: "none", position: "fixed", zIndex: 50, pointerEvents: "none", transform: "translate(-50%, -50%)", width: "32px", height: "32px", boxSizing: "border-box" }}>
        <div className="animate-handle-pulse-ring" style={{ position: "absolute", top: 0, left: 0, width: "32px", height: "32px", borderRadius: "50%", border: "4px solid #10b981", boxSizing: "border-box" }} />
        <div style={{ position: "absolute", top: "6px", left: "6px", width: "20px", height: "20px", borderRadius: "50%", border: "2px solid #10b981", backgroundColor: "rgba(16,185,129,0.2)", boxSizing: "border-box" }} />
      </div>

      <svg ref={svgConnectingRef} style={{ display: "none" }} className="fixed inset-0 z-40 w-full h-full pointer-events-none">
        <path ref={connectingPathRef} fill="none" stroke="#10b981" strokeWidth="4.5" strokeDasharray="8 6"
          style={{ strokeLinecap: "round", filter: "drop-shadow(0 0 8px rgba(16,185,129,0.7))", animation: "dash 1.5s linear infinite" }} />
      </svg>

      <div ref={midpointGrabHandRef} style={{ display: "none", position: "fixed", zIndex: 999, pointerEvents: "none", transform: "translate(-50%, -50%)" }}>
        <GrabHand />
      </div>

      <div ref={pointingHandRef} style={{ display: "none", position: "fixed", zIndex: 999, pointerEvents: "none", transform: "translate(-50%, -50%)" }}>
        <PointingHand />
      </div>

      <div ref={grabHandRef} style={{ display: "none", position: "fixed", zIndex: 999, pointerEvents: "none", transform: "translate(-50%, -50%)" }}>
        <GrabHand />
      </div>

      <div ref={fieldHighlightRef} className="fixed z-[9999] pointer-events-none select-none bg-[#f97316] text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-2xl flex items-center gap-1.5" style={{ display: "none" }}>
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-[#f97316]" />
        <span className="text-white"></span>
      </div>

      {/* Instruction Dialog */}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 w-full max-w-[580px] z-50 p-5 rounded-2xl border border-[var(--k-border)]/80 bg-[var(--k-base-200)]/95 backdrop-blur-md shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center justify-center px-3.5 py-2.5 rounded-xl bg-[var(--k-base-300)]/40 border border-[var(--k-border)]/60 text-[var(--k-text)] text-center flex-shrink-0 select-none">
            <span className="text-[10px] font-black tracking-widest uppercase">STEP</span>
            <span className="text-lg font-black leading-none mt-1">{currentStepIndex + 1}/{tutorial.steps.length}</span>
          </div>

          <div className="flex-1 text-left min-w-0">
            <h4 className="text-sm font-black text-white leading-tight flex items-center gap-2">
              <Play className="w-4 h-4 fill-emerald-400/20 text-emerald-400" />
              {step.title}
            </h4>
            <p className="text-xs text-[var(--k-text)] mt-1.5 leading-relaxed font-medium">{step.description}</p>
            <div className="flex items-center gap-3 mt-4">
              <div className="flex-1 bg-[var(--k-base-300)]/60 h-2 rounded-full overflow-hidden border border-[var(--k-border)]/35">
                <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
              </div>
              <span className="text-[11px] font-bold text-[var(--k-muted)] flex-shrink-0">{progressPercent}% Done</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 flex-shrink-0">
            <button onClick={onQuit} className="p-2 rounded-xl text-[var(--k-muted)] hover:text-[var(--k-text)] hover:bg-[var(--k-base-300)]/40 border border-[var(--k-border)] hover:border-[var(--k-border)] transition-all" title="Quit Tutorial">
              <X className="w-4 h-4" />
            </button>
            <button onClick={onStepComplete} className="flex items-center justify-center p-2 rounded-xl bg-[var(--k-base-300)] border border-[var(--k-border)]/60 text-[var(--k-text)] hover:text-[var(--k-text)] hover:bg-[var(--k-base-400)]/50 transition-all text-[11px] font-bold gap-1">
              Skip <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Checklist Sidebar */}
      <div className={`fixed top-48 right-6 z-40 w-72 rounded-2xl border border-[var(--k-border)]/80 bg-[var(--k-base-200)]/95 backdrop-blur-md shadow-2xl transition-all duration-300 overflow-hidden ${isChecklistExpanded ? "max-h-[500px]" : "max-h-[52px]"}`}>
        <button onClick={() => setIsChecklistExpanded(!isChecklistExpanded)}
          className="w-full flex items-center justify-between px-4 py-3.5 border-b border-[var(--k-border)]/40 hover:bg-[var(--k-base-300)]/10 transition-colors">
          <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
            Step-by-Step Guide
          </span>
          {isChecklistExpanded ? <ChevronUp className="w-4 h-4 text-[var(--k-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--k-muted)]" />}
        </button>

        <div className="p-3.5 space-y-2 max-h-[380px] overflow-y-auto">
          {tutorial.steps.map((s, idx) => {
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <div key={s.id} className={`flex items-start gap-2.5 p-2 rounded-xl border transition-all ${
                isCurrent ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-400"
                  : isDone ? "bg-[var(--k-base-300)]/20 border-[var(--k-border)] text-[var(--k-muted)]"
                  : "bg-transparent border-transparent text-[var(--k-dim)]"
              }`}>
                <div className={`flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full border text-[10px] font-black ${
                  isDone ? "border-emerald-500/45 bg-emerald-500/10 text-emerald-400"
                    : isCurrent ? "border-emerald-400 bg-emerald-500/20 text-emerald-300"
                    : "border-[var(--k-border)] text-[var(--k-dim)]"
                }`}>
                  {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <div className="text-[11px] leading-tight font-medium text-left">
                  <p className={isDone ? "line-through text-[var(--k-muted)]" : "text-[var(--k-text)]"}>{s.title}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
