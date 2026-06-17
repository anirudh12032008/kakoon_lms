import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import {
  getCourseProject, saveCourseProject,
  listProjects, getProject, createProject, updateProject, deleteProject,
} from "./projects.controller";

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

// Course-scoped workspace persistence (one workspace per user per course).
// Registered before the "/:id" routes so the literal "course" segment wins.
projectsRouter.get("/course/:slug", getCourseProject);
projectsRouter.put("/course/:slug", saveCourseProject);

// Standalone, user-owned named projects (the Projects page).
projectsRouter.get("/", listProjects);
projectsRouter.post("/", createProject);
projectsRouter.get("/:id", getProject);
projectsRouter.put("/:id", updateProject);
projectsRouter.delete("/:id", deleteProject);
