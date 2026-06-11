import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type ConfirmModal = {
  type: "confirm";
  message: string;
  resolve: (v: boolean) => void;
};
type PromptModal = {
  type: "prompt";
  message: string;
  defaultValue: string;
  resolve: (v: string | null) => void;
};
type PendingModal = ConfirmModal | PromptModal;

interface ModalContextValue {
  confirm: (message: string) => Promise<boolean>;
  prompt: (message: string, defaultValue?: string) => Promise<string | null>;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingModal | null>(null);
  const [inputValue, setInputValue] = useState("");

  const confirm = useCallback((message: string): Promise<boolean> =>
    new Promise((resolve) => setPending({ type: "confirm", message, resolve })),
  []);

  const prompt = useCallback(
    (message: string, defaultValue = ""): Promise<string | null> =>
      new Promise((resolve) => {
        setInputValue(defaultValue);
        setPending({ type: "prompt", message, defaultValue, resolve });
      }),
    []
  );

  const handleConfirm = () => {
    if (!pending) return;
    if (pending.type === "confirm") pending.resolve(true);
    else pending.resolve(inputValue.trim() || null);
    setPending(null);
  };

  const handleCancel = () => {
    if (!pending) return;
    if (pending.type === "confirm") pending.resolve(false);
    else pending.resolve(null);
    setPending(null);
  };

  return (
    <ModalContext.Provider value={{ confirm, prompt }}>
      {children}
      {pending &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) handleCancel(); }}
          >
            <div className="w-full max-w-sm rounded-2xl border border-[var(--k-border)] bg-[var(--k-base-200)] p-5 shadow-2xl">
              <p className="text-sm text-[var(--k-text)] mb-4 leading-relaxed whitespace-pre-wrap">
                {pending.message}
              </p>
              {pending.type === "prompt" && (
                <input
                  autoFocus
                  className="w-full mb-4 rounded-lg border border-[var(--k-border)] bg-[var(--k-base-300)] px-3 py-2 text-sm text-[var(--k-text)] outline-none focus:border-violet-500 transition-colors"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleConfirm();
                    if (e.key === "Escape") handleCancel();
                  }}
                />
              )}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleCancel}
                  className="px-4 py-1.5 rounded-lg text-sm text-[var(--k-muted)] hover:text-[var(--k-text)] hover:bg-[var(--k-base-300)] transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white transition-all"
                >
                  {pending.type === "confirm" ? "Confirm" : "Save"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </ModalContext.Provider>
  );
}

export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within ModalProvider");
  return ctx;
}
