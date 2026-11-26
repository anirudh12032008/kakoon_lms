// Runnable check for the study plan: every listed lesson exists, ids line up,
// quizzes are well formed, and every referenced project exists on both boards.
//   TSX_TSCONFIG_PATH=tsconfig.app.json node --import ../../backend/api/node_modules/tsx/dist/esm/index.mjs scripts/check-lessons.ts
import assert from "node:assert";
import { readFileSync } from "node:fs";
import { CURRICULUM, type ModuleContent } from "@/pages/learn/model/curriculum";
import { builtinTutorials } from "@/features/editor/tutorial/lib/tutorials";

const demoIds = (b: "esp32" | "arduino_uno") => new Set(builtinTutorials(b).map((t) => t.id));
const demos = { esp32: demoIds("esp32"), arduino_uno: demoIds("arduino_uno") };
const hasDemo = (id: string) => demos.esp32.has(id) && demos.arduino_uno.has(id);

const moduleIds = new Set(CURRICULUM.flatMap((t) => t.modules.map((m) => m.id)));
const seen = new Set<string>();
let lessons = 0, words = 0;

for (const tier of CURRICULUM) for (const mod of tier.modules) {
  for (const need of mod.needs ?? []) assert(moduleIds.has(need), `${mod.id}: unknown prerequisite ${need}`);
  for (const p of mod.projects ?? []) assert(hasDemo(p), `${mod.id}: unknown project ${p}`);
  if (!mod.lessons?.length) continue;

  const file = `src/pages/learn/content/${mod.id}.ts`;
  const content: ModuleContent = (await import(`../${file}`)).default;
  // Board-specific numbers belong in generated blocks, and house style has no long dashes.
  assert(!/[–—]/.test(readFileSync(file, "utf8")), `${file}: contains an en or em dash`);

  for (const meta of mod.lessons) {
    assert(!seen.has(meta.id), `duplicate lesson id ${meta.id}`);
    seen.add(meta.id);
    const l = content[meta.id];
    assert(l, `${meta.id}: listed in the curriculum but missing from ${file}`);
    assert.equal(l.id, meta.id, `${meta.id}: id field does not match its key`);
    assert(l.outcomes.length >= 2, `${meta.id}: needs outcomes`);
    assert(l.blocks.length >= 6, `${meta.id}: too short`);
    assert(l.quiz.length >= 3, `${meta.id}: needs at least 3 quiz questions`);
    for (const q of l.quiz) {
      assert(q.options.length >= 3, `${meta.id}: "${q.q}" needs options`);
      assert(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length, `${meta.id}: "${q.q}" answer out of range`);
      assert(q.why.trim(), `${meta.id}: "${q.q}" needs an explanation`);
    }
    for (const b of l.blocks) if (b.t === "wiring" || b.t === "code") assert(hasDemo(b.demo), `${meta.id}: unknown project ${b.demo}`);
    if (l.practice?.kind === "project") assert(hasDemo(l.practice.demo), `${meta.id}: unknown practice project`);
    lessons++;
    words += JSON.stringify(l.blocks).split(/\s+/).length;
  }
  for (const key of Object.keys(content)) assert(mod.lessons.some((m) => m.id === key), `${file}: ${key} is not in the curriculum`);
}
console.log(`ok study plan: ${lessons} lessons, about ${words} words of lesson text`);
