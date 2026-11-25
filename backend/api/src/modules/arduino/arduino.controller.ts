import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { Request, Response } from "express";
import { ApiError } from "../../utils/ApiError";
import { asyncHandler } from "../../utils/asyncHandler";

const run = promisify(execFile);

// The compiler runs on the API host, so a sketch must not be able to pull server
// files into its output or error text. Only plain library-style includes pass.
// ponytail: text filter, not a sandbox. Run arduino-cli in a container or as an
// unprivileged user with no access to the app directory before opening this up.
function hasUnsafeInclude(code: string): boolean {
  const src = code.replace(/\r/g, "").replace(/\\[ \t]*\n/g, ""); // CRLF, then undo line continuations
  if (/\?\?[=/]|\.incbin|#\s*embed|__has_include/.test(src)) return true;
  // A comment glued to the directive marker hides it from the per-line check below.
  if (/\*\/[ \t]*(#|%:)|^[ \t]*(#|%:)[ \t]*\/\*/m.test(src)) return true;
  for (const line of src.split("\n")) {
    // "%:" is the digraph for "#"; only a directive at line start counts, so text
    // like Serial.print("Humidity %: ") is fine.
    const m = line.match(/^\s*(?:#|%:)\s*(include|include_next|import)\b(.*)$/);
    if (!m) continue;
    const target = m[2].trim().match(/^[<"]([\w.\-/]+)[>"]/);
    if (!target || target[1].startsWith("/") || target[1].includes("..")) return true;
  }
  return false;
}

export const compile = asyncHandler(async (req: Request, res: Response) => {
  const { code, fqbn } = req.body as { code: string; fqbn: string };
  if (hasUnsafeInclude(code)) throw ApiError.badRequest("Only standard library #include lines are allowed");
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "ino-"));
  try {
    await fs.mkdir(path.join(dir, "sketch"));
    await fs.writeFile(path.join(dir, "sketch", "sketch.ino"), code);
    await run(
      process.env.ARDUINO_CLI || "arduino-cli",
      ["compile", "--fqbn", fqbn, "--output-dir", path.join(dir, "out"), path.join(dir, "sketch")],
      { timeout: 60_000, maxBuffer: 1024 * 1024 }
    );
    const hex = await fs.readFile(path.join(dir, "out", "sketch.ino.hex"), "utf8");
    res.json({ hex });
  } catch (e) {
    const err = e as NodeJS.ErrnoException & { stderr?: string; killed?: boolean };
    if (err.code === "ENOENT" && !err.stderr) {
      throw new ApiError(503, "Arduino compiler is not installed on the server");
    }
    if (err.killed) throw ApiError.badRequest("Compilation timed out");
    const msg = (err.stderr || err.message || "Compilation failed").split(dir).join("sketch");
    throw ApiError.badRequest(msg.trim());
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
