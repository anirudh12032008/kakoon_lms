import { createContext, useContext, useState, useCallback } from "react";
import { MotionConfig } from "framer-motion";

interface AnimationContextValue {
  animationsEnabled: boolean;
  toggle: () => void;
}

const AnimationContext = createContext<AnimationContextValue>({
  animationsEnabled: true,
  toggle: () => {},
});

export function useAnimations() {
  return useContext(AnimationContext);
}

export function AnimationProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem("kakoon-animations") !== "false"; }
    catch { return true; }
  });

  const toggle = useCallback(() => {
    setEnabled(prev => {
      const next = !prev;
      try { localStorage.setItem("kakoon-animations", String(next)); } catch {}
      return next;
    });
  }, []);

  return (
    <AnimationContext.Provider value={{ animationsEnabled: enabled, toggle }}>
      {/* reducedMotion="always" instantly disables every Framer Motion animation site-wide */}
      <MotionConfig reducedMotion={enabled ? "never" : "always"}>
        {children}
      </MotionConfig>
    </AnimationContext.Provider>
  );
}
