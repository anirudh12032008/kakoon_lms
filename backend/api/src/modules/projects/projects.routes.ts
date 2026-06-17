import { Router } from "express";
import { optionalAuth, requireAuth } from "../../middleware/auth";
import {
  getCourseProject, saveCourseProject,
  listProjects, getProject, createProject, updateProject, deleteProject,
  getSharedProject,
} from "./projects.controller";

export const projectsRouter = Router();

// Public, read-only share link — registered BEFORE requireAuth so anyone can
// open it. optionalAuth still lets the author be recognized for edit access.
projectsRouter.get("/shared/:slug", optionalAuth, getSharedProject);

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
