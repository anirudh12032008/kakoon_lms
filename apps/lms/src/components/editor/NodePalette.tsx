import { useMemo, useState, useCallback } from "react";
import { NODE_CATEGORIES, type NodeCategory, type NodeDef } from "./nodes";

function SearchIcon() {
  return (
    <svg className="w-3.5 h-3.5 text-[#6b7280]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}

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
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-grab active:cursor-grabbing select-none transition-colors hover:bg-[#1a1a20] group"
    >
      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: node.previewDot }} />
      <span className="text-[15px] text-[#d4d4d8] group-hover:text-white transition-colors font-medium truncate">
        {node.label}
      </span>
    </div>
  );
}

function CategorySection({
  category, isOpen, onToggle, allowedNodeTypes,
}: {
  category: NodeCategory; isOpen: boolean; onToggle: () => void;
  allowedNodeTypes?: Set<string>;
}) {
  const visibleNodes = allowedNodeTypes ? category.nodes.filter((node) => allowedNodeTypes.has(node.type)) : category.nodes;

  if (visibleNodes.length === 0) return null;

  return (
    <div>
      <button
        onClick={onToggle}
        data-category-id={category.id}
        className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-[#1a1a20] transition-colors group"
      >
        <ChevronDownIcon open={isOpen} />
        <span className="text-[15.5px] font-semibold text-white flex items-center gap-2.5">
          <span className="text-lg leading-none">{category.icon}</span>
          {category.label}
        </span>
      </button>

      {isOpen && (
        <div className="grid grid-cols-2 gap-2 mt-1 px-1">
          {visibleNodes.map((node) => (
            <NodeItem key={node.type} node={node} />
          ))}
        </div>
      )}
    </div>
  );
}

export function NodePalette({
  width = 280,
  allowedCategories,
  allowedNodeTypes,
}: {
  width?: number;
  allowedCategories?: string[];
  allowedNodeTypes?: string[];
}) {
  const [search, setSearch] = useState("");
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(() => {
    const firstAllowed = NODE_CATEGORIES.find((category) => !allowedCategories || allowedCategories.includes(category.id));
    return firstAllowed?.id ?? null;
  });
  const allowedCategorySet = useMemo(() => allowedCategories ? new Set(allowedCategories) : null, [allowedCategories]);
  const allowedNodeTypeSet = useMemo(() => allowedNodeTypes ? new Set(allowedNodeTypes) : null, [allowedNodeTypes]);

  const filtered = search.trim()
    ? NODE_CATEGORIES.map((cat) => ({
        ...cat,
        nodes: cat.nodes.filter((n) => n.label.toLowerCase().includes(search.toLowerCase())),
      })).filter((cat) => cat.nodes.length > 0)
        .filter((cat) => !allowedCategorySet || allowedCategorySet.has(cat.id))
    : NODE_CATEGORIES.filter((cat) => !allowedCategorySet || allowedCategorySet.has(cat.id));

  return (
    <div
      className="flex flex-col flex-shrink-0 overflow-hidden"
      style={{ width: `${width}px`, background: "#111113", borderRight: "1px solid #1f1f23" }}
    >
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-sm font-semibold text-white mb-3">System Blocks</h2>
        <div className="relative flex items-center">
          <div className="absolute left-2.5"><SearchIcon /></div>
          <input
            type="text"
            placeholder="Search Blocks"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#1a1a20] border border-[#27272a] rounded-lg text-[#a1a1aa] placeholder:text-[#52525b] outline-none focus:border-[#7c3aed] transition-colors"
          />
        </div>
      </div>

      <div className="h-px bg-[#1f1f23] mx-4 mb-2" />

      <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-0.5 scrollbar-thin scrollbar-thumb-[#27272a] scrollbar-track-transparent">
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
        <div className="h-px bg-[#1f1f23] my-2" />
      </div>
    </div>
  );
}
