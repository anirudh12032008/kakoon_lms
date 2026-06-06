import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { getCourseProject, saveCourseProject } from "./projects.controller";

export const projectsRouter = Router();

projectsRouter.use(requireAuth);

// Course-scoped workspace persistence (one workspace per user per course).
projectsRouter.get("/course/:slug", getCourseProject);
projectsRouter.put("/course/:slug", saveCourseProject);
