import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, Blocks, Check, Cpu, Edit3, KeyRound,
  Layers3, Save, Shield, Sparkles, Trash2,
} from "lucide-react";
import {
  ADMIN_SECRET, ADMIN_UNLOCK_STORAGE_KEY,
  buildCustomLaunchContext, buildLaunchContext,
  CUSTOM_DEFAULT_CATEGORIES, deleteCustomPreset,
  EDITOR_KIT_PRESETS, EDITOR_MODE_PRESETS,
  loadCustomPresets, saveCustomPreset,
  type CustomLaunchPreset, type EditorLaunchContext,
} from "@/entities/editor-launch/model/config";
import { NODE_CATEGORIES } from "@/entities/node/model";

interface Props { onLaunch: (context: EditorLaunchContext) => void; }
interface BuilderState {
  title: string; description: string; mode: EditorLaunchContext["mode"];
  selectedCategories: string[]; selectedNodeTypes: string[]; sensorNames: string;
}

// Each card gets a distinct gradient + icon color
const CARD_GRADIENTS = [
  "from-violet-600 to-indigo-700",
  "from-orange-500 to-amber-600",
  "from-emerald-500 to-teal-700",
  "from-sky-500 to-blue-700",
  "from-cyan-500 to-teal-600",
  "from-pink-500 to-rose-700",
  "from-indigo-500 to-violet-700",
  "from-yellow-500 to-orange-600",
] as const;

function ModeCard({ title, description, badge, gradientIdx, selected, onClick }: {
  title: string; description: string; badge: string;
  gradientIdx: number; selected: boolean; onClick: () => void;
}) {
  const grad = CARD_GRADIENTS[gradientIdx % CARD_GRADIENTS.length];
  return (
    <button
      onClick={onClick}
      className={`group flex flex-col overflow-hidden rounded-2xl text-left transition-all duration-150 ${
        selected
          ? "ring-2 ring-white/25 scale-[1.02] shadow-xl shadow-black/30"
          : "hover:scale-[1.01] hover:shadow-lg hover:shadow-black/20"
      }`}
    >
      {/* Gradient header */}
      <div className={`bg-gradient-to-br ${grad} px-4 pt-4 pb-3 relative`}>
        <div className="flex items-start justify-between">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
            <Blocks className="h-4.5 w-4.5 text-white" />
          </div>
          {selected
            ? <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/30"><Check className="h-3.5 w-3.5 text-white" /></div>
            : <ArrowRight className="h-4 w-4 text-white/40 group-hover:text-[var(--k-text)]/80 group-hover:translate-x-0.5 transition-all" />
          }
        </div>
        <h3 className="mt-3 text-[15px] font-black text-white tracking-tight leading-tight">{title}</h3>
        <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-white/60">{badge}</p>
      </div>
      {/* Description */}
      <div className="flex-1 bg-raised px-4 py-3 border-t border-[var(--k-border)]">
        <p className="text-[12px] leading-5 text-sub">{description}</p>
      </div>
    </button>
  );
}

export function EditorLaunchDashboard({ onLaunch }: Props) {
  const [selectedPresetId, setSelectedPresetId] = useState(EDITOR_MODE_PRESETS[0].id);
  const [selectedKitId,    setSelectedKitId]    = useState(EDITOR_KIT_PRESETS[0].id);
  const [customTitle,       setCustomTitle]      = useState("Custom Workspace");
  const [customDescription, setCustomDescription] = useState("Pick exactly the blocks you want the learner to see.");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(CUSTOM_DEFAULT_CATEGORIES);
  const [customPresets, setCustomPresets]   = useState<CustomLaunchPreset[]>([]);
  const [adminUnlocked, setAdminUnlocked]   = useState(false);
  const [adminInput,    setAdminInput]      = useState("");
  const [builder, setBuilder] = useState<BuilderState>({
    title: "My Custom Preset",
    description: "A preset tailored for my own kit or lesson.",
    mode: "guided",
    selectedCategories: CUSTOM_DEFAULT_CATEGORIES,
    selectedNodeTypes: NODE_CATEGORIES
      .filter((c) => CUSTOM_DEFAULT_CATEGORIES.includes(c.id))
      .flatMap((c) => c.nodes.map((n) => n.type)),
    sensorNames: "",
  });

  const selectedMode = useMemo(() => EDITOR_MODE_PRESETS.find((p) => p.id === selectedPresetId) ?? EDITOR_MODE_PRESETS[0], [selectedPresetId]);
  const selectedKit  = useMemo(() => EDITOR_KIT_PRESETS.find((p)  => p.id === selectedKitId)   ?? EDITOR_KIT_PRESETS[0],  [selectedKitId]);

  useEffect(() => {
    setCustomPresets(loadCustomPresets());
    try { setAdminUnlocked(localStorage.getItem(ADMIN_UNLOCK_STORAGE_KEY) === "true"); } catch { /* noop */ }
  }, []);

  useEffect(() => {
    try { localStorage.setItem(ADMIN_UNLOCK_STORAGE_KEY, adminUnlocked ? "true" : "false"); } catch { /* noop */ }
  }, [adminUnlocked]);

  const customContext = useMemo(() => buildCustomLaunchContext({
    title: customTitle.trim() || "Custom Workspace",
    description: customDescription.trim() || "Pick exactly the blocks you want the learner to see.",
    selectedCategories,
    availableSensors: selectedCategories.flatMap((catId) => {
      const cat = NODE_CATEGORIES.find((c) => c.id === catId);
      return cat ? cat.nodes.slice(0, 4).map((n) => n.label) : [];
    }),
  }), [customTitle, customDescription, selectedCategories]);

  const builderContext = useMemo(() => buildCustomLaunchContext({
    title: builder.title.trim() || "My Custom Preset",
    description: builder.description.trim() || "A preset tailored.",
    selectedCategories: builder.selectedCategories,
    selectedNodeTypes: builder.selectedNodeTypes,
    availableSensors: builder.sensorNames.split(",").map((s) => s.trim()).filter(Boolean),
  }), [builder]);

  const toggleCategory = (id: string) =>
    setSelectedCategories((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);

  const toggleBuilderCategory = (categoryId: string) => {
    setBuilder((prev) => {
      const cat = NODE_CATEGORIES.find((c) => c.id === categoryId);
      const catTypes = cat?.nodes.map((n) => n.type) ?? [];
      const nextCats  = prev.selectedCategories.includes(categoryId)
        ? prev.selectedCategories.filter((c) => c !== categoryId)
        : [...prev.selectedCategories, categoryId];
      const nextTypes = prev.selectedCategories.includes(categoryId)
        ? prev.selectedNodeTypes.filter((t) => !catTypes.includes(t))
        : Array.from(new Set([...prev.selectedNodeTypes, ...catTypes]));
      return { ...prev, selectedCategories: nextCats, selectedNodeTypes: nextTypes };
    });
  };

  const saveBuilderPreset = () => {
    const saved = saveCustomPreset({
      id: `custom-${Date.now()}`, title: builderContext.title, description: builderContext.description,
      mode: builderContext.mode, launchType: "custom", kitId: builderContext.kitId,
      accent: builderContext.accent, allowedCategories: builderContext.allowedCategories,
      allowedNodeTypes: builderContext.allowedNodeTypes, availableSensors: builderContext.availableSensors,
    });
    setCustomPresets(saved);
    onLaunch(builderContext);
  };

  return (
    <div className="h-full overflow-y-auto bg-page text-body">
      <div className="mx-auto w-full max-w-6xl px-5 py-8 space-y-8">

        {/* ── Hero ── */}
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient">
                <Blocks className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-hint">Kokoon LMS</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-body">
              Choose your workspace
            </h1>
            <p className="mt-1.5 text-base text-sub">
              Pick a mode, grab a kit, or build something custom.
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-[11px] text-hint shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-raised border border-subtle">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
              4 modes available
            </span>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <div className="space-y-8">

            {/* ── Modes ── */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-body flex items-center gap-2">
                    <Layers3 className="h-4.5 w-4.5 text-violet-400" />
                    Preset Modes
                  </h2>
                  <p className="text-[12px] text-hint mt-0.5">Teaching modes and general classroom setups</p>
                </div>
                <button onClick={() => onLaunch(buildLaunchContext(selectedMode))}
                  className="btn btn-sm btn-primary gap-1.5 font-bold">
                  Launch <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {EDITOR_MODE_PRESETS.map((preset, i) => (
                  <ModeCard key={preset.id} title={preset.title} description={preset.description}
                    badge={preset.mode} gradientIdx={i}
                    selected={selectedPresetId === preset.id}
                    onClick={() => setSelectedPresetId(preset.id)} />
                ))}
              </div>
            </section>

            {/* ── Kits ── */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-body flex items-center gap-2">
                    <Cpu className="h-4.5 w-4.5 text-emerald-400" />
                    Hardware Kits
                  </h2>
                  <p className="text-[12px] text-hint mt-0.5">Workspace limited to a real hardware kit</p>
                </div>
                <button onClick={() => onLaunch(buildLaunchContext(selectedKit))}
                  className="btn btn-sm btn-success gap-1.5 font-bold">
                  Launch <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {EDITOR_KIT_PRESETS.map((preset, i) => (
                  <ModeCard key={preset.id} title={preset.title} description={preset.description}
                    badge={preset.kitId ?? preset.id} gradientIdx={i + 4}
                    selected={selectedKitId === preset.id} onClick={() => setSelectedKitId(preset.id)} />
                ))}
              </div>
            </section>

            {/* ── My Presets ── */}
            {customPresets.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-body flex items-center gap-2 mb-4">
                  <Save className="h-4.5 w-4.5 text-sky-400" />
                  My Presets
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {customPresets.map((preset) => (
                    <div key={preset.id} className="rounded-2xl overflow-hidden border border-subtle bg-panel">
                      <div className="px-4 py-3 bg-raised border-b border-subtle flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-body">{preset.title}</h3>
                          <p className="text-[11px] text-hint mt-0.5">{preset.description}</p>
                        </div>
                        <span className="badge badge-ghost badge-sm shrink-0">custom</span>
                      </div>
                      <div className="px-4 py-3 flex items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-1">
                          {(preset.allowedCategories ?? []).slice(0, 3).map((catId) => {
                            const cat = NODE_CATEGORIES.find((c) => c.id === catId);
                            return <span key={catId} className="text-[11px] text-hint">{cat?.icon}</span>;
                          })}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {adminUnlocked && (
                            <button onClick={() => setCustomPresets(deleteCustomPreset(preset.id))}
                              className="btn btn-ghost btn-xs text-error-c">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button onClick={() => onLaunch(preset)} className="btn btn-primary btn-xs gap-1">
                            Launch <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Customize ── */}
            <section>
              <h2 className="text-lg font-bold text-body flex items-center gap-2 mb-4">
                <Edit3 className="h-4.5 w-4.5 text-fuchsia-400" />
                Customize
              </h2>
              <div className="rounded-2xl bg-panel border border-subtle overflow-hidden">
                <div className="px-5 py-4 grid gap-3 sm:grid-cols-2 border-b border-subtle">
                  <label className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-hint">Title</span>
                    <input value={customTitle} onChange={(e) => setCustomTitle(e.target.value)}
                      className="input input-bordered input-sm w-full" placeholder="Custom Workspace" />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-hint">Description</span>
                    <input value={customDescription} onChange={(e) => setCustomDescription(e.target.value)}
                      className="input input-bordered input-sm w-full" placeholder="Describe it…" />
                  </label>
                </div>
                <div className="px-5 py-4 border-b border-subtle">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-hint">Categories</span>
                    <span className="text-[11px] text-hint">{selectedCategories.length} selected</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {NODE_CATEGORIES.map((cat) => {
                      const on = selectedCategories.includes(cat.id);
                      return (
                        <button key={cat.id} onClick={() => toggleCategory(cat.id)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors border ${
                            on ? "bg-violet-500/15 text-violet-400 border-violet-500/30" : "border-subtle text-sub hover:bg-hover hover:text-body"
                          }`}>
                          {cat.icon} {cat.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="px-5 py-4 flex items-center justify-between">
                  <p className="text-[12px] text-hint">
                    <span className="font-bold text-body">{customContext.allowedNodeTypes?.length ?? 0}</span> blocks visible
                  </p>
                  <button onClick={() => onLaunch(customContext)}
                    className="btn btn-sm gap-1.5 font-bold text-white bg-brand-gradient border-0 hover:opacity-90">
                    Open Custom <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* ── Sidebar ── */}
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">

            {/* Preview card */}
            <div className="rounded-2xl overflow-hidden border border-subtle">
              <div className={`bg-gradient-to-br ${CARD_GRADIENTS[EDITOR_MODE_PRESETS.findIndex(p => p.id === selectedPresetId) % CARD_GRADIENTS.length]} px-4 py-4`}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Selected</p>
                <h3 className="text-xl font-black text-white mt-1">{selectedMode.title}</h3>
                <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 text-white/80">
                  {selectedMode.launchType}
                </span>
              </div>
              <div className="bg-panel px-4 py-3 space-y-3">
                <p className="text-[12px] leading-5 text-sub">{selectedMode.description}</p>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-hint mb-1.5">Categories</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedMode.allowedCategories ?? CUSTOM_DEFAULT_CATEGORIES).map((catId) => {
                      const cat = NODE_CATEGORIES.find((c) => c.id === catId);
                      return <span key={catId} className="badge badge-ghost badge-sm text-[10px]">{cat?.icon ?? "•"} {cat?.label ?? catId}</span>;
                    })}
                  </div>
                </div>
                {(selectedMode.availableSensors ?? []).length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-hint mb-1.5">Sensors</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedMode.availableSensors ?? []).map((s) => (
                        <span key={s} className="badge badge-accent badge-sm text-[10px]">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Admin */}
            <div className="rounded-2xl bg-panel border border-subtle overflow-hidden">
              <div className="px-4 py-3 border-b border-subtle flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  <span className="text-sm font-bold text-body">Admin</span>
                </div>
                {adminUnlocked && (
                  <div className="flex items-center gap-2">
                    <span className="badge badge-success badge-sm">Unlocked</span>
                    <button onClick={() => setAdminUnlocked(false)} className="btn btn-ghost btn-xs text-hint text-[10px]">Lock</button>
                  </div>
                )}
              </div>

              {!adminUnlocked ? (
                <div className="px-4 py-3 space-y-2">
                  <p className="text-[12px] text-sub">Enter the admin secret to create custom presets.</p>
                  <div className="flex gap-2">
                    <div className="flex flex-1 items-center gap-2 rounded-lg px-3 py-2 bg-raised border border-subtle">
                      <KeyRound className="h-3.5 w-3.5 shrink-0 text-hint" />
                      <input value={adminInput} onChange={(e) => setAdminInput(e.target.value)}
                        type={adminInput ? "password" : "text"} placeholder="Secret…"
                        className="w-full bg-transparent text-xs outline-none text-body placeholder:text-hint"
                        onKeyDown={(e) => { if (e.key === "Enter" && adminInput.trim() === ADMIN_SECRET) { setAdminUnlocked(true); setAdminInput(""); } }}
                      />
                    </div>
                    <button
                      onClick={() => { if (adminInput.trim() === ADMIN_SECRET) { setAdminUnlocked(true); setAdminInput(""); } }}
                      className="btn btn-sm btn-primary font-bold">Go</button>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-3 space-y-3">
                  {[
                    { label: "Preset name",  value: builder.title,       setter: (v: string) => setBuilder((p) => ({ ...p, title: v })),       ph: "My Preset" },
                    { label: "Sensor names", value: builder.sensorNames, setter: (v: string) => setBuilder((p) => ({ ...p, sensorNames: v })), ph: "Ultrasonic, Touch…" },
                  ].map(({ label, value, setter, ph }) => (
                    <label key={label} className="block space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-hint">{label}</span>
                      <input value={value} onChange={(e) => setter(e.target.value)} placeholder={ph}
                        className="input input-bordered input-sm w-full" />
                    </label>
                  ))}
                  <label className="block space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-hint">Mode</span>
                    <select value={builder.mode} onChange={(e) => setBuilder((p) => ({ ...p, mode: e.target.value as BuilderState["mode"] }))}
                      className="select select-bordered select-sm w-full">
                      {(["guided","challenge","sandbox","full","customize"] as const).map((m) => (
                        <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                      ))}
                    </select>
                  </label>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-hint mb-2">Categories</p>
                    <div className="flex flex-wrap gap-1.5">
                      {NODE_CATEGORIES.map((cat) => {
                        const on = builder.selectedCategories.includes(cat.id);
                        return (
                          <button key={cat.id} onClick={() => toggleBuilderCategory(cat.id)}
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors border ${
                              on ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "border-subtle text-hint hover:bg-hover"
                            }`}>
                            {cat.icon} {cat.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => setBuilder((p) => ({
                        ...p, selectedCategories: CUSTOM_DEFAULT_CATEGORIES,
                        selectedNodeTypes: NODE_CATEGORIES.filter((c) => CUSTOM_DEFAULT_CATEGORIES.includes(c.id)).flatMap((c) => c.nodes.map((n) => n.type)),
                      }))}
                      className="btn btn-ghost btn-sm text-hint text-xs">Reset</button>
                    <button onClick={saveBuilderPreset} className="btn btn-sm btn-success gap-1.5 font-bold">
                      <Save className="h-3.5 w-3.5" /> Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
