import { createContext, useContext, type ReactNode } from "react";

interface NodeActions {
  /** Open the designer hub and pre-select the Matrix tab */
  openMatrixDesigner: () => void;
  /**
   * Delete an OLED animation from the local registry AND from the
   * ESP32 device if a serial connection is active.
   */
  deleteOLEDAnim: (name: string) => Promise<void>;
}

const NodeActionsContext = createContext<NodeActions>({
  openMatrixDesigner: () => {},
  deleteOLEDAnim: async () => {},
});

export function NodeActionsProvider({
  children,
  openMatrixDesigner,
  deleteOLEDAnim,
}: {
  children: ReactNode;
  openMatrixDesigner: () => void;
  deleteOLEDAnim: (name: string) => Promise<void>;
}) {
  return (
    <NodeActionsContext value={{ openMatrixDesigner, deleteOLEDAnim }}>
      {children}
    </NodeActionsContext>
  );
}

export function useNodeActions() {
  return useContext(NodeActionsContext);
}
