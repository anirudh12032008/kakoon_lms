import { useEffect, useRef, useState, type RefObject } from "react";
import type { NodeCanvasRef } from "@/widgets/node-canvas/ui/NodeCanvas";
import {
  getCourseWorkspace,
  saveCourseWorkspace,
  type SavedWorkspace,
} from "@/shared/api/courses";
import { useBoardStore } from "@/entities/board";

export type SyncState = "idle" | "loading" | "saving" | "saved" | "error";

interface Options {
  canvasRef: RefObject<NodeCanvasRef | null>;
  /** Course slug - when present the editor syncs to the learner's LMS account. */
  courseSlug?: string;
  isLoadingDraft: boolean;
  setIsLoadingDraft: (v: boolean) => void;
  generatedCode: string;
  editableCode: string;
}

/**
 * Syncs the editor workspace to the LMS backend for a course session:
 *  - loads the saved workspace on mount
 *  - autosaves (debounced) on every change
 * No-op when there is no course context (sandbox sessions use local drafts).
 */
export function useCourseSync({
  canvasRef,
  courseSlug,
  isLoadingDraft,
  setIsLoadingDraft,
  generatedCode,
  editableCode,
}: Options): { syncState: SyncState; lastSavedAt: number | null } {
  const boardId = useBoardStore((s) => s.boardId); // a board switch is a change worth saving
  const [syncState, setSyncState] = useState<SyncState>(courseSlug ? "loading" : "idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const loadedRef = useRef(false);
  // Data-loss guard: an *empty* canvas may only be saved if this session saw
  // content first (i.e. the student cleared it on purpose). Otherwise a slow
  // or failed restore would autosave {} over their real work on the server.
  const sawContentRef = useRef(false);

  // ── Load saved workspace on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!courseSlug) return;
    let cancelled = false;
    setSyncState("loading");

    getCourseWorkspace(courseSlug)
      .then((ws) => {
        if (cancelled) return;
        // Only a successful load unlocks autosave, so a failed restore can never
        // be followed by a save that replaces the server copy.
        loadedRef.current = true;
        setSyncState("saved");
        if (!ws) return;
        if ((ws.nodes?.length ?? 0) > 0 || (ws.edges?.length ?? 0) > 0) {
          // Inject as soon as the canvas ref is live. setTimeout (not rAF):
          // rAF never fires in hidden/background tabs, which left the canvas
          // empty and let the autosave overwrite the server copy.
          const apply = (attempt: number) => {
            if (cancelled) return;
            if (canvasRef.current) canvasRef.current.setWorkspace(ws as never);
            else if (attempt < 40) setTimeout(() => apply(attempt + 1), 50);
          };
          apply(0);
        }
      })
      .catch(() => { if (!cancelled) setSyncState("error"); })
      .finally(() => { if (!cancelled) setIsLoadingDraft(false); });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseSlug]);

  // ── Autosave (debounced) on change ─────────────────────────────────────────
  useEffect(() => {
    if (!courseSlug || isLoadingDraft || !loadedRef.current) return;

    const timeout = setTimeout(async () => {
      const workspace = canvasRef.current?.getWorkspace() as SavedWorkspace | undefined;
      if (!workspace) return;
      const isEmpty = (workspace.nodes?.length ?? 0) === 0 && (workspace.edges?.length ?? 0) === 0;
      if (isEmpty && !sawContentRef.current) return; // never wipe the server copy on a blank session
      if (!isEmpty) sawContentRef.current = true;
      try {
        setSyncState("saving");
        await saveCourseWorkspace(courseSlug, workspace, editableCode || generatedCode);
        setSyncState("saved");
        setLastSavedAt(Date.now());
      } catch {
        setSyncState("error");
      }
    }, 1200);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseSlug, isLoadingDraft, generatedCode, editableCode, boardId]);

  return { syncState, lastSavedAt };
}
