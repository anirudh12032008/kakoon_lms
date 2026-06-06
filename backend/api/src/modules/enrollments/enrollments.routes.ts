import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { myEnrollments, enroll, openCourseEditor } from "./enrollments.controller";

export const enrollmentsRouter = Router();

// All enrollment routes require authentication.
enrollmentsRouter.use(requireAuth);

enrollmentsRouter.get("/", myEnrollments);
enrollmentsRouter.post("/:slug", enroll);
enrollmentsRouter.post("/:slug/open", openCourseEditor);
