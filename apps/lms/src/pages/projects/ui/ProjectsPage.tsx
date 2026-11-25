import { APP_NAME } from "@/shared/config/brand";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, FolderOpen, Pencil, Plus, Trash2, Clock, Loader2, Share2, Check } from "lucide-react";
import { apiErrorMessage } from "@/shared/api/client";
import {
  listProjects, getProject, renameProject, deleteProject, shareUrl,
  type ProjectSummary,
} from "@/shared/api/projects";
import { useModal } from "@/shared/context/ModalContext";
import { useLaunchStore } from "@/shared/launch/launchStore";
import { useProjectStore } from "@/shared/launch/projectStore";
import { buildLaunchContext, EDITOR_MODE_PRESETS } from "@/entities/editor-launch/model/config";
import { DashboardHeader } from "@/pages/courses/ui/DashboardHeader";

/** Human-friendly "x ago" for the saved timestamp. */
function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

/** Labelled secondary action in a project card's footer row. */
const rowAction =
  "flex min-h-9 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-semibold transition-colors hover:bg-hover";

export function ProjectsPage() {
  const navigate = useNavigate();
  const { prompt, confirm } = useModal();
  const setLaunchContext = useLaunchStore((s) => s.setContext);
  const setActiveProject = useProjectStore((s) => s.setActiveProject);

  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [sharedId, setSharedId] = useState<string | null>(null);

  const load = () => {
    listProjects()
      .then(setProjects)
      .catch((e) => setError(apiErrorMessage(e, "Could not load your projects")));
  };

  useEffect(() => { load(); }, []);

  const fullWorkshop = EDITOR_MODE_PRESETS.find((p) => p.id === "full-workshop") ?? EDITOR_MODE_PRESETS[0];

  const openProject = async (p: ProjectSummary) => {
    setOpeningId(p.id);
    try {
      // Fetch the full project so we can restore its saved launch context
      // (which blocks/categories the workspace was built with).
      const full = await getProject(p.id);
      const ctx = full.meta?.launchContext ?? buildLaunchContext(fullWorkshop);
      setLaunchContext({ ...ctx, courseSlug: undefined });
      setActiveProject(full.id, full.name);
      navigate("/editor");
    } catch (e) {
      setError(apiErrorMessage(e, "Could not open this project"));
      setOpeningId(null);
    }
  };

  const newProject = () => {
    // Start a fresh sandbox; the user saves it into a project from the editor.
    useProjectStore.getState().clearActiveProject();
    setLaunchContext(buildLaunchContext(fullWorkshop));
    navigate("/editor");
  };

  const handleRename = async (p: ProjectSummary) => {
    const next = await prompt("Rename project", p.name);
    if (!next || !next.trim()) return;
    try {
      await renameProject(p.id, next.trim());
      setProjects((prev) => prev?.map((x) => (x.id === p.id ? { ...x, name: next.trim() } : x)) ?? null);
    } catch (e) {
      setError(apiErrorMessage(e, "Could not rename project"));
    }
  };

  const handleShare = async (p: ProjectSummary) => {
    if (!p.slug) { setError("This project has no share link yet. Open it and save it again."); return; }
    try { await navigator.clipboard.writeText(shareUrl(p.slug)); } catch { /* clipboard blocked */ }
    setSharedId(p.id);
    setTimeout(() => setSharedId((cur) => (cur === p.id ? null : cur)), 2000);
  };

  const handleDelete = async (p: ProjectSummary) => {
    const ok = await confirm(`Delete “${p.name}”? This can't be undone.`);
    if (!ok) return;
    try {
      await deleteProject(p.id);
      setProjects((prev) => prev?.filter((x) => x.id !== p.id) ?? null);
    } catch (e) {
      setError(apiErrorMessage(e, "Could not delete project"));
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-page">
      <title>{`My projects · ${APP_NAME}`}</title>
      <DashboardHeader />

      <main id="main" tabIndex={-1} className="mx-auto max-w-6xl px-4 pb-20 pt-8 outline-none sm:px-6 sm:pt-12">
        <div className="flex flex-col gap-5 border-b border-subtle pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-3xl font-semibold text-body sm:text-4xl">My projects</h1>
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-sub">
              Your saved workspaces. Open one to keep building. Changes save automatically.
            </p>
          </div>
          <button
            onClick={newProject}
            className="flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-brand-gradient px-5 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> New project
          </button>
        </div>

        {/* Always mounted so errors and "link copied" are announced when they appear. */}
        <div role="alert">
          {error && (
            <p className="mt-5 flex items-start gap-2 rounded-md border border-error-tint bg-error-tint px-4 py-3 text-sm font-medium text-error-c">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}
        </div>
        <p role="status" className="sr-only">{sharedId ? "Share link copied to clipboard" : ""}</p>

        {!projects && !error && (
          <div role="status" className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <span className="sr-only">Loading your projects</span>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} aria-hidden="true" className="h-36 animate-pulse rounded-lg border border-subtle bg-panel" />
            ))}
          </div>
        )}

        {projects && projects.length === 0 && (
          <div className="mt-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-strong px-6 py-16 text-center">
            <FolderOpen className="h-8 w-8 text-sub" aria-hidden="true" />
            <h2 className="mt-4 text-lg font-semibold text-body">No projects yet</h2>
            <p className="mt-1 max-w-sm text-sm leading-relaxed text-sub">
              Open the editor, build something, and choose <span className="font-semibold text-body">Save</span> to keep it here.
            </p>
            <button
              onClick={newProject}
              className="mt-5 flex min-h-11 items-center justify-center gap-2 rounded-md border border-strong px-5 text-sm font-semibold text-body transition-colors hover:bg-hover"
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> Start a project
            </button>
          </div>
        )}

        {projects && projects.length > 0 && (
          <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <li
                key={p.id}
                className="flex flex-col rounded-lg border border-subtle bg-panel transition-colors duration-150 hover:border-[var(--k-primary-text)]"
              >
                <button
                  onClick={() => openProject(p)}
                  disabled={openingId === p.id}
                  aria-label={`Open ${p.name}`}
                  className="flex flex-1 flex-col items-start rounded-t-lg p-5 text-left"
                >
                  <h2 className="line-clamp-2 text-lg font-semibold leading-snug text-body">{p.name}</h2>
                  <span className="mt-2 flex items-center gap-1.5 text-[13px] text-sub">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" /> Saved {timeAgo(p.updatedAt)}
                  </span>
                  <span className="mt-auto flex items-center gap-1.5 pt-5 text-sm font-semibold text-primary-c">
                    {openingId === p.id
                      ? <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Opening…</>
                      : <>Open in editor <ArrowRight className="h-4 w-4" aria-hidden="true" /></>}
                  </span>
                </button>

                <div className="flex flex-wrap items-center gap-1 border-t border-subtle px-3 py-2">
                  <button onClick={() => handleShare(p)} className={`${rowAction} ${sharedId === p.id ? "text-success-c" : "text-sub"}`}>
                    {sharedId === p.id ? <Check className="h-4 w-4" aria-hidden="true" /> : <Share2 className="h-4 w-4" aria-hidden="true" />}
                    {sharedId === p.id ? "Copied" : "Share"}
                    <span className="sr-only"> {p.name}</span>
                  </button>
                  <button onClick={() => handleRename(p)} className={`${rowAction} text-sub`}>
                    <Pencil className="h-4 w-4" aria-hidden="true" /> Rename
                    <span className="sr-only"> {p.name}</span>
                  </button>
                  <button onClick={() => handleDelete(p)} className={`${rowAction} ml-auto text-error-c`}>
                    <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete
                    <span className="sr-only"> {p.name}</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
