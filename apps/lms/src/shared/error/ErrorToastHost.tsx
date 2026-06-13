import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { useErrorToasts, type ErrorToast } from "./errorToastStore";

const TOAST_LIFETIME_MS = 6000;

function Toast({ toast }: { toast: ErrorToast }) {
  const dismiss = useErrorToasts((s) => s.dismiss);

  useEffect(() => {
    const t = setTimeout(() => dismiss(toast.id), TOAST_LIFETIME_MS);
    return () => clearTimeout(t);
  }, [toast.id, dismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      role="alert"
      className="pointer-events-auto flex w-80 items-start gap-3 rounded-2xl border border-error-tint bg-panel p-3.5 text-left shadow-2xl backdrop-blur-xl"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-error-tint text-error-c">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13px] font-bold text-body">{toast.message}</span>
          {toast.code && (
            <span className="shrink-0 rounded-md bg-raised px-1.5 py-0.5 font-mono text-[10px] font-bold text-sub">
              {toast.code}
            </span>
          )}
        </div>
        {toast.hint && <div className="mt-0.5 text-[11.5px] text-sub">{toast.hint}</div>}
      </div>
      <button
        onClick={() => dismiss(toast.id)}
        aria-label="Dismiss"
        className="shrink-0 rounded-lg p-1 text-sub transition hover:bg-raised hover:text-body"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

/** Fixed error stack — mount once in App so API/runtime errors surface anywhere. */
export function ErrorToastHost() {
  const toasts = useErrorToasts((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[110] flex -translate-x-1/2 flex-col items-center gap-2">
      <AnimatePresence>
        {toasts.slice(-3).map((t) => (
          <Toast key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
