import { NodeCanvas } from "@/widgets/node-canvas/ui/NodeCanvas";

/**
 * DEV-only sandbox that mounts the bare NodeCanvas (no auth, no backend) so the
 * editing surface — including undo/redo — can be exercised in isolation.
 * Reachable at /dev-canvas while running `vite` in development.
 */
export default function DevCanvasHarness() {
  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <NodeCanvas />
    </div>
  );
}
