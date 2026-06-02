import { useMemo, useState, useCallback } from "react";
import { PencilLine, Trash2, Search } from "lucide-react";
import { NODE_CATEGORIES, type NodeCategory, type NodeDef } from "@/entities/node/model";
import { useCustomNodes, type CustomNodeTemplate, isCustomNodeTemplateAllowed } from "@/entities/custom-node/model/customNodes";
import { useModal } from "@/shared/context/ModalContext";

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? "rotate-0" : "-rotate-90"}`}
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    >
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
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
      className="flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-grab active:cursor-grabbing select-none transition-colors group"
      style={{ color: "var(--k-text-muted)" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--k-elevated)"; (e.currentTarget as HTMLDivElement).style.color = "var(--k-text)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ""; (e.currentTarget as HTMLDivElement).style.color = "var(--k-text-muted)"; }}
    >
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: node.previewDot }} />
      <span className="text-[13px] font-medium truncate">{node.label}</span>
    </div>
  );
}

function CustomNodeItem({ node, onRename, onDelete }: {
  node: CustomNodeTemplate;
  onRename: (node: CustomNodeTemplate) => void;
  onDelete: (node: CustomNodeTemplate) => void;
}) {
  const onDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData("application/reactflow-custom-node", JSON.stringify(node));
    e.dataTransfer.effectAllowed = "move";
  }, [node]);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      data-custom-node-id={node.id}
      className="flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-grab active:cursor-grabbing select-none transition-colors group"
      style={{ color: "var(--k-text-muted)" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "var(--k-elevated)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = ""; }}
    >
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: node.previewDot }} />
      <div className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium truncate" style={{ color: "var(--k-text)" }}>{node.label}</span>
        <span className="block text-[10px] uppercase tracking-wider truncate" style={{ color: "var(--k-text-dim)" }}>
          {node.sourceType} · {node.nodes.length} block{node.nodes.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRename(node); }}
          className="btn btn-ghost btn-xs p-1" style={{ color: "var(--k-text-dim)" }} title="Rename">
          <PencilLine className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(node); }}
          className="btn btn-ghost btn-xs p-1" style={{ color: "var(--k-text-dim)" }} title="Delete">
          <Trash2 className="w-3.5 h-3.5" />
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

  return (
    <div>
      <button
        onClick={onToggle}
        data-category-id={category.id}
        className="w-full flex items-center gap-2 px-2 py-2.5 rounded-lg transition-colors"
        style={{ color: "var(--k-text)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--k-elevated)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = ""; }}
      >
        <ChevronDownIcon open={isOpen} />
        <span className="text-[14px] font-semibold flex items-center gap-2">
          <span className="text-base leading-none">{category.icon}</span>
          {category.label}
        </span>
        <span className="ml-auto text-[10px] tabular-nums" style={{ color: "var(--k-text-dim)" }}>
          {visibleNodes.length}
        </span>
      </button>

      {isOpen && (
        <div className="grid grid-cols-2 gap-1 mt-0.5 px-1 pb-1">
          {visibleNodes.map((node) => (
            <NodeItem key={node.type} node={node} />
          ))}
        </div>
      )}
    </div>
  );
}

export function NodePalette({ width = 280, allowedCategories, allowedNodeTypes }: {
  width?: number;
  allowedCategories?: string[];
  allowedNodeTypes?: string[];
}) {
  const [search, setSearch] = useState("");
  const { customNodes, updateCustomNodeLabel, removeCustomNode } = useCustomNodes();
  const { confirm, prompt } = useModal();
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(() => {
    return NODE_CATEGORIES.find((c) => !allowedCategories || allowedCategories.includes(c.id))?.id ?? null;
  });

  const allowedCategorySet  = useMemo(() => allowedCategories ? new Set(allowedCategories)  : null, [allowedCategories]);
  const allowedNodeTypeSet  = useMemo(() => allowedNodeTypes  ? new Set(allowedNodeTypes)    : null, [allowedNodeTypes]);

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
      className="flex flex-col flex-shrink-0 overflow-hidden"
      style={{ width: `${width}px`, background: "var(--k-base-300)", borderRight: "1px solid var(--k-border)" }}
    >
      {/* Header */}
      <div className="px-3 pt-3 pb-2">
        <h2 className="text-sm font-bold mb-2.5" style={{ color: "var(--k-text)" }}>Blocks</h2>
        <label className="input input-sm w-full gap-2" style={{ background: "var(--k-elevated)", border: "1px solid var(--k-border)" }}>
          <Search className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--k-text-dim)" }} />
          <input
            type="text"
            placeholder="Search blocks…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="grow text-xs bg-transparent outline-none"
            style={{ color: "var(--k-text)" }}
          />
        </label>
      </div>

      <div className="h-px mx-3 mb-1" style={{ background: "var(--k-border)" }} />

      {/* Categories */}
      <div className="flex-1 overflow-y-auto px-1.5 pb-3 space-y-0.5">
        {filtered.map((cat) => {
          const isOpen = search.trim() ? true : openCategoryId === cat.id;
          return (
            <CategorySection
              key={cat.id}
              category={cat}
              isOpen={isOpen}
              onToggle={() => setOpenCategoryId(openCategoryId === cat.id ? null : cat.id)}
              allowedNodeTypes={allowedNodeTypeSet ?? undefined}
            />
          );
        })}

        {/* Custom nodes section */}
        <div className="mt-2 rounded-xl p-1.5" style={{ border: "1px solid var(--k-border)", background: "var(--k-base-100)" }}>
          <div className="flex items-center justify-between px-1 py-1 mb-1">
            <span className="text-[13px] font-bold" style={{ color: "var(--k-text)" }}>Custom Nodes</span>
            <span className="badge badge-ghost badge-sm text-[10px]" style={{ color: "var(--k-text-dim)" }}>Saved</span>
          </div>
          <div className="space-y-0.5">
            {visibleCustomNodes.length > 0 ? (
              visibleCustomNodes.map((node) => (
                <CustomNodeItem
                  key={node.id}
                  node={node}
                  onRename={async (target) => {
                    const nextLabel = await prompt("Rename custom node", target.label);
                    if (!nextLabel) return;
                    updateCustomNodeLabel(target.id, nextLabel);
                  }}
                  onDelete={async (target) => {
                    if (!await confirm(`Delete "${target.label}"?`)) return;
                    removeCustomNode(target.id);
                  }}
                />
              ))
            ) : (
              <p className="px-2 py-2.5 text-xs" style={{ color: "var(--k-text-dim)" }}>
                Save any node group to reuse here.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
