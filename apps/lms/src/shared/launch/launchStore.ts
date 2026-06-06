import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { EditorLaunchContext } from "@/entities/editor-launch/model/config";

/**
 * Holds the launch context the editor should open with. Set by the launch
 * dashboard or a course page, read by the editor route. Persisted so a refresh
 * inside the editor keeps the same workspace configuration.
 */
interface LaunchStore {
  context: EditorLaunchContext | null;
  setContext: (ctx: EditorLaunchContext | null) => void;
}

export const useLaunchStore = create<LaunchStore>()(
  persist(
    (set) => ({
      context: null,
      setContext: (context) => set({ context }),
    }),
    { name: "kokoon-editor-launch-context" }
  )
);
