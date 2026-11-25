import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { useErrorToasts, type ErrorToast } from "./errorToastStore";

const TOAST_LIFETIME_MS = 6000;

function Toast({ toast }: { toast: ErrorToast }) {
  const dismiss = useErrorToasts((s) => s.dismiss);
  // Hovering or focusing the toast holds it open, so nobody loses the message mid-read.
  const [held, setHeld] = useState(false);

  useEffect(() => {
    if (held) return;
    const t = setTimeout(() => dismiss(toast.id), TOAST_LIFETIME_MS);
    return () => clearTimeout(t);
  }, [toast.id, dismiss, held]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={() => setHeld(false)}
      className="pointer-events-auto flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3 rounded-lg border border-error-tint bg-panel p-3 text-left shadow-lg"
    >
      <div aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-error-tint text-error-c">
        <AlertTriangle className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-body">
          <span className="sr-only">Error: </span>
          {toast.message}
          {toast.code && (
            <span className="ml-2 rounded bg-raised px-1.5 py-0.5 font-mono text-xs font-semibold text-sub">
              {toast.code}
            </span>
          )}
        </p>
        {toast.hint && <p className="mt-0.5 text-[13px] text-sub">{toast.hint}</p>}
      </div>
      <button
        onClick={() => dismiss(toast.id)}
        aria-label="Dismiss error"
        className="-m-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sub transition-colors hover:bg-hover hover:text-body"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </motion.div>
  );
}

/** Fixed error stack - mount once in App so API/runtime errors surface anywhere. */
export function ErrorToastHost() {
  const toasts = useErrorToasts((s) => s.toasts);
  return (
    // Always mounted: an assertive live region announces each error as it is added.
    <div role="alert" className="pointer-events-none fixed bottom-4 left-1/2 z-[110] flex -translate-x-1/2 flex-col items-center gap-2">
      <AnimatePresence>
        {toasts.slice(-3).map((t) => (
          <Toast key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
