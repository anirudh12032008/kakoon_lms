import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Zap } from "lucide-react";
import { burstConfetti } from "@/shared/lib/confetti";
import { useGamification, type GamificationToast } from "../model/store";

const TOAST_LIFETIME_MS = 4000;

function Toast({ toast }: { toast: GamificationToast }) {
  const dismiss = useGamification((s) => s.dismissToast);

  useEffect(() => {
    // Celebrate: small pop near the toast for XP, full-screen rain for
    // achievements and level-ups.
    if (toast.kind === "xp") burstConfetti(0.88, 0.82, 45);
    else burstConfetti(0.5, 0.35, 150);
    const t = setTimeout(() => dismiss(toast.id), TOAST_LIFETIME_MS);
    return () => clearTimeout(t);
  }, [toast.id, toast.kind, dismiss]);

  const isXp = toast.kind === "xp";

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 24, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      onClick={() => dismiss(toast.id)}
      className={`pointer-events-auto flex w-72 items-center gap-3 rounded-2xl border p-3.5 text-left shadow-2xl backdrop-blur-xl ${
        toast.kind === "achievement"
          ? "border-warning-tint bg-panel"
          : toast.kind === "level-up"
            ? "border-primary-tint bg-panel"
            : "border-subtle bg-panel"
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl ${
          isXp ? "bg-brand-gradient" : "bg-raised"
        }`}
      >
        {isXp ? <Zap className="h-5 w-5 text-white" fill="currentColor" /> : toast.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-bold text-body">{toast.title}</div>
        {toast.subtitle && <div className="truncate text-[11.5px] text-sub">{toast.subtitle}</div>}
        {toast.xp != null && (
          <div className="text-[12px] font-black text-primary-c">+{toast.xp} XP</div>
        )}
      </div>
    </motion.button>
  );
}

/** Fixed celebration stack — mount once in App so XP pops everywhere. */
export function XpToastHost() {
  const toasts = useGamification((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed bottom-16 right-4 z-[100] flex flex-col items-end gap-2">
      <AnimatePresence>
        {toasts.slice(-4).map((t) => (
          <Toast key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
