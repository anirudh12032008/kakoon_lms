import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Blocks,
  Check,
  Cpu,
  Edit3,
  KeyRound,
  Layers3,
  Save,
  Shield,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  ADMIN_SECRET,
  ADMIN_UNLOCK_STORAGE_KEY,
  buildCustomLaunchContext,
  buildLaunchContext,
  CUSTOM_DEFAULT_CATEGORIES,
  deleteCustomPreset,
  EDITOR_KIT_PRESETS,
  EDITOR_MODE_PRESETS,
  loadCustomPresets,
  saveCustomPreset,
  type CustomLaunchPreset,
  type EditorLaunchContext,
} from "@/config/editorLaunch";
import { NODE_CATEGORIES } from "@/components/editor/nodes";

interface Props {
  onLaunch: (context: EditorLaunchContext) => void;
}

interface BuilderState {
  title: string;
  description: string;
  mode: EditorLaunchContext["mode"];
  selectedCategories: string[];
  selectedNodeTypes: string[];
  sensorNames: string;
}

function PresetCard({
  title,
  description,
  badge,
  accent,
  selected,
  onClick,
}: {
  title: string;
  description: string;
  badge: string;
  accent: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all ${
        selected ? "border-white/20 bg-white/8 shadow-2xl shadow-black/20" : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]"
      }`}
    >
      <div className={`absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br ${accent} to-transparent`} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-black/20 border border-white/10 text-white">
              <Blocks className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-white">{title}</h3>
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">{badge}</p>
            </div>
          </div>
          <p className="max-w-[28rem] text-sm leading-6 text-white/65">{description}</p>
        </div>
        {selected ? <Check className="h-4 w-4 text-emerald-300" /> : <ArrowRight className="h-4 w-4 text-white/35" />}
      </div>
    </button>
  );
}

export function EditorLaunchDashboard({ onLaunch }: Props) {
  const [selectedPresetId, setSelectedPresetId] = useState(EDITOR_MODE_PRESETS[0].id);
  const [selectedKitId, setSelectedKitId] = useState(EDITOR_KIT_PRESETS[0].id);
  const [customTitle, setCustomTitle] = useState("Custom Workspace");
  const [customDescription, setCustomDescription] = useState("Pick exactly the blocks you want the learner to see.");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(CUSTOM_DEFAULT_CATEGORIES);
  const [customPresets, setCustomPresets] = useState<CustomLaunchPreset[]>([]);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminSecretInput, setAdminSecretInput] = useState("");
  const [builder, setBuilder] = useState<BuilderState>({
    title: "My Custom Preset",
    description: "A preset tailored for my own kit or lesson.",
    mode: "guided",
    selectedCategories: CUSTOM_DEFAULT_CATEGORIES,
    selectedNodeTypes: NODE_CATEGORIES
      .filter((category) => CUSTOM_DEFAULT_CATEGORIES.includes(category.id))
      .flatMap((category) => category.nodes.map((node) => node.type)),
    sensorNames: "",
  });

  const selectedMode = useMemo(
    () => EDITOR_MODE_PRESETS.find((preset) => preset.id === selectedPresetId) ?? EDITOR_MODE_PRESETS[0],
    [selectedPresetId]
  );
  const selectedKit = useMemo(
    () => EDITOR_KIT_PRESETS.find((preset) => preset.id === selectedKitId) ?? EDITOR_KIT_PRESETS[0],
    [selectedKitId]
  );

  useEffect(() => {
    setCustomPresets(loadCustomPresets());
    try {
      setAdminUnlocked(localStorage.getItem(ADMIN_UNLOCK_STORAGE_KEY) === "true");
    } catch {
      setAdminUnlocked(false);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(ADMIN_UNLOCK_STORAGE_KEY, adminUnlocked ? "true" : "false");
    } catch {
      // Ignore storage failures.
    }
  }, [adminUnlocked]);

  const customContext = useMemo(
    () => buildCustomLaunchContext({
      title: customTitle.trim() || "Custom Workspace",
      description: customDescription.trim() || "Pick exactly the blocks you want the learner to see.",
      selectedCategories,
      availableSensors: selectedCategories.flatMap((categoryId) => {
        const category = NODE_CATEGORIES.find((item) => item.id === categoryId);
        return category ? category.nodes.slice(0, 4).map((node) => node.label) : [];
      }),
    }),
    [customTitle, customDescription, selectedCategories]
  );

  const builderContext = useMemo(
    () => buildCustomLaunchContext({
      title: builder.title.trim() || "My Custom Preset",
      description: builder.description.trim() || "A preset tailored for my own kit or lesson.",
      selectedCategories: builder.selectedCategories,
      selectedNodeTypes: builder.selectedNodeTypes,
      availableSensors: builder.sensorNames
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    }),
    [builder]
  );

  const launchMode = () => onLaunch(buildLaunchContext(selectedMode));
  const launchKit = () => onLaunch(buildLaunchContext(selectedKit));
  const launchCustom = () => onLaunch(customContext);

  const unlockedPresets = customPresets;

  const toggleBuilderCategory = (categoryId: string) => {
    setBuilder((prev) => {
      const category = NODE_CATEGORIES.find((item) => item.id === categoryId);
      const categoryNodeTypes = category?.nodes.map((node) => node.type) ?? [];
      const nextCategories = prev.selectedCategories.includes(categoryId)
        ? prev.selectedCategories.filter((item) => item !== categoryId)
        : [...prev.selectedCategories, categoryId];

      const nextSelectedNodeTypes = prev.selectedCategories.includes(categoryId)
        ? prev.selectedNodeTypes.filter((nodeType) => !categoryNodeTypes.includes(nodeType))
        : Array.from(new Set([...prev.selectedNodeTypes, ...categoryNodeTypes]));

      return { ...prev, selectedCategories: nextCategories, selectedNodeTypes: nextSelectedNodeTypes };
    });
  };

  const toggleBuilderNode = (nodeType: string) => {
    setBuilder((prev) => ({
      ...prev,
      selectedNodeTypes: prev.selectedNodeTypes.includes(nodeType)
        ? prev.selectedNodeTypes.filter((item) => item !== nodeType)
        : [...prev.selectedNodeTypes, nodeType],
    }));
  };

  const unlockAdmin = () => {
    if (adminSecretInput.trim() !== ADMIN_SECRET) return;
    setAdminUnlocked(true);
    setAdminSecretInput("");
  };

  const saveBuilderPreset = () => {
    const saved = saveCustomPreset({
      id: `custom-${Date.now()}`,
      title: builderContext.title,
      description: builderContext.description,
      mode: builderContext.mode,
      launchType: "custom",
      kitId: builderContext.kitId,
      accent: builderContext.accent,
      allowedCategories: builderContext.allowedCategories,
      allowedNodeTypes: builderContext.allowedNodeTypes,
      availableSensors: builderContext.availableSensors,
    });
    setCustomPresets(saved);
    onLaunch(builderContext);
  };

  const removePreset = (presetId: string) => {
    const updated = deleteCustomPreset(presetId);
    setCustomPresets(updated);
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((item) => item !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <div
      className="h-full overflow-y-scroll bg-[#060607] text-white [scrollbar-gutter:stable]"
      style={{ scrollbarGutter: "stable", scrollbarWidth: "thin" }}
    >
      <div className="mx-auto flex min-h-full w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-2xl shadow-black/20 backdrop-blur-sm sm:p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              LMS Launch Dashboard
            </div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Choose a workspace before opening the editor.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
              Pick a preset mode, launch a kit-limited workspace, open the full editor, or create a custom block set for a specific classroom or hardware package.
            </p>
          </div>
          <div className="grid gap-2 text-xs text-white/60 sm:grid-cols-3 lg:min-w-[27rem]">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-[10px] uppercase tracking-[0.24em] text-white/35">Modes</p>
              <p className="mt-1 text-sm font-medium text-white">Guided, Challenge, Sandbox, Full</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-[10px] uppercase tracking-[0.24em] text-white/35">Kits</p>
              <p className="mt-1 text-sm font-medium text-white">Starter, Sensor, Motion, IoT</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-[10px] uppercase tracking-[0.24em] text-white/35">Safety</p>
              <p className="mt-1 text-sm font-medium text-white">Restrict blocks by preset, kit, or admin custom mode</p>
            </div>
          </div>
        </header>

        <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
          <main className="space-y-6">
            <section className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Preset Modes</h2>
                  <p className="text-xs text-white/45">A quick launch for teaching modes and general classroom setups.</p>
                </div>
                <Layers3 className="h-5 w-5 text-cyan-300" />
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                {EDITOR_MODE_PRESETS.map((preset) => (
                  <PresetCard
                    key={preset.id}
                    title={preset.title}
                    description={preset.description}
                    badge={preset.mode}
                    accent={preset.accent ?? "from-violet-500 to-fuchsia-500"}
                    selected={selectedPresetId === preset.id}
                    onClick={() => setSelectedPresetId(preset.id)}
                  />
                ))}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={launchMode}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-white/90"
                >
                  Open selected mode
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </section>

            <section className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">My Presets</h2>
                  <p className="text-xs text-white/45">Saved custom presets are available for direct launch here.</p>
                </div>
                <Save className="h-5 w-5 text-violet-300" />
              </div>

              {unlockedPresets.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-white/45">
                  No saved custom presets yet. Unlock admin mode to create one.
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {unlockedPresets.map((preset) => (
                    <div key={preset.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-white">{preset.title}</h3>
                          <p className="mt-1 text-xs leading-5 text-white/55">{preset.description}</p>
                        </div>
                        <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.24em] text-white/40">
                          custom
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {(preset.allowedCategories ?? []).slice(0, 4).map((categoryId) => {
                          const category = NODE_CATEGORIES.find((item) => item.id === categoryId);
                          return (
                            <span key={categoryId} className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-white/55">
                              {category?.icon} {category?.label}
                            </span>
                          );
                        })}
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <button
                          onClick={() => onLaunch(preset)}
                          className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-black transition-colors hover:bg-white/90"
                        >
                          Launch preset
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                        {adminUnlocked && (
                          <button
                            onClick={() => removePreset(preset.id)}
                            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.06]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Preset Kits</h2>
                  <p className="text-xs text-white/45">Launch a workspace limited to the items inside a real hardware kit.</p>
                </div>
                <Cpu className="h-5 w-5 text-emerald-300" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {EDITOR_KIT_PRESETS.map((preset) => (
                  <PresetCard
                    key={preset.id}
                    title={preset.title}
                    description={preset.description}
                    badge={preset.kitId ?? preset.id}
                    accent={preset.accent ?? "from-violet-500 to-fuchsia-500"}
                    selected={selectedKitId === preset.id}
                    onClick={() => setSelectedKitId(preset.id)}
                  />
                ))}
              </div>
              <div className="flex justify-end">
                <button
                  onClick={launchKit}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-emerald-300"
                >
                  Open selected kit
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </section>

            <section className="space-y-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Customize</h2>
                  <p className="text-xs text-white/45">Select the exact blocks you want to expose in the editor.</p>
                </div>
                <Edit3 className="h-5 w-5 text-fuchsia-300" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.24em] text-white/35">Workspace title</span>
                  <input
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition-colors placeholder:text-white/25 focus:border-cyan-400/60"
                    placeholder="Custom Workspace"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs uppercase tracking-[0.24em] text-white/35">Description</span>
                  <input
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none transition-colors placeholder:text-white/25 focus:border-cyan-400/60"
                    placeholder="Pick exactly the blocks you want the learner to see."
                  />
                </label>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-xs uppercase tracking-[0.24em] text-white/35">Available categories</span>
                  <span className="text-xs text-white/50">{selectedCategories.length} selected</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {NODE_CATEGORIES.map((category) => {
                    const active = selectedCategories.includes(category.id);
                    return (
                      <button
                        key={category.id}
                        onClick={() => toggleCategory(category.id)}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                          active
                            ? "border-cyan-400/40 bg-cyan-400/15 text-cyan-100"
                            : "border-white/10 bg-black/20 text-white/55 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        <span>{category.icon}</span>
                        <span>{category.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">Custom preview</p>
                    <p className="text-xs text-white/45">{customContext.allowedNodeTypes?.length ?? 0} blocks will be visible.</p>
                  </div>
                  <Shield className="h-4 w-4 text-white/35" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {(customContext.availableSensors || []).slice(0, 8).map((sensor) => (
                    <span key={sensor} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-white/55">
                      {sensor}
                    </span>
                  ))}
                  {(customContext.availableSensors || []).length === 0 && (
                    <span className="text-xs text-white/35">No sensors selected yet.</span>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={launchCustom}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:from-violet-400 hover:to-fuchsia-400"
                >
                  Open custom workspace
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </section>
          </main>

          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
            <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-5 shadow-2xl shadow-black/20">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/35">Selected preset</p>
                  <h3 className="mt-1 text-xl font-semibold text-white">{selectedMode.title}</h3>
                </div>
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/50">
                  {selectedMode.launchType}
                </span>
              </div>
              <p className="text-sm leading-6 text-white/60">{selectedMode.description}</p>
              <div className="mt-4 space-y-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/35">Visible categories</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(selectedMode.allowedCategories ?? CUSTOM_DEFAULT_CATEGORIES).map((categoryId) => {
                      const category = NODE_CATEGORIES.find((item) => item.id === categoryId);
                      return (
                        <span key={categoryId} className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/70">
                          {category?.icon ?? "•"} {category?.label ?? categoryId}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-white/35">Focus sensors</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(selectedMode.availableSensors ?? []).map((sensor) => (
                      <span key={sensor} className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
                        {sensor}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-white/35">How it works</p>
              <ul className="mt-3 space-y-3 text-sm leading-6 text-white/60">
                <li>1. Pick a mode or a kit to preconfigure the editor.</li>
                <li>2. The editor opens with the block palette filtered to the allowed hardware.</li>
                <li>3. Admin can create and save custom presets after unlocking the secret panel below.</li>
              </ul>
            </section>

            <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.03] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-white/35">Admin</p>
                  <h3 className="mt-1 text-lg font-semibold text-white">Secret builder</h3>
                </div>
                <Shield className="h-5 w-5 text-emerald-300" />
              </div>

              {!adminUnlocked ? (
                <div className="mt-4 space-y-3">
                  <p className="text-sm leading-6 text-white/60">Unlock this panel with the admin secret to create or delete presets.</p>
                  <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-3 py-2">
                    <KeyRound className="h-4 w-4 text-white/35" />
                    <input
                      value={adminSecretInput}
                      onChange={(e) => setAdminSecretInput(e.target.value)}
                      type={adminSecretInput ? "password" : "text"}
                      placeholder="Enter admin secret"
                      className="w-full bg-transparent text-sm outline-none placeholder:text-white/25"
                    />
                    <button onClick={unlockAdmin} className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black">
                      Unlock
                    </button>
                  </div>
                  <p className="text-[11px] text-white/35">Secret is currently defined in the frontend config and can be moved server-side later.</p>
                </div>
              ) : (
                <div className="mt-4 space-y-4">
                  <div className="grid gap-3">
                    <label className="space-y-2">
                      <span className="text-xs uppercase tracking-[0.24em] text-white/35">Preset name</span>
                      <input
                        value={builder.title}
                        onChange={(e) => setBuilder((prev) => ({ ...prev, title: e.target.value }))}
                        className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm outline-none focus:border-cyan-400/50"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs uppercase tracking-[0.24em] text-white/35">Description</span>
                      <textarea
                        value={builder.description}
                        onChange={(e) => setBuilder((prev) => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm outline-none focus:border-cyan-400/50"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs uppercase tracking-[0.24em] text-white/35">Mode</span>
                      <select
                        value={builder.mode}
                        onChange={(e) => setBuilder((prev) => ({ ...prev, mode: e.target.value as BuilderState["mode"] }))}
                        className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm outline-none focus:border-cyan-400/50"
                      >
                        <option value="guided">Guided</option>
                        <option value="challenge">Challenge</option>
                        <option value="sandbox">Sandbox</option>
                        <option value="full">Full</option>
                        <option value="customize">Customize</option>
                      </select>
                    </label>
                    <label className="space-y-2">
                      <span className="text-xs uppercase tracking-[0.24em] text-white/35">Sensors label list</span>
                      <input
                        value={builder.sensorNames}
                        onChange={(e) => setBuilder((prev) => ({ ...prev, sensorNames: e.target.value }))}
                        className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm outline-none focus:border-cyan-400/50"
                        placeholder="Ultrasonic Sensor, Touch Sensor, GPIO Pin"
                      />
                    </label>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-xs uppercase tracking-[0.24em] text-white/35">Keep categories</span>
                      <span className="text-xs text-white/45">{builder.selectedCategories.length} active</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {NODE_CATEGORIES.map((category) => {
                        const active = builder.selectedCategories.includes(category.id);
                        return (
                          <button
                            key={category.id}
                            onClick={() => toggleBuilderCategory(category.id)}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                              active
                                ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-100"
                                : "border-white/10 bg-black/20 text-white/55 hover:border-white/20 hover:text-white"
                            }`}
                          >
                            <span>{category.icon}</span>
                            <span>{category.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <span className="text-xs uppercase tracking-[0.24em] text-white/35">Keep blocks</span>
                      <span className="text-xs text-white/45">{builder.selectedNodeTypes.length} selected</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-3 space-y-3">
                      {NODE_CATEGORIES.filter((category) => builder.selectedCategories.includes(category.id)).map((category) => (
                        <div key={category.id} className="space-y-2">
                          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-white/35">
                            <span>{category.icon}</span>
                            <span>{category.label}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {category.nodes.map((node) => {
                              const active = builder.selectedNodeTypes.includes(node.type);
                              return (
                                <button
                                  key={node.type}
                                  onClick={() => toggleBuilderNode(node.type)}
                                  className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition-colors ${
                                    active
                                      ? "border-cyan-400/40 bg-cyan-400/15 text-cyan-100"
                                      : "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white"
                                  }`}
                                >
                                  {node.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => setBuilder((prev) => ({
                        ...prev,
                        selectedCategories: CUSTOM_DEFAULT_CATEGORIES,
                        selectedNodeTypes: NODE_CATEGORIES
                          .filter((category) => CUSTOM_DEFAULT_CATEGORIES.includes(category.id))
                          .flatMap((category) => category.nodes.map((node) => node.type)),
                      }))}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/[0.06]"
                    >
                      Reset
                    </button>
                    <button
                      onClick={saveBuilderPreset}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 py-2 text-sm font-semibold text-black transition-colors hover:from-emerald-300 hover:to-cyan-300"
                    >
                      <Save className="h-4 w-4" />
                      Save preset
                    </button>
                  </div>
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}