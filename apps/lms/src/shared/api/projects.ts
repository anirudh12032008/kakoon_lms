import { api } from "./client";
import type { EditorLaunchContext } from "@/entities/editor-launch/model/config";
import type { ViewMode } from "@/pages/editor/ui/EditorPage";

export interface ProjectWorkspace {
  nodes: unknown[];
  edges: unknown[];
}

/** Editor state captured alongside a saved project so it reopens faithfully. */
export interface ProjectMeta {
  generatedCode?: string;
  editableCode?: string;
  hasManualEdits?: boolean;
  viewMode?: ViewMode;
  isEditing?: boolean;
  launchContext?: EditorLaunchContext | null;
}

/** Lightweight project shape used by the Projects list. */
export interface ProjectSummary {
  id: string;
  name: string;
  code?: string;
  createdAt: string;
  updatedAt: string;
}

/** Full project, including the workspace graph and editor meta. */
export interface ProjectFull extends ProjectSummary {
  workspace: ProjectWorkspace;
  meta: ProjectMeta | null;
}

/** The API serializes Mongo docs with `_id`; normalize to `id`. */
function normalize<T extends { _id?: string; id?: string }>(raw: T): T & { id: string } {
  return { ...raw, id: raw.id ?? raw._id ?? "" };
}

export async function listProjects(): Promise<ProjectSummary[]> {
  const { data } = await api.get<{ projects: (ProjectSummary & { _id?: string })[] }>("/projects");
  return data.projects.map(normalize);
}

export async function getProject(id: string): Promise<ProjectFull> {
  const { data } = await api.get<{ project: ProjectFull & { _id?: string } }>(`/projects/${id}`);
  return normalize(data.project);
}

export interface CreateProjectInput {
  name: string;
  workspace: ProjectWorkspace;
  code?: string;
  meta?: ProjectMeta | null;
}

export async function createProject(input: CreateProjectInput): Promise<ProjectFull> {
  const { data } = await api.post<{ project: ProjectFull & { _id?: string } }>("/projects", input);
  return normalize(data.project);
}

export interface UpdateProjectInput {
  name?: string;
  workspace?: ProjectWorkspace;
  code?: string;
  meta?: ProjectMeta | null;
}

export async function updateProject(id: string, input: UpdateProjectInput): Promise<string> {
  const { data } = await api.put<{ savedAt: string }>(`/projects/${id}`, input);
  return data.savedAt;
}

export async function renameProject(id: string, name: string): Promise<void> {
  await api.put(`/projects/${id}`, { name });
}

export async function deleteProject(id: string): Promise<void> {
  await api.delete(`/projects/${id}`);
}
