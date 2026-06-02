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

/* ── Preset card ─────────────────────────────────────────────────────────── */
function PresetCard({ title, description, badge, accentColor, selected, onClick }: {
  title: string; description: string; badge: string;
  accentColor: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl p-4 text-left transition-all"
      style={{
        border: selected
          ? `2px solid color-mix(in srgb, ${accentColor} 60%, transparent)`
          : "2px solid var(--k-border)",
        background: selected
          ? `color-mix(in srgb, ${accentColor} 10%, var(--k-base-300))`
          : "var(--k-base-300)",
      }}
      onMouseEnter={(e) => {
        if (!selected) (e.currentTarget as HTMLButtonElement).style.borderColor = `color-mix(in srgb, ${accentColor} 40%, transparent)`;
      }}
      onMouseLeave={(e) => {
        if (!selected) (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--k-border)";
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl"
              style={{ background: `color-mix(in srgb, ${accentColor} 20%, transparent)`, color: accentColor }}>
              <Blocks className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold" style={{ color: "var(--k-text)" }}>{title}</h3>
              <span className="badge badge-ghost badge-sm text-[10px] uppercase tracking-wider" style={{ color: "var(--k-text-dim)" }}>{badge}</span>
            </div>
          </div>
          <p className="text-xs leading-5" style={{ color: "var(--k-text-muted)" }}>{description}</p>
        </div>
        {selected
          ? <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: accentColor }} />
          : <ArrowRight className="h-4 w-4 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: accentColor }} />
        }
      </div>
    </button>
  );
}

/* ── Section wrapper ─────────────────────────────────────────────────────── */
function Section({ title, subtitle, icon, children }: {
  title: string; subtitle: string; icon: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl p-5 space-y-4"
      style={{ border: "1px solid var(--k-border)", background: "var(--k-base-200)" }}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold" style={{ color: "var(--k-text)" }}>{title}</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--k-text-dim)" }}>{subtitle}</p>
        </div>
        <div style={{ color: "var(--k-text-dim)" }}>{icon}</div>
      </div>
      {children}
    </section>
  );
}

/* ── Accent colors for preset cards ─────────────────────────────────────── */
const MODE_COLORS = ["var(--k-primary)", "var(--k-warning)", "var(--k-success)", "var(--k-info)"];
const KIT_COLORS  = ["var(--k-accent)", "var(--k-secondary)", "var(--k-warning)", "var(--k-primary)"];

/* ── Main component ──────────────────────────────────────────────────────── */
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
  const selectedKit  = useMemo(() => EDITOR_KIT_PRESETS.find((p) => p.id === selectedKitId)    ?? EDITOR_KIT_PRESETS[0],  [selectedKitId]);

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
    description: builder.description.trim() || "A preset tailored for my own kit or lesson.",
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
      const nextCats = prev.selectedCategories.includes(categoryId)
        ? prev.selectedCategories.filter((c) => c !== categoryId)
        : [...prev.selectedCategories, categoryId];
      const nextTypes = prev.selectedCategories.includes(categoryId)
        ? prev.selectedNodeTypes.filter((t) => !catTypes.includes(t))
        : Array.from(new Set([...prev.selectedNodeTypes, ...catTypes]));
      return { ...prev, selectedCategories: nextCats, selectedNodeTypes: nextTypes };
    });
  };

  const toggleBuilderNode = (type: string) =>
    setBuilder((prev) => ({
      ...prev,
      selectedNodeTypes: prev.selectedNodeTypes.includes(type)
        ? prev.selectedNodeTypes.filter((t) => t !== type)
        : [...prev.selectedNodeTypes, type],
    }));

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
    <div className="h-full overflow-y-auto" style={{ background: "var(--k-base-100)", color: "var(--k-text)" }}>
      <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8 gap-6">

        {/* ── Hero header ── */}
        <header className="rounded-3xl p-5 sm:p-7"
          style={{ border: "1px solid var(--k-border)", background: "var(--k-base-200)" }}>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest"
                style={{ border: "1px solid color-mix(in srgb, var(--k-accent) 30%, transparent)",
                         background: "color-mix(in srgb, var(--k-accent) 10%, transparent)",
                         color: "var(--k-accent)" }}>
                <Sparkles className="h-3.5 w-3.5" />
                Launch Dashboard
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl" style={{ color: "var(--k-text)" }}>
                Pick your workspace ⚡
              </h1>
              <p className="mt-2 text-sm leading-6" style={{ color: "var(--k-text-muted)" }}>
                Choose a mode, a hardware kit, or build your own custom block set. Your progress is always saved.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs lg:min-w-[22rem]">
              {[
                { label: "Modes",  value: "Guided · Challenge · Sandbox · Full", color: "var(--k-primary)" },
                { label: "Kits",   value: "Starter · Sensor · Motion · IoT",     color: "var(--k-secondary)" },
                { label: "Safety", value: "Restrict blocks by preset or kit",    color: "var(--k-success)" },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl p-3"
                  style={{ border: "1px solid var(--k-border)", background: "var(--k-base-300)" }}>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color }}>{label}</p>
                  <p className="text-xs font-medium leading-4" style={{ color: "var(--k-text)" }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </header>

        <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <main className="space-y-6">

            {/* ── Preset Modes ── */}
            <Section title="🎮 Preset Modes" subtitle="Quick launch for teaching modes and classroom setups."
              icon={<Layers3 className="h-5 w-5" />}>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {EDITOR_MODE_PRESETS.map((preset, i) => (
                  <PresetCard key={preset.id} title={preset.title} description={preset.description}
                    badge={preset.mode} accentColor={MODE_COLORS[i % MODE_COLORS.length]}
                    selected={selectedPresetId === preset.id}
                    onClick={() => setSelectedPresetId(preset.id)} />
                ))}
              </div>
              <div className="flex justify-end">
                <button onClick={() => onLaunch(buildLaunchContext(selectedMode))}
                  className="btn btn-primary gap-2 font-bold">
                  Open Mode <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </Section>

            {/* ── My Presets ── */}
            <Section title="💾 My Presets" subtitle="Saved custom presets for direct launch."
              icon={<Save className="h-5 w-5" />}>
              {customPresets.length === 0 ? (
                <div className="rounded-xl p-4 text-sm text-center"
                  style={{ border: "1px dashed var(--k-border)", color: "var(--k-text-dim)" }}>
                  No saved custom presets yet. Unlock admin mode to create one.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {customPresets.map((preset) => (
                    <div key={preset.id} className="rounded-2xl p-4"
                      style={{ border: "1px solid var(--k-border)", background: "var(--k-base-300)" }}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold" style={{ color: "var(--k-text)" }}>{preset.title}</h3>
                          <p className="mt-1 text-xs leading-5" style={{ color: "var(--k-text-muted)" }}>{preset.description}</p>
                        </div>
                        <span className="badge badge-ghost badge-sm text-[10px]">custom</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {(preset.allowedCategories ?? []).slice(0, 4).map((catId) => {
                          const cat = NODE_CATEGORIES.find((c) => c.id === catId);
                          return (
                            <span key={catId} className="badge badge-ghost badge-sm text-[10px]">
                              {cat?.icon} {cat?.label}
                            </span>
                          );
                        })}
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <button onClick={() => onLaunch(preset)} className="btn btn-sm btn-primary gap-1.5">
                          Launch <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                        {adminUnlocked && (
                          <button onClick={() => setCustomPresets(deleteCustomPreset(preset.id))}
                            className="btn btn-sm btn-ghost gap-1.5" style={{ color: "var(--k-error)" }}>
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Section>

            {/* ── Kit Presets ── */}
            <Section title="🤖 Hardware Kits" subtitle="Launch a workspace limited to a real hardware kit."
              icon={<Cpu className="h-5 w-5" />}>
              <div className="grid gap-2 md:grid-cols-2">
                {EDITOR_KIT_PRESETS.map((preset, i) => (
                  <PresetCard key={preset.id} title={preset.title} description={preset.description}
                    badge={preset.kitId ?? preset.id} accentColor={KIT_COLORS[i % KIT_COLORS.length]}
                    selected={selectedKitId === preset.id} onClick={() => setSelectedKitId(preset.id)} />
                ))}
              </div>
              <div className="flex justify-end">
                <button onClick={() => onLaunch(buildLaunchContext(selectedKit))}
                  className="btn btn-success gap-2 font-bold">
                  Open Kit <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </Section>

            {/* ── Customize ── */}
            <Section title="🎨 Customize" subtitle="Select the exact blocks you want to expose in the editor."
              icon={<Edit3 className="h-5 w-5" />}>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--k-text-dim)" }}>Workspace title</span>
                  <input value={customTitle} onChange={(e) => setCustomTitle(e.target.value)}
                    className="input input-bordered input-sm w-full" placeholder="Custom Workspace"
                    style={{ background: "var(--k-base-300)" }} />
                </label>
                <label className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--k-text-dim)" }}>Description</span>
                  <input value={customDescription} onChange={(e) => setCustomDescription(e.target.value)}
                    className="input input-bordered input-sm w-full" placeholder="Pick exactly the blocks you want…"
                    style={{ background: "var(--k-base-300)" }} />
                </label>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--k-text-dim)" }}>Available categories</span>
                  <span className="badge badge-ghost badge-sm">{selectedCategories.length} selected</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {NODE_CATEGORIES.map((cat) => {
                    const active = selectedCategories.includes(cat.id);
                    return (
                      <button key={cat.id} onClick={() => toggleCategory(cat.id)}
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
                        style={active
                          ? { border: "1px solid color-mix(in srgb, var(--k-accent) 40%, transparent)",
                              background: "color-mix(in srgb, var(--k-accent) 15%, transparent)",
                              color: "var(--k-accent)" }
                          : { border: "1px solid var(--k-border)", color: "var(--k-text-muted)" }
                        }>
                        <span>{cat.icon}</span><span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl p-3" style={{ border: "1px solid var(--k-border)", background: "var(--k-base-300)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold" style={{ color: "var(--k-text)" }}>Preview</span>
                  <span className="text-xs" style={{ color: "var(--k-text-dim)" }}>
                    {customContext.allowedNodeTypes?.length ?? 0} blocks visible
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(customContext.availableSensors ?? []).slice(0, 8).map((sensor) => (
                    <span key={sensor} className="badge badge-ghost badge-sm text-[11px]">{sensor}</span>
                  ))}
                  {!(customContext.availableSensors?.length) && (
                    <span className="text-xs" style={{ color: "var(--k-text-dim)" }}>No sensors selected yet.</span>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button onClick={() => onLaunch(customContext)}
                  className="btn gap-2 font-bold text-white"
                  style={{ background: "linear-gradient(135deg, var(--k-primary), var(--k-secondary))" }}>
                  Open Custom Workspace <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </Section>
          </main>

          {/* ── Sidebar ── */}
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">

            {/* Selected preset preview */}
            <div className="rounded-2xl p-5"
              style={{ border: "1px solid var(--k-border)", background: "var(--k-base-200)" }}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--k-text-dim)" }}>Selected Preset</p>
                  <h3 className="text-lg font-extrabold" style={{ color: "var(--k-text)" }}>{selectedMode.title}</h3>
                </div>
                <span className="badge badge-primary badge-sm uppercase">{selectedMode.launchType}</span>
              </div>
              <p className="text-sm leading-6 mb-4" style={{ color: "var(--k-text-muted)" }}>{selectedMode.description}</p>

              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--k-text-dim)" }}>Categories</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(selectedMode.allowedCategories ?? CUSTOM_DEFAULT_CATEGORIES).map((catId) => {
                      const cat = NODE_CATEGORIES.find((c) => c.id === catId);
                      return <span key={catId} className="badge badge-ghost badge-sm">{cat?.icon ?? "•"} {cat?.label ?? catId}</span>;
                    })}
                  </div>
                </div>
                {(selectedMode.availableSensors ?? []).length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: "var(--k-text-dim)" }}>Focus Sensors</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedMode.availableSensors ?? []).map((s) => (
                        <span key={s} className="badge badge-accent badge-sm">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* How it works */}
            <div className="rounded-2xl p-5"
              style={{ border: "1px solid var(--k-border)", background: "var(--k-base-200)" }}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--k-text-dim)" }}>How it works</p>
              <ol className="space-y-2.5 text-sm leading-6" style={{ color: "var(--k-text-muted)" }}>
                {[
                  "Pick a mode or a kit to pre-configure the editor.",
                  "The block palette filters to the allowed hardware only.",
                  "Admin can create & save custom presets after unlocking below.",
                ].map((step, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                      style={{ background: "var(--k-elevated)", color: "var(--k-text-muted)" }}>
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* Admin panel */}
            <div className="rounded-2xl p-5"
              style={{ border: "1px solid var(--k-border)", background: "var(--k-base-200)" }}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: "var(--k-text-dim)" }}>Admin</p>
                  <h3 className="text-base font-bold" style={{ color: "var(--k-text)" }}>🔐 Secret Builder</h3>
                </div>
                <Shield className="h-5 w-5" style={{ color: "var(--k-success)" }} />
              </div>

              {!adminUnlocked ? (
                <div className="space-y-3">
                  <p className="text-sm leading-6" style={{ color: "var(--k-text-muted)" }}>
                    Unlock with the admin secret to create or delete presets.
                  </p>
                  <div className="flex items-center gap-2 rounded-xl px-3 py-2"
                    style={{ border: "1px solid var(--k-border)", background: "var(--k-base-300)" }}>
                    <KeyRound className="h-4 w-4 shrink-0" style={{ color: "var(--k-text-dim)" }} />
                    <input value={adminInput} onChange={(e) => setAdminInput(e.target.value)}
                      type={adminInput ? "password" : "text"}
                      placeholder="Enter admin secret"
                      className="w-full bg-transparent text-sm outline-none"
                      style={{ color: "var(--k-text)" }}
                      onKeyDown={(e) => { if (e.key === "Enter" && adminInput.trim() === ADMIN_SECRET) { setAdminUnlocked(true); setAdminInput(""); } }}
                    />
                    <button
                      onClick={() => { if (adminInput.trim() === ADMIN_SECRET) { setAdminUnlocked(true); setAdminInput(""); } }}
                      className="btn btn-xs btn-primary">Unlock</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge badge-success badge-sm">Unlocked</span>
                    <button onClick={() => setAdminUnlocked(false)} className="btn btn-xs btn-ghost text-[10px]">Lock</button>
                  </div>

                  {/* Builder fields */}
                  <div className="space-y-3">
                    {[
                      { label: "Preset name",        value: builder.title,       setter: (v: string) => setBuilder((p) => ({ ...p, title: v })),       placeholder: "My Preset" },
                      { label: "Sensors label list", value: builder.sensorNames, setter: (v: string) => setBuilder((p) => ({ ...p, sensorNames: v })), placeholder: "Ultrasonic, Touch, GPIO" },
                    ].map(({ label, value, setter, placeholder }) => (
                      <label key={label} className="space-y-1 block">
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--k-text-dim)" }}>{label}</span>
                        <input value={value} onChange={(e) => setter(e.target.value)} placeholder={placeholder}
                          className="input input-bordered input-sm w-full" style={{ background: "var(--k-base-300)" }} />
                      </label>
                    ))}
                    <label className="space-y-1 block">
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--k-text-dim)" }}>Description</span>
                      <textarea value={builder.description}
                        onChange={(e) => setBuilder((p) => ({ ...p, description: e.target.value }))}
                        rows={2} className="textarea textarea-bordered textarea-sm w-full"
                        style={{ background: "var(--k-base-300)" }} />
                    </label>
                    <label className="space-y-1 block">
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--k-text-dim)" }}>Mode</span>
                      <select value={builder.mode} onChange={(e) => setBuilder((p) => ({ ...p, mode: e.target.value as BuilderState["mode"] }))}
                        className="select select-bordered select-sm w-full" style={{ background: "var(--k-base-300)" }}>
                        {(["guided","challenge","sandbox","full","customize"] as const).map((m) => (
                          <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {/* Category toggles */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--k-text-dim)" }}>Keep categories</span>
                      <span className="badge badge-ghost badge-sm">{builder.selectedCategories.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {NODE_CATEGORIES.map((cat) => {
                        const active = builder.selectedCategories.includes(cat.id);
                        return (
                          <button key={cat.id} onClick={() => toggleBuilderCategory(cat.id)}
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors"
                            style={active
                              ? { border: "1px solid color-mix(in srgb, var(--k-success) 40%, transparent)", background: "color-mix(in srgb, var(--k-success) 15%, transparent)", color: "var(--k-success)" }
                              : { border: "1px solid var(--k-border)", color: "var(--k-text-muted)" }}>
                            {cat.icon} {cat.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Node toggles */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--k-text-dim)" }}>Keep blocks</span>
                      <span className="badge badge-ghost badge-sm">{builder.selectedNodeTypes.length}</span>
                    </div>
                    <div className="max-h-52 overflow-y-auto rounded-xl p-2 space-y-2"
                      style={{ border: "1px solid var(--k-border)", background: "var(--k-base-300)" }}>
                      {NODE_CATEGORIES.filter((c) => builder.selectedCategories.includes(c.id)).map((cat) => (
                        <div key={cat.id}>
                          <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--k-text-dim)" }}>
                            <span>{cat.icon}</span><span>{cat.label}</span>
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {cat.nodes.map((node) => {
                              const active = builder.selectedNodeTypes.includes(node.type);
                              return (
                                <button key={node.type} onClick={() => toggleBuilderNode(node.type)}
                                  className="rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors"
                                  style={active
                                    ? { border: "1px solid color-mix(in srgb, var(--k-accent) 40%, transparent)", background: "color-mix(in srgb, var(--k-accent) 15%, transparent)", color: "var(--k-accent)" }
                                    : { border: "1px solid var(--k-border)", color: "var(--k-text-muted)" }}>
                                  {node.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => setBuilder((p) => ({
                        ...p,
                        selectedCategories: CUSTOM_DEFAULT_CATEGORIES,
                        selectedNodeTypes: NODE_CATEGORIES
                          .filter((c) => CUSTOM_DEFAULT_CATEGORIES.includes(c.id))
                          .flatMap((c) => c.nodes.map((n) => n.type)),
                      }))}
                      className="btn btn-sm btn-ghost">Reset</button>
                    <button onClick={saveBuilderPreset}
                      className="btn btn-sm btn-success gap-1.5 font-bold">
                      <Save className="h-4 w-4" /> Save Preset
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
