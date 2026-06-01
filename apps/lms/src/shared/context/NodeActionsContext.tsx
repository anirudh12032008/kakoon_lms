/**
 * Provides action callbacks that node components need but cannot receive
 * as props through React Flow (which only passes node.data).
 *
 * Wrap the canvas with NodeActionsProvider in EditorPage and read here
 * in any node component that needs to trigger UI outside the canvas.
 */

import { createContext, useContext, type ReactNode } from "react";

interface NodeActions {
  /** Open the designer hub and pre-select the Matrix tab */
  openMatrixDesigner: () => void;
}

const NodeActionsContext = createContext<NodeActions>({
  openMatrixDesigner: () => {},
});

export function NodeActionsProvider({
  children,
  openMatrixDesigner,
}: {
  children: ReactNode;
  openMatrixDesigner: () => void;
}) {
  return (
    <NodeActionsContext value={{ openMatrixDesigner }}>
      {children}
    </NodeActionsContext>
  );
}

export function useNodeActions() {
  return useContext(NodeActionsContext);
}
