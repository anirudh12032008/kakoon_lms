import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type { NodeCanvasRef } from "@/widgets/node-canvas/ui/NodeCanvas";
import type { ViewMode } from "@/pages/editor/ui/EditorPage";
import type { EditorLaunchContext } from "@/entities/editor-launch/model/config";
import type { SyncState } from "@/features/editor/save-draft/model/useCourseSync";
import { useProjectStore } from "@/shared/launch/projectStore";
import {
  createProject, getProject, updateProject,
  type ProjectMeta, type ProjectWorkspace,
} from "@/shared/api/projects";

interface Options {
  canvasRef: RefObject<NodeCanvasRef | null>;
  /** Project sync is only active for non-course sessions. */
  enabled: boolean;
  isLoadingDraft: boolean;
  setIsLoadingDraft: (v: boolean) => void;
  launchContext?: EditorLaunchContext;
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

export interface ProjectController {
  syncState: SyncState;
  projectId: string | null;
  projectName: string | null;
  projectSlug: string | null;
  /** Create a brand-new saved project from the current editor state. */
  saveAsNew: (name: string) => Promise<void>;
  /** Rename the active project. */
  rename: (name: string) => Promise<void>;
}

/**
 * Binds the editor to a user's saved project:
 *  - loads the active project on open (workspace + code + view state)
 *  - autosaves (debounced) on every change
 *  - exposes save-as-new and rename actions
 *
 * No-op for course sessions (those sync via useCourseSync) and when no project
 * is active (those keep a local draft via useDraft).
 */
export function useProject({
  canvasRef, enabled, isLoadingDraft, setIsLoadingDraft, launchContext,
  generatedCode, editableCode, hasManualEdits, viewMode, isEditing,
  setGeneratedCode, setEditableCode, setHasManualEdits, setViewMode, setIsEditing,
}: Options): ProjectController {
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const activeProjectName = useProjectStore((s) => s.activeProjectName);
  const activeProjectSlug = useProjectStore((s) => s.activeProjectSlug);
  const setActiveProject = useProjectStore((s) => s.setActiveProject);

  const [syncState, setSyncState] = useState<SyncState>("idle");
  // The project id we have already loaded (or just created) this session — keeps
  // the load effect from re-fetching and clobbering work right after a save.
  const loadedIdRef = useRef<string | null>(null);

  // ── Load the active project on open ────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !activeProjectId || activeProjectId === loadedIdRef.current) return;
    let cancelled = false;
    setSyncState("loading");

    getProject(activeProjectId)
      .then((project) => {
        if (cancelled) return;
        const meta = project.meta ?? {};
        if (meta.generatedCode !== undefined) setGeneratedCode(meta.generatedCode);
        if (meta.editableCode !== undefined) setEditableCode(meta.editableCode);
        if (meta.hasManualEdits !== undefined) setHasManualEdits(meta.hasManualEdits);
        if (meta.viewMode) setViewMode(meta.viewMode);
        if (meta.isEditing !== undefined) setIsEditing(meta.isEditing);

        const ws = project.workspace;
        if (ws && ((ws.nodes?.length ?? 0) > 0 || (ws.edges?.length ?? 0) > 0)) {
          // setTimeout, not rAF — rAF never fires in background tabs.
          const apply = (attempt: number) => {
            if (cancelled) return;
            if (canvasRef.current) canvasRef.current.setWorkspace(ws as never);
            else if (attempt < 40) setTimeout(() => apply(attempt + 1), 50);
          };
          apply(0);
        }
        setActiveProject(project.id, project.name, project.slug ?? null);
      })
      .catch(() => { /* missing / offline — start from an empty canvas */ })
      .finally(() => {
        if (cancelled) return;
        loadedIdRef.current = activeProjectId;
        setIsLoadingDraft(false);
        setSyncState("saved");
      });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, activeProjectId]);

  const buildMeta = useCallback((): ProjectMeta => ({
    generatedCode, editableCode, hasManualEdits, viewMode, isEditing,
    launchContext: launchContext ?? null,
  }), [generatedCode, editableCode, hasManualEdits, viewMode, isEditing, launchContext]);

  // ── Autosave (debounced) on change ─────────────────────────────────────────
  useEffect(() => {
    if (!enabled || isLoadingDraft || !activeProjectId || activeProjectId !== loadedIdRef.current) return;

    const timeout = setTimeout(async () => {
      const workspace = canvasRef.current?.getWorkspace() as ProjectWorkspace | undefined;
      if (!workspace) return;
      try {
        setSyncState("saving");
        await updateProject(activeProjectId, {
          workspace,
          code: editableCode || generatedCode,
          meta: buildMeta(),
        });
        setSyncState("saved");
      } catch {
        setSyncState("error");
      }
    }, 1200);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isLoadingDraft, activeProjectId, generatedCode, editableCode, hasManualEdits, viewMode, isEditing]);

  const saveAsNew = useCallback(async (name: string) => {
    const workspace = (canvasRef.current?.getWorkspace() as ProjectWorkspace | undefined) ?? { nodes: [], edges: [] };
    setSyncState("saving");
    try {
      const project = await createProject({
        name: name.trim() || "Untitled project",
        workspace,
        code: editableCode || generatedCode,
        meta: buildMeta(),
      });
      loadedIdRef.current = project.id; // prevent the load effect from re-fetching
      setActiveProject(project.id, project.name, project.slug ?? null);
      setSyncState("saved");
    } catch {
      setSyncState("error");
    }
  }, [canvasRef, editableCode, generatedCode, buildMeta, setActiveProject]);

  const rename = useCallback(async (name: string) => {
    const trimmed = name.trim();
    if (!activeProjectId || !trimmed) return;
    setActiveProject(activeProjectId, trimmed, activeProjectSlug); // optimistic, keep slug
    try {
      await updateProject(activeProjectId, { name: trimmed });
    } catch {
      setSyncState("error");
    }
  }, [activeProjectId, activeProjectSlug, setActiveProject]);

  return {
    syncState,
    projectId: activeProjectId,
    projectName: activeProjectName,
    projectSlug: activeProjectSlug,
    saveAsNew,
    rename,
  };
}
