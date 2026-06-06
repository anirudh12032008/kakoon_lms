import { Router } from "express";
import { listCourses, getCourse } from "./courses.controller";

export const coursesRouter = Router();

// Public catalogue (enrollment flag is added when a valid token is present).
coursesRouter.get("/", listCourses);
coursesRouter.get("/:slug", getCourse);
