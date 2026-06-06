import type { Request, Response, NextFunction } from "express";
import type { ZodTypeAny } from "zod";
import { ApiError } from "../utils/ApiError";

/** Validates req.body against a Zod schema, replacing it with the parsed value. */
export const validateBody =
  (schema: ZodTypeAny) => (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return next(
        ApiError.badRequest(
          "Validation failed",
          result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }))
        )
      );
    }
    req.body = result.data;
    next();
  };
