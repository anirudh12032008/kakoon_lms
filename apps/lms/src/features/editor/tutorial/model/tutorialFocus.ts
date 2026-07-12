import { create } from "zustand";

/**
 * Bridges the active tutorial step and the node palette.
 *
 * When an interactive tutorial asks the learner to drag a specific block, the
 * palette section that holds it may be collapsed — which hides both the block
 * and the "drag this" hand. The tutorial writes the target category/node here;
 * the palette reads it and auto-expands that section so the highlight and the
 * drag hint can actually land on a visible element.
 *
 * Cleared (both null) whenever no palette action is pending (connect/edit-field
 * steps, or no active tutorial), so the palette returns to normal user control.
 */
interface TutorialFocusStore {
  focusCategoryId: string | null;
  focusNodeType: string | null;
  setFocus: (categoryId: string | null, nodeType: string | null) => void;
}

export const useTutorialFocus = create<TutorialFocusStore>((set) => ({
  focusCategoryId: null,
  focusNodeType: null,
  setFocus: (focusCategoryId, focusNodeType) => set({ focusCategoryId, focusNodeType }),
}));
