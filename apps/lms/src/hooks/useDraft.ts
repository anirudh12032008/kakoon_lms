import { useEffect, type RefObject } from "react";
import type { NodeCanvasRef } from "@/components/editor/NodeCanvas";
import type { ViewMode } from "@/pages/editor/EditorPage";

interface UseDraftOptions {
  canvasRef: RefObject<NodeCanvasRef | null>;
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
  isLoadingDraft, setIsLoadingDraft,
  generatedCode, editableCode, hasManualEdits, viewMode, isEditing,
  setGeneratedCode, setEditableCode, setHasManualEdits, setViewMode, setIsEditing,
}: UseDraftOptions) {
  // Load draft on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("kakoon-draft");
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.editableCode) setEditableCode(draft.editableCode);
        if (draft.hasManualEdits) setHasManualEdits(draft.hasManualEdits);
        if (draft.viewMode) setViewMode(draft.viewMode);
        if (draft.isEditing) setIsEditing(draft.isEditing);
        if (draft.generatedCode) setGeneratedCode(draft.generatedCode);
        if (draft.flowData) {
          const check = setInterval(() => {
            if (canvasRef.current) {
              clearInterval(check);
              try { canvasRef.current.setWorkspace(JSON.parse(draft.flowData)); } catch { }
            }
          }, 100);
          setTimeout(() => clearInterval(check), 5000);
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
    if (isLoadingDraft) return;
    const timeout = setTimeout(() => {
      const workspace = canvasRef.current?.getWorkspace();
      localStorage.setItem("kakoon-draft", JSON.stringify({
        flowData: workspace ? JSON.stringify(workspace) : "",
        generatedCode, editableCode, hasManualEdits, viewMode, isEditing,
        timestamp: Date.now(),
      }));
    }, 1000);
    return () => clearTimeout(timeout);
  }, [generatedCode, editableCode, hasManualEdits, viewMode, isEditing, isLoadingDraft, canvasRef]);
}
