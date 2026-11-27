import { Fragment, useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, ChevronRight, CircleCheck, Clock, Cpu, Lightbulb, ShieldAlert, SquarePen, TriangleAlert, Wrench } from "lucide-react";
import { DashboardHeader } from "@/pages/courses/ui/DashboardHeader";
import { APP_NAME } from "@/shared/config/brand";
import { useAuth } from "@/shared/auth/AuthContext";
import { BOARDS, BOARD_ORDER, useBoardStore, type BoardId } from "@/entities/board";
import { NODE_CATEGORIES } from "@/entities/node/model";
import { generateCode } from "@/entities/node/lib/codegen";
import { pinDefaults } from "@/entities/node/lib/blockDefaults";
import { builtinTutorials } from "@/features/editor/tutorial/lib/tutorials";
import { BOARD_LAYOUTS, pinForGpio, wiresFor } from "@/widgets/hardware-view/model/boardPins";
import { buildLaunchContext, EDITOR_MODE_PRESETS } from "@/entities/editor-launch/model/config";
import { useLaunchStore } from "@/shared/launch/launchStore";
import { useProjectStore } from "@/shared/launch/projectStore";
import { useGamification } from "@/entities/gamification";
import {
  CURRICULUM, LESSON_ORDER, findLesson, useLearnProgress, useReadingMode,
  type Block, type FlatBlock, type Lesson, type ModuleContent, type ModuleMeta, type Practice, type QuizItem,
} from "../model/curriculum";

// Lesson text is split per module so the Learn page stays light.
const CONTENT = import.meta.glob<{ default: ModuleContent }>("../content/*.ts");

const NODE_LABEL: Record<string, string> = Object.fromEntries(
  NODE_CATEGORIES.flatMap((c) => c.nodes.map((n) => [n.type, n.label]))
);

function useTitle(title: string) {
  useEffect(() => { document.title = `${title} · ${APP_NAME}`; }, [title]);
}

function useDone(): Set<string> {
  const { user } = useAuth();
  const done = useLearnProgress((s) => s.byUser[user?.id ?? "guest"]);
  return useMemo(() => new Set(done ?? []), [done]);
}

/** Inline marks: **bold** and `code`. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*|`[^`]+`)/).map((part, i) =>
        part.startsWith("**") ? <strong key={i} className="font-semibold text-body">{part.slice(2, -2)}</strong>
        : part.startsWith("`") ? <code key={i} className="rounded bg-hover px-1 py-0.5 font-mono text-[0.9em] text-body">{part.slice(1, -1)}</code>
        : <Fragment key={i}>{part}</Fragment>
      )}
    </>
  );
}

function BoardSelect() {
  const boardId = useBoardStore((s) => s.boardId);
  const setBoard = useBoardStore((s) => s.setBoard);
  return (
    <label className="flex items-center gap-2 text-sm font-semibold text-body">
      <Cpu className="h-4 w-4 text-sub" aria-hidden="true" />
      Board
      <select value={boardId} onChange={(e) => setBoard(e.target.value as BoardId)} className="select w-auto min-w-40 text-sm font-semibold">
        {BOARD_ORDER.map((id) => <option key={id} value={id}>{BOARDS[id].label}</option>)}
      </select>
    </label>
  );
}

// ── Curriculum overview ─────────────────────────────────────────────────────
function ModuleCard({ mod, number, done, grouped }: { mod: ModuleMeta; number: number; done: Set<string>; grouped?: boolean }) {
  const Title = grouped ? "h4" : "h3"; // keeps heading levels in order under a direction heading
  const lessons = mod.lessons ?? [];
  const finished = lessons.filter((l) => done.has(l.id)).length;
  const titles = useMemo(() => new Map(CURRICULUM.flatMap((t) => t.modules).map((m) => [m.id, m.title])), []);
  const projectTitle = useMemo(() => new Map(builtinTutorials("esp32").map((t) => [t.id, t.title])), []);
  return (
    <li className="rounded-lg border border-subtle bg-panel p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <Title className="text-lg font-semibold text-body">
          <span className="mr-2 font-mono text-sm text-sub" aria-hidden="true">{String(number).padStart(2, "0")}</span>
          {mod.title}
        </Title>
        <span className="text-[13px] font-semibold text-sub">
          {lessons.length === 0
            ? [!grouped && mod.track, mod.weeks && `about ${mod.weeks} weeks`].filter(Boolean).join(" · ") || "Outline"
            : finished === lessons.length ? "Completed" : `${finished} of ${lessons.length} lessons done`}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-sub">{mod.summary}</p>

      {lessons.length > 0 ? (
        <ol className="mt-4 divide-y divide-[var(--k-border)] border-y border-subtle">
          {lessons.map((l) => (
            <li key={l.id}>
              <Link to={`/learn/${l.id}`} className="flex min-h-11 items-center gap-3 py-2 text-sm text-body hover:text-primary-c">
                {done.has(l.id)
                  ? <CircleCheck className="h-4 w-4 shrink-0 text-success-c" aria-label="Completed" />
                  : <span className="h-4 w-4 shrink-0 rounded-full border border-[var(--k-border-strong)]" aria-hidden="true" />}
                <span className="flex-1 font-medium">{l.title}</span>
                <span className="shrink-0 text-xs text-sub">{l.minutes} min</span>
              </Link>
            </li>
          ))}
        </ol>
      ) : (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-sub">
          {mod.topics.map((t) => <li key={t}>{t}</li>)}
        </ul>
      )}

      <dl className="mt-4 space-y-1.5 text-[13px] leading-relaxed text-sub">
        <div><dt className="inline font-semibold text-body">You will be able to: </dt><dd className="inline">{mod.outcomes.join("; ")}.</dd></div>
        {(mod.projects?.length || mod.exitProject) && (
          <div>
            <dt className="inline font-semibold text-body">Project: </dt>
            <dd className="inline">{mod.projects?.map((p) => projectTitle.get(p) ?? p).join(", ") ?? mod.exitProject}</dd>
          </div>
        )}
        {mod.needs && (
          <div><dt className="inline font-semibold text-body">Do first: </dt><dd className="inline">{mod.needs.map((n) => titles.get(n) ?? n).join(", ")}</dd></div>
        )}
      </dl>
    </li>
  );
}

export function LearnPage() {
  useTitle("Study plan");
  const done = useDone();
  const next = LESSON_ORDER.find((l) => !done.has(l.id));
  return (
    <div className="h-full overflow-y-auto bg-page">
      <DashboardHeader />
      <main id="main" className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-4xl font-semibold text-body">Study plan</h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-sub">
          A three tier path through electronics, programming and the Internet of Things. Start at the top; each module lists what to finish first.
        </p>
        {next && (
          <Link to={`/learn/${next.id}`} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md bg-brand-gradient px-5 text-sm font-semibold text-on-primary hover:opacity-90">
            {done.size === 0 ? "Start the first lesson" : `Continue: ${next.title}`} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}

        {CURRICULUM.map((tier) => {
          let n = 0;
          return (
            <section key={tier.id} aria-labelledby={`tier-${tier.id}`} className="mt-12">
              <div className="border-b border-subtle pb-4">
                <h2 id={`tier-${tier.id}`} className="text-2xl font-semibold text-body">{tier.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-sub">{tier.blurb}</p>
                <p className="mt-2 text-sm leading-relaxed text-sub"><span className="font-semibold text-body">How you study it: </span>{tier.how}</p>
                {!tier.modules.some((m) => m.lessons?.length) && (
                  <p className="mt-2 text-[13px] font-semibold text-sub">Outline only for now. Lessons will open as they are written.</p>
                )}
              </div>
              {tier.tracks ? (
                <>
                  <p className="mt-5 text-sm leading-relaxed text-sub">
                    <span className="font-semibold text-body">Choose a direction. </span>
                    You do not have to take every module here. Pick the direction you want to work in; each module lists what to finish first.
                  </p>
                  {tier.tracks.map((track) => (
                    <div key={track.name} className="mt-8">
                      <h3 className="text-lg font-semibold text-body">{track.name}</h3>
                      <p className="mt-1 text-sm leading-relaxed text-sub">{track.blurb}</p>
                      <ol className="mt-4 space-y-4">
                        {tier.modules.filter((m) => m.track === track.name).map((mod) => <ModuleCard key={mod.id} mod={mod} number={++n} done={done} grouped />)}
                      </ol>
                    </div>
                  ))}
                </>
              ) : (
                <ol className="mt-5 space-y-4">
                  {tier.modules.map((mod) => <ModuleCard key={mod.id} mod={mod} number={++n} done={done} />)}
                </ol>
              )}
            </section>
          );
        })}
      </main>
    </div>
  );
}

// ── Lesson blocks ───────────────────────────────────────────────────────────
function useDemo(demoId: string) {
  const boardId = useBoardStore((s) => s.boardId);
  return { boardId, demo: builtinTutorials(boardId).find((t) => t.id === demoId) };
}

const NeedsBoard = () => (
  <p className="rounded-md border border-subtle bg-raised px-4 py-3 text-sm text-sub">
    Choose ESP32 DevKit or Arduino Uno in the Board menu above to see this for your board.
  </p>
);

function Wiring({ demoId }: { demoId: string }) {
  const { boardId, demo } = useDemo(demoId);
  const layout = BOARD_LAYOUTS[boardId];
  if (!demo || !layout) return <NeedsBoard />;
  const P = pinDefaults(boardId);
  const pinName = (gpio: number) => pinForGpio(layout, gpio)?.label ?? String(gpio);
  const rows = demo.nodes.flatMap((n) => {
    const type = n.type ?? "";
    const d = (n.data ?? {}) as Record<string, unknown>;
    const part = NODE_LABEL[type] ?? type;
    // Parts the hardware view has no drawing for still belong in a wiring table.
    if (type === "rfid_reader") {
      return ([["SDA / SS", d.ssPin ?? P.rfidSs], ["RST", d.rstPin ?? P.rfidRst], ["SCK", P.sck], ["MOSI", P.mosi], ["MISO", P.miso]] as const)
        .map(([role, gpio]) => ({ part, role, pin: pinName(Number(gpio)) }));
    }
    if (type === "gpio_pin" && typeof d.pin === "number") return [{ part: "Output on a plain pin", role: "Signal", pin: pinName(d.pin) }];
    return wiresFor(type, d, BOARDS[boardId]).map((w) => ({ part, role: w.label || "Signal", pin: pinName(w.gpio) }));
  });
  // The same part can appear in several blocks (LED on, LED off): list each wire once.
  const unique = rows.filter((r, i) => rows.findIndex((o) => o.part === r.part && o.role === r.role && o.pin === r.pin) === i);
  return (
    <figure>
      <div className="overflow-x-auto rounded-md border border-subtle">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Signal wiring on {BOARDS[boardId].label}</caption>
          <thead className="bg-raised text-[13px] text-sub">
            <tr><th scope="col" className="px-4 py-2 font-semibold">Part</th><th scope="col" className="px-4 py-2 font-semibold">Signal</th><th scope="col" className="px-4 py-2 font-semibold">{BOARDS[boardId].label} pin</th></tr>
          </thead>
          <tbody className="divide-y divide-[var(--k-border)] text-body">
            {unique.map((r, i) => (
              <tr key={i}><td className="px-4 py-2">{r.part}</td><td className="px-4 py-2">{r.role}</td><td className="px-4 py-2 font-mono font-semibold">{r.pin}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="mt-2 text-[13px] text-sub">Signal wires only, for {BOARDS[boardId].label}. Power, ground and resistors are described in the text.
        {boardId === "esp32" && " On an ESP32, nothing above 3.3 V may reach any pin."}</figcaption>
    </figure>
  );
}

function Code({ demoId }: { demoId: string }) {
  const { boardId, demo } = useDemo(demoId);
  if (!demo) return <NeedsBoard />;
  return (
    <figure>
      <pre tabIndex={0} className="overflow-x-auto rounded-md border border-subtle bg-raised p-4 font-mono text-[13px] leading-relaxed text-body">
        <code>{generateCode(demo.nodes, demo.edges)}</code>
      </pre>
      <figcaption className="mt-2 text-[13px] text-sub">
        {BOARDS[boardId].runtime === "arduino" ? "Arduino C++" : "MicroPython"} generated by the editor for {BOARDS[boardId].label}.
      </figcaption>
    </figure>
  );
}

const NOTE = {
  tip: { icon: Lightbulb, label: "Tip", cls: "border-subtle bg-raised" },
  warn: { icon: TriangleAlert, label: "Watch out", cls: "border-[var(--k-warning)] bg-warning-tint" },
  safety: { icon: ShieldAlert, label: "Safety", cls: "border-[var(--k-error)] bg-error-tint" },
} as const;

const LANG_LABEL = { c: "C", cpp: "C++", python: "Python", bash: "Shell", text: "Text", xml: "XML", yaml: "YAML" } as const;

/** Mode toggle: Normal folds the "Go deeper" sections, Detailed opens them. */
function ModeToggle() {
  const mode = useReadingMode((s) => s.mode);
  const setMode = useReadingMode((s) => s.setMode);
  return (
    <div role="group" aria-label="Reading mode" className="inline-flex rounded-md border border-subtle p-0.5 text-sm font-semibold">
      {(["normal", "detailed"] as const).map((m) => (
        <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}
          className={`min-h-10 rounded px-3 ${mode === m ? "bg-raised text-body shadow-sm" : "text-sub hover:text-body"}`}>
          {m === "normal" ? "Normal" : "Detailed"}
        </button>
      ))}
    </div>
  );
}

function Deep({ title, blocks }: { title: string; blocks: FlatBlock[] }) {
  const mode = useReadingMode((s) => s.mode);
  const [open, setOpen] = useState(mode === "detailed");
  useEffect(() => { setOpen(mode === "detailed"); }, [mode]);
  return (
    <details open={open} onToggle={(e) => setOpen(e.currentTarget.open)} className="group rounded-md border border-[var(--k-border-strong)] bg-panel">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 py-2 font-semibold text-body [&::-webkit-details-marker]:hidden">
        <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-open:rotate-90" aria-hidden="true" />
        <span className="text-[13px] uppercase tracking-wide text-sub">Go deeper</span>
        <span>{title}</span>
      </summary>
      <div className="space-y-4 border-t border-subtle px-4 py-4">{blocks.map((b, i) => <BlockView key={i} block={b} />)}</div>
    </details>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.t) {
    case "deep": return <Deep title={block.title} blocks={block.blocks} />;
    case "snippet":
      return (
        <figure>
          <div className="overflow-hidden rounded-md border border-subtle">
            <div className="border-b border-subtle bg-hover px-4 py-1 text-[12px] font-semibold text-sub">{LANG_LABEL[block.lang]}</div>
            <pre tabIndex={0} className="overflow-x-auto bg-raised p-4 font-mono text-[13px] leading-relaxed text-body"><code>{block.code}</code></pre>
          </div>
          {block.caption && <figcaption className="mt-2 text-[13px] text-sub"><Rich text={block.caption} /></figcaption>}
        </figure>
      );
    case "diagram":
      return (
        <figure>
          <pre tabIndex={0} role="img" aria-label={block.caption ?? "Diagram"} className="overflow-x-auto rounded-md border border-subtle bg-raised p-4 font-mono text-[13px] leading-[1.15] text-body">{block.text}</pre>
          {block.caption && <figcaption className="mt-2 text-[13px] text-sub"><Rich text={block.caption} /></figcaption>}
        </figure>
      );
    case "h": return <h2 className="pt-4 text-xl font-semibold text-body">{block.text}</h2>;
    case "p": return <p><Rich text={block.text} /></p>;
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return (
        <List className={`${block.ordered ? "list-decimal" : "list-disc"} space-y-1.5 pl-6`}>
          {block.items.map((it, i) => <li key={i}><Rich text={it} /></li>)}
        </List>
      );
    }
    case "note": {
      const n = NOTE[block.kind];
      return (
        <aside className={`flex gap-3 rounded-md border px-4 py-3 ${n.cls}`}>
          <n.icon className="mt-0.5 h-5 w-5 shrink-0 text-body" aria-hidden="true" />
          <p className="text-body"><strong className="font-semibold">{n.label}: </strong><Rich text={block.text} /></p>
        </aside>
      );
    }
    case "formula":
      return (
        <figure className="rounded-md border border-subtle bg-raised px-4 py-3 text-center">
          {/* Multi-line derivations keep their line breaks and alignment. */}
          <pre className="inline-block whitespace-pre-wrap text-left font-mono text-base font-semibold leading-relaxed text-body">{block.text}</pre>
          {block.caption && <figcaption className="mt-1 text-[13px] text-sub"><Rich text={block.caption} /></figcaption>}
        </figure>
      );
    case "table":
      return (
        <figure>
          <div className="overflow-x-auto rounded-md border border-subtle">
            <table className="w-full text-left text-sm">
              <thead className="bg-raised text-[13px] text-sub">
                <tr>{block.head.map((h) => <th key={h} scope="col" className="px-4 py-2 font-semibold">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-[var(--k-border)] text-body">
                {block.rows.map((row, i) => <tr key={i}>{row.map((c, j) => <td key={j} className="px-4 py-2"><Rich text={c} /></td>)}</tr>)}
              </tbody>
            </table>
          </div>
          {block.caption && <figcaption className="mt-2 text-[13px] text-sub">{block.caption}</figcaption>}
        </figure>
      );
    case "wiring": return <Wiring demoId={block.demo} />;
    case "code": return <Code demoId={block.demo} />;
  }
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10 border-t border-subtle pt-6">
      <h2 className="text-xl font-semibold text-body">{title}</h2>
      <div className="mt-3 space-y-4">{children}</div>
    </section>
  );
}

function PracticeCard({ practice }: { practice: Practice }) {
  const navigate = useNavigate();
  const setLaunchContext = useLaunchStore((s) => s.setContext);
  const openEditor = (demo?: string) => {
    if (demo) sessionStorage.setItem("codelab-open-demo", demo); // picked up by the editor
    useProjectStore.getState().clearActiveProject();
    setLaunchContext(buildLaunchContext(EDITOR_MODE_PRESETS.find((p) => p.id === "full-workshop") ?? EDITOR_MODE_PRESETS[0]));
    navigate("/editor");
  };
  return (
    <>
      <p><Rich text={practice.task} /></p>
      {practice.kind !== "project" && (
        <ol className="list-decimal space-y-1.5 pl-6">{practice.steps.map((s, i) => <li key={i}><Rich text={s} /></li>)}</ol>
      )}
      {practice.kind === "bench" ? (
        <p className="flex items-center gap-2 text-[13px] font-semibold text-sub"><Wrench className="h-4 w-4" aria-hidden="true" /> Bench task: no editor needed.</p>
      ) : (
        <button onClick={() => openEditor(practice.kind === "project" ? practice.demo : undefined)}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-[var(--k-border-strong)] bg-panel px-5 text-sm font-semibold text-body hover:bg-hover">
          <SquarePen className="h-4 w-4" aria-hidden="true" /> {practice.kind === "project" ? "Open this project in the editor" : "Open the editor"}
        </button>
      )}
    </>
  );
}

function Quiz({ items, onAllCorrect }: { items: QuizItem[]; onAllCorrect: () => void }) {
  const uid = useId();
  const [picked, setPicked] = useState<Record<number, number>>({});
  const allCorrect = items.every((it, i) => picked[i] === it.answer);
  useEffect(() => { if (allCorrect) onAllCorrect(); }, [allCorrect, onAllCorrect]);
  return (
    <ol className="space-y-6">
      {items.map((it, i) => {
        const choice = picked[i];
        const right = choice === it.answer;
        return (
          <li key={i}>
            <fieldset>
              <legend className="font-semibold text-body">{i + 1}. <Rich text={it.q} /></legend>
              <div className="mt-2 space-y-1.5">
                {it.options.map((opt, j) => (
                  <label key={j} className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm text-body ${choice === j ? "border-[var(--k-primary-text)] bg-raised" : "border-subtle hover:bg-hover"}`}>
                    <input type="radio" name={`${uid}-${i}`} checked={choice === j} onChange={() => setPicked((p) => ({ ...p, [i]: j }))} className="radio radio-sm" />
                    <span><Rich text={opt} /></span>
                  </label>
                ))}
              </div>
              <p role="status" className="mt-2 min-h-5 text-sm">
                {choice !== undefined && (right
                  ? <span className="text-body"><strong className="font-semibold text-success-c">Correct. </strong><Rich text={it.why} /></span>
                  : <span className="font-semibold text-error-c">Not quite. Read the question again and try another answer.</span>)}
              </p>
            </fieldset>
          </li>
        );
      })}
    </ol>
  );
}

// ── Lesson page ─────────────────────────────────────────────────────────────
export function LessonPage() {
  const { lessonId = "" } = useParams();
  const found = findLesson(lessonId);
  const { user } = useAuth();
  const userId = user?.id ?? "guest";
  const done = useDone();
  const complete = useLearnProgress((s) => s.complete);
  const award = useGamification((s) => s.award);
  const [lesson, setLesson] = useState<Lesson | null | "missing">(null);
  const [quizPassed, setQuizPassed] = useState(false);
  useTitle(found?.meta.title ?? "Lesson");

  useEffect(() => {
    setLesson(null);
    setQuizPassed(false);
    const load = found && CONTENT[`../content/${found.mod.id}.ts`];
    if (!load) { setLesson("missing"); return; }
    let cancelled = false;
    load().then((m) => { if (!cancelled) setLesson(m.default[lessonId] ?? "missing"); })
      .catch(() => { if (!cancelled) setLesson("missing"); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when the lesson changes
  }, [lessonId]);

  const order = LESSON_ORDER.findIndex((l) => l.id === lessonId);
  const prev = LESSON_ORDER[order - 1];
  const next = LESSON_ORDER[order + 1];
  const isDone = done.has(lessonId);

  const finish = () => {
    if (isDone) return;
    complete(userId, lessonId);
    award("lessonComplete", "Lesson completed");
  };

  return (
    <div className="h-full overflow-y-auto bg-page">
      <DashboardHeader />
      <main id="main" className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link to="/learn" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-sub hover:text-body">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Study plan
        </Link>

        {!found || lesson === "missing" ? (
          <p className="mt-6 text-body">This lesson is not available yet. Go back to the study plan to pick another.</p>
        ) : (
          <article>
            <p className="mt-4 text-[13px] font-semibold text-sub">{found.tier.title} · {found.mod.title} · Lesson {found.index + 1} of {found.mod.lessons!.length}</p>
            <h1 className="mt-1 font-display text-3xl font-semibold text-body sm:text-4xl">{found.meta.title}</h1>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-subtle pb-4">
              <span className="flex items-center gap-1.5 text-sm text-sub"><Clock className="h-4 w-4" aria-hidden="true" /> About {found.meta.minutes} minutes</span>
              <div className="flex flex-wrap items-center gap-3">
                {lesson?.blocks.some((b) => b.t === "deep") && <ModeToggle />}
                {lesson && (lesson.practice?.kind === "project" || /"t":"(wiring|code)"/.test(JSON.stringify(lesson.blocks))) && <BoardSelect />}
              </div>
            </div>

            {lesson === null ? (
              <p role="status" className="mt-6 text-sub">Loading lesson...</p>
            ) : (
              <div className="text-[15px] leading-relaxed text-sub">
                <div className="mt-6 rounded-md border border-subtle bg-panel px-5 py-4">
                  <h2 className="text-sm font-semibold text-body">After this lesson you can</h2>
                  <ul className="mt-2 space-y-1.5">
                    {lesson.outcomes.map((o) => (
                      <li key={o} className="flex gap-2"><Check className="mt-1 h-4 w-4 shrink-0 text-success-c" aria-hidden="true" /><span>{o}</span></li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 space-y-4">{lesson.blocks.map((b, i) => <BlockView key={i} block={b} />)}</div>

                {lesson.mistakes && lesson.mistakes.length > 0 && (
                  <Section title="Common mistakes">
                    <ul className="list-disc space-y-1.5 pl-6">{lesson.mistakes.map((m, i) => <li key={i}><Rich text={m} /></li>)}</ul>
                  </Section>
                )}

                {lesson.practice && <Section title="Practice"><PracticeCard practice={lesson.practice} /></Section>}

                <Section title="Check your understanding">
                  <Quiz key={lessonId} items={lesson.quiz} onAllCorrect={() => setQuizPassed(true)} />
                </Section>

                <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-subtle pt-6">
                  {isDone ? (
                    <p className="flex items-center gap-2 font-semibold text-body"><CircleCheck className="h-5 w-5 text-success-c" aria-hidden="true" /> Lesson completed</p>
                  ) : (
                    <button onClick={finish} disabled={!quizPassed}
                      className="min-h-11 rounded-md bg-brand-gradient px-5 text-sm font-semibold text-on-primary hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                      {quizPassed ? "Mark lesson complete" : "Answer every question correctly to finish"}
                    </button>
                  )}
                </div>
              </div>
            )}

            <nav aria-label="Lessons" className="mt-8 flex flex-wrap justify-between gap-3 text-sm font-semibold">
              {prev ? <Link to={`/learn/${prev.id}`} className="inline-flex min-h-11 items-center gap-1.5 text-sub hover:text-body"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> {prev.title}</Link> : <span />}
              {next && <Link to={`/learn/${next.id}`} className="inline-flex min-h-11 items-center gap-1.5 text-primary-c">{next.title} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
            </nav>
          </article>
        )}
      </main>
    </div>
  );
}
