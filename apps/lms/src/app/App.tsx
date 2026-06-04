import { lazy, Suspense, useEffect, useState } from "react";
import "./styles/App.css";
import type { EditorLaunchContext } from "@/entities/editor-launch/model/config";
import { AnimationProvider } from "@/shared/context/AnimationContext";
import { AdminPage } from "@/pages/admin/ui/AdminPage";

const EditorLaunchDashboard = lazy(() => import("@/pages/editor-launch/ui/EditorLaunchDashboard").then((mod) => ({ default: mod.EditorLaunchDashboard })));
const EditorPage = lazy(() => import("@/pages/editor/ui/EditorPage"));

const LAUNCH_STORAGE_KEY = "kakoon-editor-launch-context";

function isAdminRoute() {
  return (
    window.location.hash === "#admin" ||
    new URLSearchParams(window.location.search).has("admin")
  );
}

export default function App() {
  const [showAdmin, setShowAdmin] = useState(isAdminRoute);

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
    } catch { }
  }, [launchContext]);

  if (showAdmin) {
    return (
      <AnimationProvider>
        <AdminPage onBack={() => {
          history.replaceState(null, "", window.location.pathname);
          setShowAdmin(false);
        }} />
      </AnimationProvider>
    );
  }

  return (
    <AnimationProvider>
    <Suspense
      fallback={
        <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-page">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <span className="text-lg font-bold text-primary-c">Kakoon</span>
          </div>
          <span className="loading loading-spinner loading-md text-primary-c" />
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
    </AnimationProvider>
  );
}
