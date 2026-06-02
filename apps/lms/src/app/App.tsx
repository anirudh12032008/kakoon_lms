import { lazy, Suspense, useEffect, useState } from "react";
import "./styles/App.css";
import type { EditorLaunchContext } from "@/entities/editor-launch/model/config";

const EditorLaunchDashboard = lazy(() => import("@/pages/editor-launch/ui/EditorLaunchDashboard").then((mod) => ({ default: mod.EditorLaunchDashboard })));
const EditorPage = lazy(() => import("@/pages/editor/ui/EditorPage"));

const LAUNCH_STORAGE_KEY = "kakoon-editor-launch-context";

export default function App() {
  const [launchContext, setLaunchContext] = useState<EditorLaunchContext | null>(() => {
    try {
      const saved = localStorage.getItem(LAUNCH_STORAGE_KEY);
      return saved ? JSON.parse(saved) as EditorLaunchContext : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (launchContext) {
        localStorage.setItem(LAUNCH_STORAGE_KEY, JSON.stringify(launchContext));
      } else {
        localStorage.removeItem(LAUNCH_STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors in private browsing or locked-down browsers.
    }
  }, [launchContext]);

  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 flex flex-col items-center justify-center gap-4"
          style={{ background: "var(--k-base-100)" }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <span className="text-lg font-bold" style={{ color: "var(--k-primary)" }}>Kakoon</span>
          </div>
          <span className="loading loading-spinner loading-md" style={{ color: "var(--k-primary)" }} />
        </div>
      }
    >
      {launchContext ? (
        <EditorPage
          launchContext={launchContext}
          onBackToDashboard={() => setLaunchContext(null)}
        />
      ) : (
        <EditorLaunchDashboard onLaunch={setLaunchContext} />
      )}
    </Suspense>
  );
}
