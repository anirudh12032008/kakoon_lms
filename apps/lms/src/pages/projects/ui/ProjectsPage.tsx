import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FolderOpen, Pencil, Plus, Trash2, Clock, Loader2 } from "lucide-react";
import { apiErrorMessage } from "@/shared/api/client";
import {
  listProjects, getProject, renameProject, deleteProject,
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

const fadeUp = (order: number) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay: order * 0.05 },
});

export function ProjectsPage() {
  const navigate = useNavigate();
  const { prompt, confirm } = useModal();
  const setLaunchContext = useLaunchStore((s) => s.setContext);
  const setActiveProject = useProjectStore((s) => s.setActiveProject);

  const [projects, setProjects] = useState<ProjectSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);

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
    <div className="relative h-screen overflow-y-auto bg-page">
      <DashboardHeader />

      <main className="relative mx-auto max-w-6xl px-5 py-8">
        <motion.div {...fadeUp(0)} className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-body">My Projects</h1>
            <p className="mt-1.5 text-[15px] text-sub">
              Your saved workspaces. Open one to keep building — changes save automatically.
            </p>
          </div>
          <button onClick={newProject} className="btn btn-primary gap-2 shrink-0">
            <Plus className="h-4 w-4" /> New project
          </button>
        </motion.div>

        {error && (
          <div className="mb-5 rounded-xl border border-error-tint bg-error-tint px-4 py-3 text-sm font-medium text-error-c">
            {error}
          </div>
        )}

        {!projects && !error && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl border border-subtle bg-raised" />
            ))}
          </div>
        )}

        {projects && projects.length === 0 && (
          <motion.div {...fadeUp(1)} className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-subtle bg-raised px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-white">
              <FolderOpen className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-body">No projects yet</h3>
            <p className="mt-1 max-w-sm text-sm text-sub">
              Open the editor, build something, and hit <span className="font-semibold text-body">Save</span> to keep it here.
            </p>
            <button onClick={newProject} className="btn btn-primary mt-5 gap-2">
              <Plus className="h-4 w-4" /> Start a project
            </button>
          </motion.div>
        )}

        {projects && projects.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p, i) => (
              <motion.div
                key={p.id}
                {...fadeUp(1 + i)}
                className="group flex flex-col rounded-2xl border border-subtle bg-raised p-4 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-black/10"
              >
                <button onClick={() => openProject(p)} className="flex flex-1 flex-col items-start text-left">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary-c">
                    <FolderOpen className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 line-clamp-2 text-[15px] font-bold text-body">{p.name}</h3>
                  <div className="mt-1 flex items-center gap-1.5 text-[12px] text-hint">
                    <Clock className="h-3.5 w-3.5" /> Saved {timeAgo(p.updatedAt)}
                  </div>
                </button>

                <div className="mt-4 flex items-center gap-2 border-t border-subtle pt-3">
                  <button
                    onClick={() => openProject(p)}
                    disabled={openingId === p.id}
                    className="btn btn-primary btn-sm flex-1 gap-1.5"
                  >
                    {openingId === p.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <FolderOpen className="h-3.5 w-3.5" />}
                    Open
                  </button>
                  <button onClick={() => handleRename(p)} title="Rename" className="btn btn-ghost btn-sm px-2 text-sub">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(p)} title="Delete" className="btn btn-ghost btn-sm px-2 text-error-c">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
