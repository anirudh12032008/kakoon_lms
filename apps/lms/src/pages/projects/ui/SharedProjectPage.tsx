import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Node, Edge } from "@xyflow/react";
import { apiErrorMessage } from "@/shared/api/client";
import { getSharedProject, type SharedProject } from "@/shared/api/projects";
import { useAuth } from "@/shared/auth/AuthContext";
import { useLaunchStore } from "@/shared/launch/launchStore";
import { useProjectStore } from "@/shared/launch/projectStore";
import { buildLaunchContext, EDITOR_MODE_PRESETS, type EditorLaunchContext } from "@/entities/editor-launch/model/config";

const EditorPage = lazy(() => import("@/pages/editor/ui/EditorPage"));

function CenterCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-page text-center">
      <div className="flex items-center gap-3">
        <span className="text-2xl">⚡</span>
        <span className="text-lg font-bold text-primary-c">Kokoon</span>
      </div>
      {children}
    </div>
  );
}

/** Public, read-only view of a shared project (the author gets edit mode). */
export function SharedProjectPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { status } = useAuth();
  const setLaunchContext = useLaunchStore((s) => s.setContext);
  const setActiveProject = useProjectStore((s) => s.setActiveProject);

  const [shared, setShared] = useState<SharedProject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const redirectedRef = useRef(false);

  const fullWorkshop = EDITOR_MODE_PRESETS.find((p) => p.id === "full-workshop") ?? EDITOR_MODE_PRESETS[0];

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    getSharedProject(slug)
      .then((data) => !cancelled && setShared(data))
      .catch((e) => !cancelled && setError(apiErrorMessage(e, "This shared project could not be found")));
    return () => { cancelled = true; };
  }, [slug]);

  // Author viewing their own link → open it in normal (editable) mode.
  useEffect(() => {
    if (!shared || !shared.canEdit || redirectedRef.current) return;
    redirectedRef.current = true;
    const ctx = (shared.project.meta?.launchContext as EditorLaunchContext | undefined)
      ?? buildLaunchContext(fullWorkshop);
    setLaunchContext({ ...ctx, courseSlug: undefined });
    setActiveProject(shared.project.id, shared.project.name, shared.project.slug);
    navigate("/editor", { replace: true });
  }, [shared, fullWorkshop, setLaunchContext, setActiveProject, navigate]);

  if (error) {
    return (
      <CenterCard>
        <p className="text-lg font-bold text-body">Project not available</p>
        <p className="max-w-sm text-sm text-sub">{error}</p>
        <button onClick={() => navigate(status === "authed" ? "/projects" : "/login")} className="btn btn-primary btn-sm">
          {status === "authed" ? "Go to my projects" : "Sign in"}
        </button>
      </CenterCard>
    );
  }

  if (!shared || shared.canEdit) {
    return <CenterCard><span className="loading loading-spinner loading-md text-primary-c" /></CenterCard>;
  }

  const ctx = (shared.project.meta?.launchContext as EditorLaunchContext | undefined)
    ?? buildLaunchContext(fullWorkshop);

  return (
    <Suspense fallback={<CenterCard><span className="loading loading-spinner loading-md text-primary-c" /></CenterCard>}>
      <EditorPage
        readOnly
        sharedAuthorName={shared.authorName}
        launchContext={{ ...ctx, title: shared.project.name, courseSlug: undefined }}
        initialWorkspace={shared.project.workspace as { nodes: Node[]; edges: Edge[] }}
        initialCode={shared.project.code}
        onBackToDashboard={() => navigate(status === "authed" ? "/projects" : "/login")}
      />
    </Suspense>
  );
}
