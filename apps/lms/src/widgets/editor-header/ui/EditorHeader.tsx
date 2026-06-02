import { Blocks, SplitSquareHorizontal, Code2, BookOpen, ChevronLeft } from "lucide-react";
import type { EditorLaunchContext } from "@/entities/editor-launch/model/config";
import type { ViewMode } from "@/pages/editor/ui/EditorPage";

interface EditorHeaderProps {
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
  setIsEditing: (v: boolean) => void;
  launchContext?: EditorLaunchContext;
  showTutorialsCatalog: boolean;
  onToggleTutorials: () => void;
  onBackToDashboard?: () => void;
}

const VIEW_TABS: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
  {
    mode: "blocks",
    icon: (
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/>
        <circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>
        <line x1="8" y1="6" x2="16" y2="6"/><line x1="6" y1="8" x2="6" y2="16"/>
        <line x1="18" y1="8" x2="18" y2="16"/><line x1="8" y1="18" x2="16" y2="18"/>
      </svg>
    ),
    label: "Blocks",
  },
  { mode: "split", icon: <SplitSquareHorizontal className="h-3.5 w-3.5" />, label: "Split" },
  { mode: "code",  icon: <Code2 className="h-3.5 w-3.5" />,               label: "Code"  },
];

export function EditorHeader({
  viewMode, setViewMode, setIsEditing,
  launchContext, showTutorialsCatalog, onToggleTutorials, onBackToDashboard,
}: EditorHeaderProps) {
  const title      = launchContext?.title       ?? "Full Workspace";
  const launchType = launchContext?.launchType  ?? "mode";

  return (
    <header
      className="flex h-12 shrink-0 items-center justify-between gap-2 px-2 border-b"
      style={{ background: "var(--k-base-200)", borderColor: "var(--k-border)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-1 shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg"
          style={{ background: "linear-gradient(135deg, var(--k-primary), var(--k-secondary))" }}>
          <Blocks className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-bold text-white hidden sm:inline">Kakoon</span>
      </div>

      {/* Centre breadcrumb */}
      <div className="hidden flex-1 items-center justify-center px-2 md:flex min-w-0">
        <div className="flex max-w-[42rem] items-center gap-2 rounded-full px-3 py-1.5 text-xs"
          style={{ background: "var(--k-base-300)", border: "1px solid var(--k-border)" }}>
          <span className="badge badge-ghost badge-sm uppercase tracking-wider text-[10px]"
            style={{ color: "var(--k-text-dim)" }}>
            {launchType}
          </span>
          <span className="font-semibold truncate" style={{ color: "var(--k-text)" }}>{title}</span>
        </div>
      </div>

      {/* View mode switcher */}
      <div className="flex items-center shrink-0">
        <div className="flex rounded-full p-1 gap-0.5"
          style={{ background: "var(--k-base-300)" }}>
          {VIEW_TABS.map(({ mode, icon, label }) => (
            <button
              key={mode}
              onClick={() => { setViewMode(mode); if (mode !== "code") setIsEditing(false); }}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                viewMode === mode
                  ? "text-white shadow-sm"
                  : "hover:text-white"
              }`}
              style={viewMode === mode
                ? { background: "linear-gradient(135deg, var(--k-primary), var(--k-secondary))", color: "white" }
                : { color: "var(--k-text-muted)" }
              }
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onToggleTutorials}
          className={`btn btn-sm btn-ghost gap-1.5 ${showTutorialsCatalog ? "btn-active" : ""}`}
          style={showTutorialsCatalog ? { color: "var(--k-secondary)" } : { color: "var(--k-text-muted)" }}
          title="Tutorials"
        >
          <BookOpen className="h-4 w-4" />
          <span className="hidden md:inline text-xs">Tutorials</span>
        </button>

        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="btn btn-sm btn-ghost gap-1.5 hidden md:flex"
            style={{ color: "var(--k-text-muted)" }}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="text-xs">Dashboard</span>
          </button>
        )}
      </div>
    </header>
  );
}
