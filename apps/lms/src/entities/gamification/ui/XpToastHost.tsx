import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Medal, TrendingUp, Zap } from "lucide-react";
import { burstConfetti } from "@/shared/lib/confetti";
import { useGamification, type GamificationToast } from "../model/store";

const TOAST_LIFETIME_MS = 4000;

const KIND_ICON = { xp: Zap, achievement: Medal, "level-up": TrendingUp } as const;

function Toast({ toast }: { toast: GamificationToast }) {
  const dismiss = useGamification((s) => s.dismissToast);

  useEffect(() => {
    // Confetti is kept for the rare moments (a badge, a level-up), not every XP
    // tick, and never for people who asked for reduced motion.
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (toast.kind !== "xp" && !calm) burstConfetti(0.5, 0.35, 150);
    const t = setTimeout(() => dismiss(toast.id), TOAST_LIFETIME_MS);
    return () => clearTimeout(t);
  }, [toast.id, toast.kind, dismiss]);

  const Icon = KIND_ICON[toast.kind] ?? Zap;

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={() => dismiss(toast.id)}
      title="Dismiss"
      className="pointer-events-auto flex w-72 max-w-[calc(100vw-2rem)] items-center gap-3 rounded-lg border border-subtle bg-panel p-3 text-left shadow-lg"
    >
      <span
        aria-hidden="true"
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
          toast.kind === "xp" ? "bg-hover text-body" : "bg-brand-gradient text-on-primary"
        }`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-body">{toast.title}</span>
        {toast.subtitle && <span className="block text-[13px] text-sub">{toast.subtitle}</span>}
        {toast.xp != null && (
          <span className="block text-[13px] font-semibold text-primary-c">+{toast.xp} XP</span>
        )}
      </span>
    </motion.button>
  );
}

/** Fixed celebration stack - mount once in App so XP pops everywhere. */
export function XpToastHost() {
  const toasts = useGamification((s) => s.toasts);
  return (
    // Always mounted, so this polite live region announces each toast as it arrives.
    <div role="status" className="pointer-events-none fixed bottom-[4.5rem] right-4 z-[100] flex flex-col items-end gap-2">
      <AnimatePresence>
        {toasts.slice(-4).map((t) => (
          <Toast key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
