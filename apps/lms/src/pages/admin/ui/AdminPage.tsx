import { useState, useMemo } from "react";
import { generateStepsFromFlow, type Tutorial } from "@/features/editor/tutorial/lib/tutorials";
import type { Node, Edge } from "@xyflow/react";

const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SECRET as string | undefined;
const CUSTOM_KEY   = "Kokoon-custom-tutorials";

const NODE_TYPES = [
  "forever_loop","ble_mode","dc_motor_single","servo_motor","servo_motor_advance",
  "neopixel_led","neopixel_rgb","oled_display","lcd_16x2",
  "push_button","ir_receiver","ultrasonic_sensor","soil_moisture","ir_sensor",
  "touch_sensor","variable","variable_state","sleep","print",
  "if_else","map_range","pwm","adc","gpio_pin","pin_write","pin_read",
  "buzzer_tone","multi_motor_controller",
].sort();

type Difficulty = "Easy" | "Medium" | "Hard";

interface NodeRow  { id: string; type: string; x: string; y: string; dataJson: string }
interface EdgeRow  { id: string; source: string; target: string; handle: string }

// ─── helpers ─────────────────────────────────────────────────────────────────

function safe<T>(json: string, fallback: T): T {
  try { return JSON.parse(json) as T; } catch { return fallback; }
}

function buildNodes(rows: NodeRow[]): Node[] {
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    position: { x: Number(r.x) || 0, y: Number(r.y) || 0 },
    data: safe(r.dataJson, {}),
  }));
}

function buildEdges(rows: EdgeRow[]): Edge[] {
  return rows.map((r) => ({
    id: r.id,
    source: r.source,
    target: r.target,
    ...(r.handle ? { sourceHandle: r.handle } : {}),
  }));
}

function uid() { return `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`; }
function euid() { return `e_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`; }

// ─── Login screen ─────────────────────────────────────────────────────────────

function LoginScreen({ onAuth }: { onAuth: () => void }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  function attempt() {
    if (!ADMIN_SECRET) {
      setError(true);
      return;
    }
    if (input === ADMIN_SECRET) {
      onAuth();
    } else {
      setError(true);
      setInput("");
    }
  }

  return (
    <div className="fixed inset-0 bg-[#08080a] flex items-center justify-center">
      <div className="w-full max-w-sm mx-4 rounded-2xl border border-zinc-800 bg-[#0f0f12] p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-lg">🔐</div>
          <div>
            <p className="text-sm font-bold text-white">Admin Access</p>
            <p className="text-xs text-zinc-500">Kokoon Tutorial Builder</p>
          </div>
        </div>

        <label className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">Admin Secret</label>
        <input
          type="password"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(false); }}
          onKeyDown={(e) => e.key === "Enter" && attempt()}
          placeholder="Enter secret…"
          className="w-full bg-[#0a0a0d] border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-zinc-600 outline-none focus:border-violet-500 transition-colors mb-2"
        />
        {error && (
          <p className="text-xs text-red-400 mb-3">
            {!ADMIN_SECRET ? "VITE_ADMIN_SECRET is not set in .env.local" : "Incorrect secret."}
          </p>
        )}

        <button
          onClick={attempt}
          className="w-full mt-2 bg-violet-600 hover:bg-violet-500 transition-colors text-white text-sm font-semibold py-2.5 rounded-lg"
        >
          Unlock
        </button>
      </div>
    </div>
  );
}

// ─── Node builder row ─────────────────────────────────────────────────────────

function NodeRowEditor({ row, onChange, onRemove }: {
  row: NodeRow; onChange: (r: NodeRow) => void; onRemove: () => void;
}) {
  const jsonValid = useMemo(() => { try { JSON.parse(row.dataJson); return true; } catch { return false; } }, [row.dataJson]);

  return (
    <div className="grid grid-cols-[1fr_1.4fr_56px_56px_1.6fr_32px] gap-1.5 items-start">
      <input value={row.id} onChange={(e) => onChange({ ...row, id: e.target.value })}
        className="input-sm font-mono" placeholder="node-id" />
      <select value={row.type} onChange={(e) => onChange({ ...row, type: e.target.value })}
        className="input-sm">
        {NODE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <input value={row.x} onChange={(e) => onChange({ ...row, x: e.target.value })}
        className="input-sm text-right" placeholder="X" type="number" />
      <input value={row.y} onChange={(e) => onChange({ ...row, y: e.target.value })}
        className="input-sm text-right" placeholder="Y" type="number" />
      <textarea value={row.dataJson} onChange={(e) => onChange({ ...row, dataJson: e.target.value })}
        rows={1}
        className={`input-sm font-mono text-[10px] resize-none ${!jsonValid ? "border-red-600/60" : ""}`}
        placeholder='{"key":"val"}' />
      <button onClick={onRemove} className="text-zinc-600 hover:text-red-400 text-lg leading-none mt-1.5">×</button>
    </div>
  );
}

// ─── Edge builder row ─────────────────────────────────────────────────────────

function EdgeRowEditor({ row, onChange, onRemove }: {
  row: EdgeRow; onChange: (r: EdgeRow) => void; onRemove: () => void
}) {
  return (
    <div className="grid grid-cols-[1fr_1fr_1fr_1fr_32px] gap-1.5 items-center">
      <input value={row.id} onChange={(e) => onChange({ ...row, id: e.target.value })}
        className="input-sm font-mono" placeholder="edge-id" />
      <input value={row.source} onChange={(e) => onChange({ ...row, source: e.target.value })}
        className="input-sm font-mono" placeholder="source node id" />
      <input value={row.target} onChange={(e) => onChange({ ...row, target: e.target.value })}
        className="input-sm font-mono" placeholder="target node id" />
      <input value={row.handle} onChange={(e) => onChange({ ...row, handle: e.target.value })}
        className="input-sm font-mono" placeholder='sourceHandle (opt)' />
      <button onClick={onRemove} className="text-zinc-600 hover:text-red-400 text-lg leading-none">×</button>
    </div>
  );
}

// ─── Main admin builder ───────────────────────────────────────────────────────

function TutorialBuilder({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<"build" | "list">("build");

  // metadata
  const [title, setTitle]             = useState("");
  const [desc, setDesc]               = useState("");
  const [difficulty, setDifficulty]   = useState<Difficulty>("Medium");
  const [components, setComponents]   = useState("");

  // nodes / edges rows
  const [nodeRows, setNodeRows] = useState<NodeRow[]>([
    { id: uid(), type: "forever_loop", x: "60", y: "0", dataJson: "{}" },
    { id: uid(), type: "ble_mode",     x: "320", y: "0", dataJson: '{"deviceName":"MyBot","rawVarName":"cmd","enableCmdMap":true,"cmdMap":[{"trigger":"F","varName":"","value":""}],"enableTx":false}' },
  ]);
  const [edgeRows, setEdgeRows] = useState<EdgeRow[]>([]);

  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState("");
  const [showJson, setShowJson] = useState(false);

  // derived
  const nodes = useMemo(() => buildNodes(nodeRows), [nodeRows]);
  const edges  = useMemo(() => buildEdges(edgeRows),  [edgeRows]);
  const steps  = useMemo(() => generateStepsFromFlow(nodes, edges), [nodes, edges]);

  function addNode() {
    setNodeRows((r) => [...r, { id: uid(), type: "dc_motor_single", x: "640", y: String(r.length * 180), dataJson: "{}" }]);
  }

  function addEdge() {
    const last = nodeRows[nodeRows.length - 1];
    const prev = nodeRows[nodeRows.length - 2];
    setEdgeRows((r) => [...r, {
      id: euid(),
      source: prev?.id ?? "",
      target: last?.id ?? "",
      handle: "",
    }]);
  }

  function saveTutorial() {
    if (!title.trim()) { setError("Title is required."); return; }
    if (nodeRows.length === 0) { setError("Add at least one node."); return; }

    const hasJsonErrors = nodeRows.some((r) => { try { JSON.parse(r.dataJson); return false; } catch { return true; } });
    if (hasJsonErrors) { setError("One or more node data fields contain invalid JSON."); return; }

    const tutorial: Tutorial = {
      id: `custom_${Date.now()}`,
      title: title.trim(),
      description: desc.trim() || "Custom Kokoon tutorial.",
      difficulty,
      board: "Quark C3",
      components: components.split(",").map((s) => s.trim()).filter(Boolean),
      nodes,
      edges,
      steps,
    };

    try {
      const stored = localStorage.getItem(CUSTOM_KEY);
      const existing: Tutorial[] = stored ? JSON.parse(stored) : [];
      localStorage.setItem(CUSTOM_KEY, JSON.stringify([...existing, tutorial]));
      setSaved(true);
      setError("");
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Failed to save to localStorage.");
    }
  }

  const jsonExport = useMemo(() => JSON.stringify({
    id: `custom_${Date.now()}`,
    title, description: desc, difficulty, board: "Quark C3",
    components: components.split(",").map((s) => s.trim()).filter(Boolean),
    nodes, edges, steps,
  }, null, 2), [title, desc, difficulty, components, nodes, edges, steps]);

  // custom tutorial list
  const [customList, setCustomList] = useState<Tutorial[]>(() => {
    try { return JSON.parse(localStorage.getItem(CUSTOM_KEY) || "[]"); } catch { return []; }
  });

  function deleteCustom(id: string) {
    const updated = customList.filter((t) => t.id !== id);
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(updated));
    setCustomList(updated);
  }

  function loadIntoBuilder(t: Tutorial) {
    setTitle(t.title);
    setDesc(t.description);
    setDifficulty(t.difficulty);
    setComponents(t.components.join(", "));
    setNodeRows(t.nodes.map((n) => ({
      id: n.id,
      type: n.type || "forever_loop",
      x: String(n.position.x),
      y: String(n.position.y),
      dataJson: JSON.stringify(n.data || {}),
    })));
    setEdgeRows(t.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      handle: (e as any).sourceHandle || "",
    })));
    setTab("build");
  }

  return (
    <div className="fixed inset-0 bg-[#08080a] text-zinc-100 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-zinc-800/60 shrink-0">
        <button onClick={onBack} className="text-zinc-500 hover:text-white transition-colors text-sm">← Back</button>
        <span className="text-zinc-700">|</span>
        <span className="text-sm font-bold text-violet-400">Tutorial Builder</span>
        <div className="ml-auto flex gap-2">
          <button onClick={() => setTab("build")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === "build" ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white"}`}>Build</button>
          <button onClick={() => setTab("list")}  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === "list"  ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white"}`}>Saved ({customList.length})</button>
        </div>
      </div>

      {tab === "list" ? (
        /* ── Saved tutorials list ── */
        <div className="flex-1 overflow-y-auto p-6">
          {customList.length === 0 ? (
            <div className="text-center text-zinc-600 mt-16 text-sm">No custom tutorials saved yet.</div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-3">
              {customList.map((t) => (
                <div key={t.id} className="rounded-xl border border-zinc-800 bg-[#0f0f12] p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-white truncate">{t.title}</p>
                    <p className="text-xs text-zinc-500 truncate">{t.description}</p>
                    <p className="text-[10px] text-zinc-600 mt-1">{t.steps.length} steps · {t.difficulty} · {t.nodes.length} nodes</p>
                  </div>
                  <button onClick={() => loadIntoBuilder(t)} className="text-xs px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all font-semibold">Edit</button>
                  <button onClick={() => deleteCustom(t.id)} className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all font-semibold">Delete</button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── Builder ── */
        <div className="flex-1 overflow-hidden flex gap-0">
          {/* Left: form */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 border-r border-zinc-800/60">
            {/* Metadata */}
            <section>
              <h2 className="section-heading">Metadata</h2>
              <div className="space-y-3">
                <Field label="Title">
                  <input value={title} onChange={(e) => setTitle(e.target.value)} className="input-md" placeholder="e.g. BT Forklift" />
                </Field>
                <Field label="Description">
                  <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2} className="input-md resize-none" placeholder="What does this tutorial teach?" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Difficulty">
                    <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)} className="input-md">
                      <option>Easy</option><option>Medium</option><option>Hard</option>
                    </select>
                  </Field>
                  <Field label="Components (comma-separated)">
                    <input value={components} onChange={(e) => setComponents(e.target.value)} className="input-md" placeholder="ble_mode, dc_motor_single" />
                  </Field>
                </div>
              </div>
            </section>

            {/* Nodes */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="section-heading !mb-0">Nodes ({nodeRows.length})</h2>
                <button onClick={addNode} className="btn-sm bg-emerald-600/20 text-emerald-400 border-emerald-600/30 hover:bg-emerald-600/30">+ Node</button>
              </div>
              <div className="mb-1.5 grid grid-cols-[1fr_1.4fr_56px_56px_1.6fr_32px] gap-1.5 text-[9px] text-zinc-600 uppercase tracking-wider font-semibold px-0.5">
                <span>ID</span><span>Type</span><span>X</span><span>Y</span><span>Data (JSON)</span><span />
              </div>
              <div className="space-y-1.5">
                {nodeRows.map((r, i) => (
                  <NodeRowEditor key={r.id + i} row={r}
                    onChange={(updated) => setNodeRows((rows) => rows.map((x, j) => j === i ? updated : x))}
                    onRemove={() => setNodeRows((rows) => rows.filter((_, j) => j !== i))}
                  />
                ))}
                {nodeRows.length === 0 && <p className="text-xs text-zinc-600 py-2">No nodes yet.</p>}
              </div>
            </section>

            {/* Edges */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="section-heading !mb-0">Edges ({edgeRows.length})</h2>
                <button onClick={addEdge} className="btn-sm bg-blue-600/20 text-blue-400 border-blue-600/30 hover:bg-blue-600/30">+ Edge</button>
              </div>
              <div className="mb-1.5 grid grid-cols-[1fr_1fr_1fr_1fr_32px] gap-1.5 text-[9px] text-zinc-600 uppercase tracking-wider font-semibold px-0.5">
                <span>ID</span><span>Source</span><span>Target</span><span>Source Handle</span><span />
              </div>
              <div className="space-y-1.5">
                {edgeRows.map((r, i) => (
                  <EdgeRowEditor key={r.id + i} row={r}
                    onChange={(updated) => setEdgeRows((rows) => rows.map((x, j) => j === i ? updated : x))}
                    onRemove={() => setEdgeRows((rows) => rows.filter((_, j) => j !== i))}
                  />
                ))}
                {edgeRows.length === 0 && <p className="text-xs text-zinc-600 py-2">No edges yet. Add edges to connect nodes.</p>}
              </div>
            </section>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button onClick={saveTutorial}
                className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold transition-all">
                Save to Catalog
              </button>
              <button onClick={() => setShowJson((s) => !s)}
                className="px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 hover:text-white text-sm font-semibold transition-all">
                {showJson ? "Hide" : "Show"} JSON
              </button>
              {saved && <span className="text-xs text-emerald-400 font-semibold">✓ Saved!</span>}
              {error && <span className="text-xs text-red-400">{error}</span>}
            </div>

            {showJson && (
              <div className="rounded-xl border border-zinc-800 bg-[#0a0a0d] p-4 overflow-auto max-h-72">
                <pre className="text-[10px] text-zinc-400 font-mono whitespace-pre-wrap">{jsonExport}</pre>
              </div>
            )}
          </div>

          {/* Right: generated steps preview */}
          <div className="w-80 shrink-0 overflow-y-auto p-5">
            <h2 className="section-heading">Steps Preview ({steps.length})</h2>
            {steps.length === 0 ? (
              <p className="text-xs text-zinc-600">Connect some nodes to see generated steps.</p>
            ) : (
              <ol className="space-y-2.5">
                {steps.map((s, i) => (
                  <li key={s.id} className="flex gap-2.5">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-violet-600/20 text-violet-400 text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                    <div>
                      <p className="text-[11px] font-semibold text-zinc-200 leading-tight">{s.title}</p>
                      <p className="text-[10px] text-zinc-500 leading-snug mt-0.5">{s.description}</p>
                      <span className={`inline-block mt-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                        s.actionType === "add_node"    ? "bg-emerald-500/15 text-emerald-400" :
                        s.actionType === "connect"     ? "bg-blue-500/15 text-blue-400" :
                        "bg-amber-500/15 text-amber-400"
                      }`}>{s.actionType}{s.minCount && s.minCount > 1 ? ` ×${s.minCount}` : ""}</span>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Shared style helpers (inline via className) ───────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1">{label}</label>
      {children}
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function AdminPage({ onBack }: { onBack: () => void }) {
  const [authed, setAuthed] = useState(false);
  if (!authed) return <LoginScreen onAuth={() => setAuthed(true)} />;
  return <TutorialBuilder onBack={onBack} />;
}
