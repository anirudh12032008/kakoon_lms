import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import "./styles/App.css";
import { buildLaunchContext, EDITOR_MODE_PRESETS } from "@/entities/editor-launch/model/config";
import { XpToastHost, useGamification } from "@/entities/gamification";
import { ErrorToastHost } from "@/shared/error/ErrorToastHost";
import { useAuth } from "@/shared/auth/AuthContext";
import { AnimationProvider } from "@/shared/context/AnimationContext";
import { NodeModeProvider } from "@/shared/context/NodeModeContext";
import { AdminPage } from "@/pages/admin/ui/AdminPage";
import { ProtectedRoute, GuestOnlyRoute } from "@/shared/auth/ProtectedRoute";
import { LoginPage } from "@/features/auth/ui/LoginPage";
import { RegisterPage } from "@/features/auth/ui/RegisterPage";
import { CoursesPage } from "@/pages/courses/ui/CoursesPage";
import { CourseDetailPage } from "@/pages/courses/ui/CourseDetailPage";
import { useLaunchStore } from "@/shared/launch/launchStore";
import { useProjectStore } from "@/shared/launch/projectStore";
import { ProjectsPage } from "@/pages/projects/ui/ProjectsPage";
import { SharedProjectPage } from "@/pages/projects/ui/SharedProjectPage";

const EditorPage = lazy(() => import("@/pages/editor/ui/EditorPage"));

function PageLoader() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-page">
      <span className="text-lg font-semibold text-body">Kokoon</span>
      <span className="loading loading-spinner loading-md text-primary-c" />
    </div>
  );
}

/** Keeps the gamification store pointed at the signed-in user's profile. */
function GamificationBridge() {
  const { user } = useAuth();
  const setUser = useGamification((s) => s.setUser);
  useEffect(() => {
    setUser(user?.id ?? null);
  }, [user?.id, setUser]);
  return null;
}

// The workspace the editor opens with when nothing else was chosen.
const DEFAULT_LAUNCH_PRESET =
  EDITOR_MODE_PRESETS.find((p) => p.id === "full-workshop") ?? EDITOR_MODE_PRESETS[0];

// ── Editor route — reads the launch context from the store ────────────────────
function EditorRoute() {
  const navigate = useNavigate();
  const storedContext = useLaunchStore((s) => s.context);
  const setContext = useLaunchStore((s) => s.setContext);

  // No entry page any more — fall straight into the default workspace.
  const context = storedContext ?? buildLaunchContext(DEFAULT_LAUNCH_PRESET);

  const courseSlug = context.courseSlug;

  return (
    <Suspense fallback={<PageLoader />}>
      <EditorPage
        launchContext={context}
        onBackToDashboard={() => {
          setContext(null);
          // Return to the specific course page when launched from a course.
          navigate(courseSlug ? `/courses/${courseSlug}` : "/courses");
        }}
      />
    </Suspense>
  );
}

// ── Launch route — the picker is gone; go straight to the editor ──────────────
function LaunchRoute() {
  const setContext = useLaunchStore((s) => s.setContext);

  useEffect(() => {
    // A fresh launch is a new sandbox — unbind any open project.
    useProjectStore.getState().clearActiveProject();
    setContext(buildLaunchContext(DEFAULT_LAUNCH_PRESET));
  }, [setContext]);

  return <Navigate to="/editor" replace />;
}

function AdminRoute() {
  const navigate = useNavigate();
  return <AdminPage onBack={() => navigate("/courses")} />;
}

export default function App() {
  return (
    <AnimationProvider>
      <NodeModeProvider>
        <GamificationBridge />
        <XpToastHost />
        <ErrorToastHost />
        <Routes>
          {/* Public — shared project view link (works for guests and authed users) */}
          <Route path="/p/:slug" element={<SharedProjectPage />} />

          {/* Guest-only */}
          <Route element={<GuestOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Authenticated */}
          <Route element={<ProtectedRoute />}>
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/:slug" element={<CourseDetailPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/launch" element={<LaunchRoute />} />
            <Route path="/editor" element={<EditorRoute />} />
            <Route path="/admin" element={<AdminRoute />} />
          </Route>

          <Route path="/" element={<Navigate to="/courses" replace />} />
          <Route path="*" element={<Navigate to="/courses" replace />} />
        </Routes>
      </NodeModeProvider>
    </AnimationProvider>
  );
}
