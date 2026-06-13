import { create } from "zustand";
import { errorHint } from "./errorCatalog";

export interface ErrorToast {
  id: number;
  /** Human-friendly message (from the API or a fallback). */
  message: string;
  /** Stable catalog code, e.g. "KKN-1004", when the API supplied one. */
  code?: string;
  /** Friendly next-step guidance derived from the code. */
  hint?: string;
}

interface ErrorToastState {
  toasts: ErrorToast[];
  pushError: (input: { message: string; code?: string }) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useErrorToasts = create<ErrorToastState>((set, get) => ({
  toasts: [],
  pushError: ({ message, code }) => {
    // De-dupe: if the same code+message is already on screen, don't stack it.
    const exists = get().toasts.some((t) => t.code === code && t.message === message);
    if (exists) return;
    set((s) => ({
      toasts: [...s.toasts, { id: nextId++, message, code, hint: errorHint(code) }],
    }));
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Imperative entry point so non-React code (the axios interceptor) can report errors. */
export function reportError(input: { message: string; code?: string }) {
  useErrorToasts.getState().pushError(input);
}
