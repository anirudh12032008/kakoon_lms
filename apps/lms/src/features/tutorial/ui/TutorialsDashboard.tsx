import { useState, useMemo, useRef, useEffect } from "react";
import { Search, ChevronDown, Check, ArrowLeft, Eye, Play, Upload, Loader2, X } from "lucide-react";
import { type Tutorial, BUILTIN_TUTORIALS } from "@/features/tutorial/lib/tutorials";

interface TutorialsDashboardProps {
  onBack: () => void;
  onSelectTutorial: (tutorial: Tutorial, mode: "preview" | "interactive") => void;
  completedTutorialIds: string[];
}

export function TutorialsDashboard({
  onBack,
  onSelectTutorial,
  completedTutorialIds,
}: TutorialsDashboardProps) {
  const [search, setSearch] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<"All" | "Easy" | "Medium" | "Hard">("All");
  const [selectedComponent, setSelectedComponent] = useState<string>("All");
  const [activeModalTutorial, setActiveModalTutorial] = useState<Tutorial | null>(null);

  const [dbTutorials, setDbTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [customList, setCustomList] = useState<Tutorial[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/tutorials")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setDbTutorials(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const tutorials = useMemo(() => {
    let custom: Tutorial[] = [];
    try {
      const stored = localStorage.getItem("Kakoon-custom-tutorials");
      if (stored) custom = JSON.parse(stored) as Tutorial[];
    } catch { }
    // Builtins are always present; DB tutorials override by id if they share one
    const dbIds = new Set(dbTutorials.map((t) => t.id));
    const filteredBuiltins = BUILTIN_TUTORIALS.filter((t) => !dbIds.has(t.id));
    return [...filteredBuiltins, ...dbTutorials, ...custom, ...customList];
  }, [dbTutorials, customList]);

  const handleImportTutorial = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (!json.title || !json.nodes || !json.edges) {
          alert("Invalid Kakoon Tutorial file format. Missing title, nodes, or edges.");
          return;
        }

        const newTutorial: Tutorial = {
          id: json.id || `custom_${Date.now()}`,
          title: json.title,
          description: json.description || "Custom imported robotics tutorial.",
          difficulty: json.difficulty || "Easy",
          board: json.board || "Quark C3",
          components: json.components || ["Custom"],
          nodes: json.nodes,
          edges: json.edges,
          steps: json.steps || [],
        };

        const stored = localStorage.getItem("Kakoon-custom-tutorials");
        const existing: Tutorial[] = stored ? JSON.parse(stored) : [];
        const updated = [...existing.filter((t) => t.id !== newTutorial.id), newTutorial];
        localStorage.setItem("Kakoon-custom-tutorials", JSON.stringify(updated));
        setCustomList(updated);
        alert(`Successfully imported: "${newTutorial.title}"! 🎉`);
      } catch {
        alert("Failed to parse JSON file. Ensure it is a valid tutorial export.");
      }
    };
    reader.readAsText(file);
  };

  const filteredTutorials = useMemo(() => {
    return tutorials.filter((t) => {
      const matchSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase());
      const matchDifficulty = selectedDifficulty === "All" || t.difficulty === selectedDifficulty;
      const matchComponent = selectedComponent === "All" || t.components.includes(selectedComponent);
      return matchSearch && matchDifficulty && matchComponent;
    });
  }, [tutorials, search, selectedDifficulty, selectedComponent]);

  const allComponents = useMemo(() => {
    const set = new Set<string>();
    tutorials.forEach((t) => t.components?.forEach((c) => set.add(c)));
    return ["All", ...Array.from(set)];
  }, [tutorials]);

  return (
    <div className="w-full h-full bg-[#08080a] text-zinc-100 p-6 md:p-8 font-sans overflow-y-auto select-none">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportTutorial}
        accept=".json"
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 bg-[#0f0f12] text-zinc-400 hover:text-white hover:border-zinc-700 transition-all text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Close Examples
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-zinc-800 bg-[#0f0f12] text-zinc-400 hover:text-white hover:border-zinc-700 transition-all text-xs font-semibold"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            Import Example
          </button>
          <button
            onClick={onBack}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-800 hover:text-white transition-all border border-zinc-800 bg-[#0f0f12]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/30 to-cyan-500/30 border border-violet-500/20 shadow-lg shadow-violet-500/5">
          <svg className="w-6 h-6 text-cyan-400 fill-cyan-400" viewBox="0 0 24 24">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Robotics & AI Examples</h1>
          <p className="text-zinc-400 text-xs mt-1">
            Browse and load prepackaged and custom robotics and AI block programs.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-6 mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={selectedComponent}
              onChange={(e) => setSelectedComponent(e.target.value)}
              className="appearance-none bg-[#0e0e12] border border-zinc-800 rounded-lg px-4 py-2 pr-10 text-xs font-medium text-zinc-400 focus:outline-none focus:border-zinc-700 cursor-pointer"
            >
              <option value="All">Sort by components</option>
              {allComponents.filter((c) => c !== "All").map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-3 top-3 text-zinc-500 pointer-events-none" />
          </div>

          <div className="relative min-w-[200px] md:min-w-[260px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#0e0e12] border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs font-medium text-zinc-300 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 w-full"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-[#0e0e12] p-1 border border-zinc-800 rounded-lg self-start md:self-auto">
          {(["All", "Easy", "Medium", "Hard"] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                selectedDifficulty === diff ? "bg-[#18181b] text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Count header */}
      <div className="mb-6">
        <div className="flex items-center justify-between border border-zinc-800/80 bg-[#0e0e12]/60 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold text-white">
              {selectedDifficulty === "All" ? "All Examples" : `${selectedDifficulty} Examples`}
            </span>
            <span className="text-xs text-zinc-500 bg-[#16161a] px-2 py-0.5 rounded-full font-medium">
              {filteredTutorials.length}
            </span>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="text-center py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-zinc-500 text-xs font-medium">Loading robotics examples...</p>
        </div>
      ) : filteredTutorials.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-zinc-900 rounded-2xl">
          <p className="text-zinc-500 text-sm">No examples matching your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTutorials.map((tutorial) => {
            const isCompleted = completedTutorialIds.includes(tutorial.id);
            return (
              <div
                key={tutorial.id}
                onClick={() => setActiveModalTutorial(tutorial)}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-zinc-800 bg-[#0c0c0f]/60 hover:bg-[#0e0e12] transition-all duration-300 hover:border-zinc-700 cursor-pointer shadow-xl"
              >
                <div className="h-44 w-full bg-[#070709] border-b border-zinc-900 p-4 flex items-center justify-center relative overflow-hidden group-hover:bg-[#050507] transition-all">
                  <div className="absolute inset-0 bg-[radial-gradient(#141416_1px,transparent_1px)] [background-size:12px_12px] opacity-60" />
                  <MiniFlowPreview tutorial={tutorial} />
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[9px] font-bold tracking-wider px-2 py-0.5 rounded uppercase ${
                          tutorial.difficulty === "Easy"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10"
                            : tutorial.difficulty === "Medium"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/10"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/10"
                        }`}
                      >
                        {tutorial.difficulty}
                      </span>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase px-1.5 py-0.5 bg-[#16161a] rounded">
                        {tutorial.board}
                      </span>
                      {isCompleted && (
                        <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                          <Check className="w-3.5 h-3.5" />
                          Completed
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-zinc-100 group-hover:text-white line-clamp-2 leading-snug">
                      {tutorial.title}
                    </h3>
                    <p className="text-zinc-500 text-[11px] line-clamp-3 leading-relaxed">
                      {tutorial.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Start / Preview Modal */}
      {activeModalTutorial && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#232328] bg-[#0c0c0e] p-6 shadow-2xl">
            <button
              onClick={() => setActiveModalTutorial(null)}
              className="absolute right-4 top-4 rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mt-3">
              <h2 className="text-lg font-bold text-white px-2">{activeModalTutorial.title}</h2>
              <p className="text-zinc-400 text-xs mt-2">How would you like to load this example?</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8">
              <button
                onClick={() => { onSelectTutorial(activeModalTutorial, "preview"); setActiveModalTutorial(null); }}
                className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl border border-zinc-800 bg-[#121215]/80 hover:bg-[#18181e] text-zinc-300 hover:text-white hover:border-zinc-700 transition-all font-semibold"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800/40 text-zinc-400">
                  <Eye className="w-5 h-5" />
                </div>
                <span className="text-xs">Show Preview</span>
              </button>

              <button
                onClick={() => { onSelectTutorial(activeModalTutorial, "interactive"); setActiveModalTutorial(null); }}
                className="flex flex-col items-center justify-center gap-2 p-5 rounded-xl border border-cyan-500/20 bg-[#101924]/80 hover:bg-[#122335] text-cyan-400 hover:text-cyan-300 hover:border-cyan-500/40 transition-all font-semibold"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-950/40 text-cyan-400">
                  <Play className="w-5 h-5 fill-cyan-400/20" />
                </div>
                <span className="text-xs">Start Tutorial</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniFlowPreview({ tutorial }: { tutorial: Tutorial }) {
  const { nodes, edges } = tutorial;
  if (!nodes || nodes.length === 0) return null;

  const xs = nodes.map((n) => n.position.x);
  const ys = nodes.map((n) => n.position.y);
  const minX = Math.min(...xs) - 40;
  const maxX = Math.max(...xs) + 120;
  const minY = Math.min(...ys) - 30;
  const maxY = Math.max(...ys) + 70;

  const width = maxX - minX;
  const height = maxY - minY;

  const getNodeColor = (type?: string) => {
    switch (type) {
      case "forever_loop": case "for_loop": case "while_loop": case "repeat": return "#10b981";
      case "if_else": return "#f59e0b";
      case "print": case "sleep": case "variable": return "#6366f1";
      case "adc": case "push_button": case "touch_sensor": case "soil_moisture": return "#ec4899";
      case "servo_motor": case "servo_motor_advance": return "#f97316";
      case "oled_display": case "seven_seg": return "#8b5cf6";
      default: return "#3b82f6";
    }
  };

  return (
    <svg viewBox={`${minX} ${minY} ${width} ${height}`} className="w-full h-full p-2 select-none pointer-events-none">
      {edges?.map((edge) => {
        const src = nodes.find((n) => n.id === edge.source);
        const tgt = nodes.find((n) => n.id === edge.target);
        if (!src || !tgt) return null;
        let x1 = src.position.x + 40, y1 = src.position.y + 40;
        let x2 = tgt.position.x + 40, y2 = tgt.position.y;
        if (edge.sourceHandle === "body" || edge.sourceHandle === "true" || edge.sourceHandle === "false") {
          x1 = src.position.x + 80; y1 = src.position.y + 20;
          x2 = tgt.position.x; y2 = tgt.position.y + 20;
        }
        const dx = Math.abs(x2 - x1) * 0.5;
        return (
          <path key={edge.id} d={`M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`}
            fill="none" stroke="#2d2d34" strokeWidth="2.5" strokeDasharray="4 3" />
        );
      })}
      {nodes.map((node) => {
        const readableType = String(node.type || "").split("_")[0].toUpperCase();
        return (
          <g key={node.id}>
            <rect x={node.position.x} y={node.position.y} width="80" height="40" rx="6"
              fill="#0d0d11" stroke={getNodeColor(node.type)} strokeWidth="2.5" className="opacity-90" />
            <circle cx={node.position.x + 40} cy={node.position.y} r="2.5" fill="#52525b" />
            <circle cx={node.position.x + 40} cy={node.position.y + 40} r="2.5" fill="#52525b" />
            {(node.type === "forever_loop" || node.type === "if_else") && (
              <circle cx={node.position.x + 80} cy={node.position.y + 20} r="2.5" fill="#52525b" />
            )}
            <text x={node.position.x + 40} y={node.position.y + 24} textAnchor="middle"
              fill="#94a3b8" fontSize="8" fontWeight="bold" fontFamily="sans-serif">
              {readableType}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
