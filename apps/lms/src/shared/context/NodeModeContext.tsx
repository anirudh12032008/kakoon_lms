import { createContext, useContext, useState, type ReactNode } from "react";

interface NodeModeContextValue {
  globalAdvanced: boolean;
  setGlobalAdvanced: (v: boolean) => void;
}

const NodeModeContext = createContext<NodeModeContextValue>({
  globalAdvanced: false,
  setGlobalAdvanced: () => {},
});

export function NodeModeProvider({ children }: { children: ReactNode }) {
  const [globalAdvanced, setGlobalAdvancedState] = useState(() => {
    try { return localStorage.getItem("kokoon-global-adv") === "1"; } catch { return false; }
  });

  const setGlobalAdvanced = (v: boolean) => {
    setGlobalAdvancedState(v);
    try { localStorage.setItem("kokoon-global-adv", v ? "1" : "0"); } catch {}
  };

  return (
    <NodeModeContext.Provider value={{ globalAdvanced, setGlobalAdvanced }}>
      {children}
    </NodeModeContext.Provider>
  );
}

export function useNodeMode() {
  return useContext(NodeModeContext);
}

export function GlobalAdvancedToggle() {
  const { globalAdvanced, setGlobalAdvanced } = useNodeMode();
  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 border-t border-subtle">
      <div className="flex-1">
        <div className={`text-[11px] font-bold ${globalAdvanced ? "text-primary-c" : "text-body"}`}>Workshop Mode</div>
        <div className="text-[9px] text-hint leading-tight mt-0.5">
          {globalAdvanced ? "Advanced tools & fields unlocked" : "Showing the basics only"}
        </div>
      </div>
      <button
        type="button"
        title={globalAdvanced ? "Switch to Basic Mode" : "Unlock Advanced Mode"}
        onClick={() => setGlobalAdvanced(!globalAdvanced)}
        className={`nodrag inline-flex h-5 w-9 items-center rounded-full border p-0.5 transition-colors flex-shrink-0 ${
          globalAdvanced ? "bg-primary border-primary" : "bg-hover border-subtle"
        }`}
      >
        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${globalAdvanced ? "translate-x-4" : "translate-x-0"}`} />
      </button>
    </div>
  );
}

