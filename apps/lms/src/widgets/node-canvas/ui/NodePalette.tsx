import { useMemo, useState, useCallback } from "react";
import { PencilLine, Trash2, Search } from "lucide-react";
import { NODE_CATEGORIES, type NodeCategory, type NodeDef } from "@/entities/node/model";
import { useCustomNodes, type CustomNodeTemplate, isCustomNodeTemplateAllowed } from "@/entities/custom-node/model/customNodes";
import { useModal } from "@/shared/context/ModalContext";
import { GlobalAdvancedToggle } from "@/shared/context/NodeModeContext";

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
  return { dot: "#71717a", text: "text-zinc-400", bg: "bg-zinc-500/10" };
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
      className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-grab active:cursor-grabbing select-none transition-colors text-sub hover:bg-hover hover:text-body"
    >
      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: node.previewDot }} />
      <span className="text-[12px] font-medium truncate leading-none">{node.label}</span>
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
        <span className="block text-[12px] font-medium truncate text-body">{node.label}</span>
        <span className="block text-[10px] truncate text-hint">{node.sourceType} · {node.nodes.length}b</span>
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
    <div className="overflow-hidden">
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors group ${isOpen ? c.bg : "hover:bg-hover"}`}
      >
        <svg
          className={`w-3 h-3 shrink-0 transition-transform duration-150 ${isOpen ? `rotate-90 ${c.text}` : "text-hint rotate-0"}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
        >
          <polyline points="9 18 15 12 9 6"/>
        </svg>
        <span className={`text-[13px] font-semibold leading-none transition-colors ${isOpen ? c.text : "text-sub group-hover:text-body"}`}>
          {category.icon} {category.label}
        </span>
        <span className={`ml-auto text-[10px] font-bold tabular-nums ${isOpen ? c.text : "text-hint"}`}>
          {visibleNodes.length}
        </span>
      </button>

      {isOpen && (
        <div className="grid grid-cols-2 gap-0.5 px-1 pb-1.5">
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
        <p className="text-[11px] font-bold uppercase tracking-widest text-hint mb-2">Blocks</p>
        <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 bg-hover border border-subtle">
          <Search className="w-3.5 h-3.5 shrink-0 text-hint" />
          <input
            type="text" placeholder="Search…"
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="grow text-xs bg-transparent outline-none text-body placeholder:text-hint"
          />
        </div>
      </div>

      {/* Category list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
        {filtered.map((cat) => {
          const isOpen = search.trim() ? true : openCategoryId === cat.id;
          return (
            <CategorySection key={cat.id} category={cat} isOpen={isOpen}
              onToggle={() => setOpenCategoryId(openCategoryId === cat.id ? null : cat.id)}
              allowedNodeTypes={allowedNodeTypeSet ?? undefined} />
          );
        })}

        {/* Custom nodes */}
        <div className="mt-2 pt-2 border-t border-subtle">
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-widest text-hint">Custom</span>
            <span className="text-[10px] text-hint">{visibleCustomNodes.length} saved</span>
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
              <p className="px-2 py-2 text-[11px] text-hint italic">
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
