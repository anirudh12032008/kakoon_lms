import { lazy, Suspense, useEffect, useState } from "react";
import type { EditorLaunchContext } from "./config/editorLaunch";

const EditorLaunchDashboard = lazy(() => import("./components/editor/EditorLaunchDashboard").then((mod) => ({ default: mod.EditorLaunchDashboard })));
const EditorPage = lazy(() => import("./pages/editor/EditorPage"));

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
        <div style={{ position: "fixed", inset: 0, background: "#09090b", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 32, height: 32, border: "3px solid #3f3f46", borderTopColor: "#7c3aed", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
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
