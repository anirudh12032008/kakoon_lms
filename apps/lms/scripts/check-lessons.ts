// Runnable check for the study plan: every listed lesson exists, ids line up,
// quizzes are well formed, and every referenced project exists on both boards.
//   TSX_TSCONFIG_PATH=tsconfig.app.json node --import ../../backend/api/node_modules/tsx/dist/esm/index.mjs scripts/check-lessons.ts [metaDir]
// metaDir (optional): a folder of <moduleId>.json lesson lists ([{ id, title, minutes }])
// for modules whose lessons are written but not yet listed in curriculum.ts.
import assert from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { CURRICULUM, type FlatBlock, type LessonMeta, type ModuleContent } from "@/pages/learn/model/curriculum";
import { builtinTutorials } from "@/features/editor/tutorial/lib/tutorials";

const metaDir = process.argv[2];
const demoIds = (b: "esp32" | "arduino_uno") => new Set(builtinTutorials(b).map((t) => t.id));
const demos = { esp32: demoIds("esp32"), arduino_uno: demoIds("arduino_uno") };
const hasDemo = (id: string) => demos.esp32.has(id) && demos.arduino_uno.has(id);
const words = (v: unknown) => JSON.stringify(v).split(/\s+/).length;

const moduleIds = new Set(CURRICULUM.flatMap((t) => t.modules.map((m) => m.id)));
const seen = new Set<string>();
let lessons = 0, total = 0, deep = 0;

for (const tier of CURRICULUM) for (const mod of tier.modules) {
  for (const need of mod.needs ?? []) assert(moduleIds.has(need), `${mod.id}: unknown prerequisite ${need}`);
  for (const p of mod.projects ?? []) assert(hasDemo(p), `${mod.id}: unknown project ${p}`);
  let list: LessonMeta[] | undefined = mod.lessons;
  if (metaDir && existsSync(`${metaDir}/${mod.id}.json`)) list = JSON.parse(readFileSync(`${metaDir}/${mod.id}.json`, "utf8"));
  if (!list?.length) continue;
  const concept = tier.id !== "beginner";

  const file = `src/pages/learn/content/${mod.id}.ts`;
  const content: ModuleContent = (await import(`../${file}`)).default;
  // Board-specific numbers belong in generated blocks, and house style has no long dashes.
  assert(!/[–—]/.test(readFileSync(file, "utf8")), `${file}: contains an en or em dash`);

  for (const meta of list) {
    assert(meta.title?.trim() && meta.minutes > 0, `${meta.id}: lesson list entry needs a title and minutes`);
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
    const deepBlocks = l.blocks.filter((b) => b.t === "deep");
    const flat: FlatBlock[] = l.blocks.flatMap((b) => {
      if (b.t !== "deep") return [b];
      assert(b.title.trim() && b.blocks.length >= 2, `${meta.id}: "Go deeper" section "${b.title}" is empty`);
      return b.blocks;
    });
    for (const b of flat) {
      if (b.t === "wiring" || b.t === "code") assert(hasDemo(b.demo), `${meta.id}: unknown project ${b.demo}`);
      if (b.t === "snippet") assert(b.code.trim(), `${meta.id}: empty code snippet`);
      if (b.t === "widget") assert(existsSync(`src/pages/learn/widgets/${b.id}.tsx`) && b.id !== "kit", `${meta.id}: unknown widget ${b.id}`);
      if (b.t === "table") for (const row of b.rows) assert.equal(row.length, b.head.length, `${meta.id}: table row width differs from its header`);
    }
    if (concept) {
      // Concept tiers: Normal mode must carry a real lesson, and Detailed must add something.
      const normal = words(l.blocks.filter((b) => b.t !== "deep"));
      assert(normal >= 900, `${meta.id}: Normal mode text is thin (${normal} words, want 900+)`);
      assert(deepBlocks.length >= 1, `${meta.id}: needs at least one "Go deeper" section`);
      assert(l.quiz.length >= 4, `${meta.id}: needs at least 4 quiz questions`);
    }
    if (l.practice?.kind === "project") assert(hasDemo(l.practice.demo), `${meta.id}: unknown practice project`);
    deep += deepBlocks.length;
    lessons++;
    total += words(l.blocks);
  }
  for (const key of Object.keys(content)) assert(list.some((m) => m.id === key), `${file}: ${key} is not in the curriculum`);
}
console.log(`ok study plan: ${lessons} lessons, ${deep} "Go deeper" sections, about ${total} words of lesson text`);
