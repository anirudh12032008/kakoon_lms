import { APP_NAME } from "@/shared/config/brand";
import { BrandScreen } from "@/shared/ui/BrandMark";
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
      <BrandScreen>
        <title>{`Project not available · ${APP_NAME}`}</title>
        <h1 className="font-display text-2xl font-semibold text-body">Project not available</h1>
        <p role="alert" className="max-w-sm text-sm text-sub">{error}</p>
        <button onClick={() => navigate(status === "authed" ? "/projects" : "/login")} className="btn btn-primary min-h-11">
          {status === "authed" ? "Go to my projects" : "Sign in"}
        </button>
      </BrandScreen>
    );
  }

  if (!shared || shared.canEdit) {
    return <BrandScreen />;
  }

  const ctx = (shared.project.meta?.launchContext as EditorLaunchContext | undefined)
    ?? buildLaunchContext(fullWorkshop);

  return (
    <Suspense fallback={<BrandScreen />}>
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
