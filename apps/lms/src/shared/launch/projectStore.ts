import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Tracks which saved project the editor is currently bound to.
 *
 * Set when a project is opened from the Projects page (or created via Save in
 * the editor), read by the editor's project-sync hook to load + autosave the
 * right document. Persisted so a refresh inside the editor stays on the same
 * project. Cleared when launching a fresh sandbox/mode/kit workspace.
 */
interface ProjectStore {
  activeProjectId: string | null;
  activeProjectName: string | null;
  setActiveProject: (id: string | null, name?: string | null) => void;
  clearActiveProject: () => void;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set) => ({
      activeProjectId: null,
      activeProjectName: null,
      setActiveProject: (activeProjectId, activeProjectName = null) =>
        set({ activeProjectId, activeProjectName }),
      clearActiveProject: () => set({ activeProjectId: null, activeProjectName: null }),
    }),
    { name: "kokoon-editor-active-project" }
  )
);
