import { useEffect, type RefObject } from "react";
import type { NodeCanvasRef } from "@/widgets/node-canvas/ui/NodeCanvas";
import type { ViewMode } from "@/pages/editor/ui/EditorPage";

interface UseDraftOptions {
  canvasRef: RefObject<NodeCanvasRef | null>;
  /** When false, local-draft persistence is skipped (course sessions sync to the LMS instead). */
  enabled?: boolean;
  isLoadingDraft: boolean;
  setIsLoadingDraft: (v: boolean) => void;
  generatedCode: string;
  editableCode: string;
  hasManualEdits: boolean;
  viewMode: ViewMode;
  isEditing: boolean;
  setGeneratedCode: (v: string) => void;
  setEditableCode: (v: string) => void;
  setHasManualEdits: (v: boolean) => void;
  setViewMode: (v: ViewMode) => void;
  setIsEditing: (v: boolean) => void;
}

export function useDraft({
  canvasRef,
  enabled = true,
  isLoadingDraft, setIsLoadingDraft,
  generatedCode, editableCode, hasManualEdits, viewMode, isEditing,
  setGeneratedCode, setEditableCode, setHasManualEdits, setViewMode, setIsEditing,
}: UseDraftOptions) {
  // Load draft on mount
  useEffect(() => {
    if (!enabled) return;
    try {
      const saved = localStorage.getItem("kokoon-draft");
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.editableCode) setEditableCode(draft.editableCode);
        if (draft.hasManualEdits) setHasManualEdits(draft.hasManualEdits);
        if (draft.viewMode) setViewMode(draft.viewMode);
        if (draft.isEditing) setIsEditing(draft.isEditing);
        if (draft.generatedCode) setGeneratedCode(draft.generatedCode);
        if (draft.flowData) {
          try {
            const workspace = JSON.parse(draft.flowData);
            // Canvas ref is populated during the same commit; one rAF is
            // enough for ReactFlow's internal setup to finish.
            requestAnimationFrame(() => {
              canvasRef.current?.setWorkspace(workspace);
            });
          } catch { /* corrupted flow data */ }
        }
      }
    } catch {
      // corrupted draft — ignore
    } finally {
      setIsLoadingDraft(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save draft on change (debounced)
  useEffect(() => {
    if (!enabled || isLoadingDraft) return;
    const timeout = setTimeout(() => {
      const workspace = canvasRef.current?.getWorkspace();
      localStorage.setItem("kokoon-draft", JSON.stringify({
        flowData: workspace ? JSON.stringify(workspace) : "",
        generatedCode, editableCode, hasManualEdits, viewMode, isEditing,
        timestamp: Date.now(),
      }));
    }, 1000);
    return () => clearTimeout(timeout);
  }, [enabled, generatedCode, editableCode, hasManualEdits, viewMode, isEditing, isLoadingDraft, canvasRef]);
}
