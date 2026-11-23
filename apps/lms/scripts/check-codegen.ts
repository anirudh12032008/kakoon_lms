// Runnable check: every built-in demo must generate code on every board, with
// no "not available" / "Unknown node" markers (college demos). Prints the Arduino sketches so
// they can be compiled with arduino-cli.
//   TSX_TSCONFIG_PATH=tsconfig.app.json node --import ../../backend/api/node_modules/tsx/dist/esm/index.mjs scripts/check-codegen.ts [outDir]
import assert from "node:assert";
import { writeFileSync, mkdirSync } from "node:fs";
import { BOARD_ORDER, useBoardStore } from "@/entities/board";
import { generateCode } from "@/entities/node/lib/codegen";
import { builtinTutorials } from "@/features/editor/tutorial/lib/tutorials";

const out = process.argv[2];
for (const boardId of BOARD_ORDER) {
  useBoardStore.getState().setBoard(boardId);
  const demos = builtinTutorials(boardId);
  assert(demos.length >= 4, `${boardId}: expected at least 4 built-in examples`);
  for (const t of demos) {
    const code = generateCode(t.nodes, t.edges);
    if (boardId === "kokoon") continue; // original robot set, left untouched
    assert(!/not available|Unknown node/.test(code), `${boardId}/${t.id} has an unsupported block:\n${code}`);
    assert(!code.includes("neopixel"), `${boardId}/${t.id} touches the Kokoon NeoPixel`);
    if (out) {
      const ino = boardId === "arduino_uno";
      const dir = ino ? `${out}/${t.id}` : out;
      mkdirSync(dir, { recursive: true });
      writeFileSync(ino ? `${dir}/${t.id}.ino` : `${dir}/${boardId}-${t.id}.py`, code);
    }
  }
  console.log(`ok ${boardId}: ${demos.map((t) => t.id).join(", ")}`);
}
