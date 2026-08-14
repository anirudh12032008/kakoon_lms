import { useMemo, useState, useCallback, useEffect } from "react";
import { PencilLine, Trash2, Search, X } from "lucide-react";
import { NODE_CATEGORIES, type NodeCategory, type NodeDef } from "@/entities/node/model";
import { NODE_HINTS } from "@/entities/node/model/hints";
import { useCustomNodes, type CustomNodeTemplate, isCustomNodeTemplateAllowed } from "@/entities/custom-node/model/customNodes";
import { useModal } from "@/shared/context/ModalContext";
import { GlobalAdvancedToggle } from "@/shared/context/NodeModeContext";
import { useTutorialFocus } from "@/features/editor/tutorial/model/tutorialFocus";

// Color accent per category id — purely visual, easy to change
const CAT_COLORS: Record<string, { dot: string; text: string; bg: string }> = {
  general:   { dot: "#a78bfa", text: "text-violet-400",  bg: "bg-violet-500/10"  },
  loop:      { dot: "#34d399", text: "text-emerald-400", bg: "bg-emerald-500/10" },
  condition: { dot: "#60a5fa", text: "text-blue-400",    bg: "bg-blue-500/10"    },
  gpio:      { dot: "#f59e0b", text: "text-amber-400",   bg: "bg-amber-500/10"   },
  sensor:    { dot: "#f472b6", text: "text-pink-400",    bg: "bg-pink-500/10"    },
  iot:       { dot: "#2dd4bf", text: "text-teal-400",    bg: "bg-teal-500/10"    },
  display:   { dot: "#c084fc", text: "text-purple-400",  bg: "bg-purple-500/10"  },
  motors:    { dot: "#fb923c", text: "text-orange-400",  bg: "bg-orange-500/10"  },
  comms:     { dot: "#38bdf8", text: "text-sky-400",     bg: "bg-sky-500/10"     },
  logic:     { dot: "#4ade80", text: "text-green-400",   bg: "bg-green-500/10"   },
  power:     { dot: "#facc15", text: "text-yellow-400",  bg: "bg-yellow-500/10"  },
  tools:     { dot: "#94a3b8", text: "text-slate-400",   bg: "bg-slate-500/10"   },
  math:      { dot: "#e879f9", text: "text-fuchsia-400", bg: "bg-fuchsia-500/10" },
};

function fallbackColor() {
  return { dot: "#71717a", text: "text-[var(--k-muted)]", bg: "bg-[var(--k-base-400)]" };
}

function NodeItem({ node }: { node: NodeDef }) {
  const onDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData("application/reactflow-nodetype", node.type);
    e.dataTransfer.effectAllowed = "move";
  }, [node.type]);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      data-node-type={node.type}
      title={NODE_HINTS[node.type]}
      className="group/item flex items-center gap-2 rounded-lg border border-subtle bg-panel px-2.5 py-2 cursor-grab active:cursor-grabbing select-none transition-all text-sub hover:text-body hover:-translate-y-px hover:shadow-sm"
      style={{ ["--node-c" as string]: node.previewDot }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = node.previewDot + "66")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "")}
    >
      <div className="w-2 h-2 rounded-full shrink-0 transition-transform group-hover/item:scale-125" style={{ backgroundColor: node.previewDot }} />
      <span className="text-[12.5px] font-semibold truncate leading-tight">{node.label}</span>
    </div>
  );
}

function CustomNodeItem({ node, onRename, onDelete }: {
  node: CustomNodeTemplate;
  onRename: (n: CustomNodeTemplate) => void;
  onDelete: (n: CustomNodeTemplate) => void;
}) {
  const onDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData("application/reactflow-custom-node", JSON.stringify(node));
    e.dataTransfer.effectAllowed = "move";
  }, [node]);

  return (
    <div
      draggable onDragStart={onDragStart}
      className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-grab active:cursor-grabbing select-none transition-colors hover:bg-hover group"
    >
      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: node.previewDot }} />
      <div className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium truncate text-body">{node.label}</span>
        <span className="block text-[11px] truncate text-hint">{node.sourceType} · {node.nodes.length}b</span>
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRename(node); }}
          className="p-1 rounded text-hint hover:text-body hover:bg-hover" title="Rename">
          <PencilLine className="w-3 h-3" />
        </button>
        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(node); }}
          className="p-1 rounded text-hint hover:text-red-400 hover:bg-red-500/10" title="Delete">
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function CategorySection({ category, isOpen, onToggle, allowedNodeTypes }: {
  category: NodeCategory; isOpen: boolean; onToggle: () => void;
  allowedNodeTypes?: Set<string>;
}) {
  const visibleNodes = allowedNodeTypes
    ? category.nodes.filter((n) => allowedNodeTypes.has(n.type))
    : category.nodes;

  if (visibleNodes.length === 0) return null;

  const c = CAT_COLORS[category.id] ?? fallbackColor();

  return (
    <div className={`overflow-hidden rounded-xl border transition-colors ${isOpen ? "border-subtle bg-panel" : "border-transparent"}`}>
      <button
        onClick={onToggle}
        data-category-id={category.id}
        className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-xl transition-colors group ${isOpen ? "" : "hover:bg-hover"}`}
      >
        {/* Colored icon chip */}
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[13px]"
          style={{ backgroundColor: c.dot + (isOpen ? "2e" : "1c"), color: c.dot }}
        >
          {category.icon}
        </span>
        <span className={`text-[13px] font-bold leading-tight transition-colors ${isOpen ? c.text : "text-sub group-hover:text-body"}`}>
          {category.label}
        </span>
        <span className={`ml-auto text-[10.5px] font-bold tabular-nums px-1.5 py-0.5 rounded-md ${isOpen ? `${c.text} ${c.bg}` : "text-hint"}`}>
          {visibleNodes.length}
        </span>
        <svg
          className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${isOpen ? `rotate-90 ${c.text}` : "text-hint rotate-0"}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
        >
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>

      {isOpen && (
        <div className="anim-cat-in grid grid-cols-2 gap-1.5 px-2 pb-2 pt-0.5">
          {visibleNodes.map((node) => <NodeItem key={node.type} node={node} />)}
        </div>
      )}
    </div>
  );
}

export function NodePalette({ width = 272, allowedCategories, allowedNodeTypes }: {
  width?: number;
  allowedCategories?: string[];
  allowedNodeTypes?: string[];
}) {
  const [search, setSearch] = useState("");
  const { customNodes, updateCustomNodeLabel, removeCustomNode } = useCustomNodes();
  const { confirm, prompt } = useModal();
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(() =>
    NODE_CATEGORIES.find((c) => !allowedCategories || allowedCategories.includes(c.id))?.id ?? null
  );

  // When an interactive tutorial points at a block in a collapsed section, open
  // that section automatically so the highlight + drag hand have a visible target.
  const focusCategoryId = useTutorialFocus((s) => s.focusCategoryId);
  useEffect(() => {
    if (focusCategoryId) setOpenCategoryId(focusCategoryId);
  }, [focusCategoryId]);

  const allowedCategorySet = useMemo(() => allowedCategories ? new Set(allowedCategories) : null, [allowedCategories]);
  const allowedNodeTypeSet  = useMemo(() => allowedNodeTypes  ? new Set(allowedNodeTypes)  : null, [allowedNodeTypes]);

  const visibleCustomNodes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customNodes.filter((n) => {
      if (!isCustomNodeTemplateAllowed(n, allowedNodeTypeSet ?? undefined)) return false;
      if (!q) return true;
      return n.label.toLowerCase().includes(q) || n.sourceType.toLowerCase().includes(q);
    });
  }, [customNodes, search, allowedNodeTypeSet]);

  const filtered = search.trim()
    ? NODE_CATEGORIES
        .map((cat) => ({ ...cat, nodes: cat.nodes.filter((n) => n.label.toLowerCase().includes(search.toLowerCase())) }))
        .filter((cat) => cat.nodes.length > 0 && (!allowedCategorySet || allowedCategorySet.has(cat.id)))
    : NODE_CATEGORIES.filter((cat) => !allowedCategorySet || allowedCategorySet.has(cat.id));

  return (
    <div
      className="flex flex-col shrink-0 overflow-hidden bg-raised border-r border-subtle"
      style={{ width: `${width}px` }}
    >
      {/* Header */}
      <div className="px-3 pt-3 pb-2.5 border-b border-subtle">
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 bg-panel border border-subtle focus-within:border-primary/60 focus-within:shadow-sm transition-all">
          <Search className="w-4 h-4 shrink-0 text-hint" />
          <input
            type="text" placeholder="Search blocks…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="grow min-w-0 text-sm bg-transparent outline-none text-body placeholder:text-hint"
          />
          {search && (
            <button onClick={() => setSearch("")} className="shrink-0 rounded-full p-0.5 text-hint hover:bg-hover hover:text-body" title="Clear search">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Category list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {filtered.length === 0 && search.trim() && (
          <div className="flex flex-col items-center gap-1.5 px-3 py-8 text-center">
            <span className="text-xl"></span>
            <p className="text-[13px] font-semibold text-sub">No blocks found</p>
            <p className="text-[11.5px] text-hint">Try a different word, like "motor" or "sensor".</p>
          </div>
        )}
        {filtered.map((cat) => {
          const isOpen = search.trim() ? true : openCategoryId === cat.id;
          return (
            <CategorySection key={cat.id} category={cat} isOpen={isOpen}
              onToggle={() => setOpenCategoryId(openCategoryId === cat.id ? null : cat.id)}
              allowedNodeTypes={allowedNodeTypeSet ?? undefined} />
          );
        })}

        {/* Custom nodes */}
        <div className="mt-3 pt-3 border-t border-subtle">
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[12px] font-bold uppercase tracking-widest text-hint">Custom</span>
            <span className="text-[11px] text-hint">{visibleCustomNodes.length} saved</span>
          </div>
          <div className="space-y-0.5">
            {visibleCustomNodes.length > 0 ? (
              visibleCustomNodes.map((node) => (
                <CustomNodeItem key={node.id} node={node}
                  onRename={async (t) => {
                    const next = await prompt("Rename custom node", t.label);
                    if (!next) return;
                    updateCustomNodeLabel(t.id, next);
                  }}
                  onDelete={async (t) => {
                    if (!await confirm(`Delete "${t.label}"?`)) return;
                    removeCustomNode(t.id);
                  }}
                />
              ))
            ) : (
              <p className="px-2 py-2 text-[12px] text-hint italic">
                Save a node group to reuse it here.
              </p>
            )}
          </div>
        </div>
      </div>
      <GlobalAdvancedToggle />
    </div>
  );
}
