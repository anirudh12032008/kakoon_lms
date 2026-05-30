import { Blocks, SplitSquareHorizontal, Code2 } from "lucide-react";
import type { EditorLaunchContext } from "@/config/editorLaunch";
import type { ViewMode } from "@/pages/editor/EditorPage";

interface EditorHeaderProps {
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
  setIsEditing: (v: boolean) => void;
  launchContext?: EditorLaunchContext;
  showTutorialsCatalog: boolean;
  onToggleTutorials: () => void;
  onBackToDashboard?: () => void;
}

export function EditorHeader({
  viewMode, setViewMode, setIsEditing,
  launchContext, showTutorialsCatalog, onToggleTutorials, onBackToDashboard,
}: EditorHeaderProps) {
  const title = launchContext?.title ?? "Full Workspace";
  const description = launchContext?.description ?? "All blocks are available.";
  const launchType = launchContext?.launchType ?? "mode";

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-[#1f1f23] bg-[#0c0c0f] px-2 gap-1">
      <div className="flex items-center gap-1.5 px-1">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-500">
          <Blocks className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-white hidden sm:inline">Kakoon</span>
      </div>

      <div className="hidden min-w-0 flex-1 items-center justify-center px-2 md:flex">
        <div className="flex max-w-[42rem] items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/70">
          <span className="rounded-full bg-white/10 px-2 py-1 uppercase tracking-[0.24em] text-white/50">{launchType}</span>
          <span className="truncate font-medium text-white">{title}</span>
          <span className="truncate text-white/45">{description}</span>
        </div>
      </div>

      <div className="flex items-center">
        <div className="flex rounded-full bg-[#1a1a1f] p-1">
          {([
            { mode: "blocks" as ViewMode, icon: (
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="6" cy="6" r="2"/><circle cx="18" cy="6" r="2"/><circle cx="6" cy="18" r="2"/><circle cx="18" cy="18" r="2"/>
                <line x1="8" y1="6" x2="16" y2="6"/><line x1="6" y1="8" x2="6" y2="16"/>
                <line x1="18" y1="8" x2="18" y2="16"/><line x1="8" y1="18" x2="16" y2="18"/>
              </svg>
            ), label: "Nodes" },
            { mode: "split" as ViewMode, icon: <SplitSquareHorizontal className="h-3.5 w-3.5" />, label: "Split" },
            { mode: "code" as ViewMode, icon: <Code2 className="h-3.5 w-3.5" />, label: "Python" },
          ] as const).map(({ mode, icon, label }) => (
            <button
              key={mode}
              onClick={() => { setViewMode(mode); if (mode !== "code") setIsEditing(false); }}
              className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                viewMode === mode
                  ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="hidden h-8 items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 text-xs text-white/75 hover:bg-white/[0.08] md:flex"
          >
            <Blocks className="h-3.5 w-3.5" />
            Dashboard
          </button>
        )}

        <div className="hidden md:flex items-center gap-2 rounded-md bg-[#1a1a1f] px-3 py-1.5">
          <span className="text-xs text-zinc-400">Kakoon Editor</span>
        </div>

        <button
          onClick={onToggleTutorials}
          className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
            showTutorialsCatalog
              ? "bg-violet-500/20 text-violet-400"
              : "text-zinc-400 hover:bg-zinc-800 hover:text-violet-400"
          }`}
          title="Robotics Tutorials"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </button>
      </div>
    </header>
  );
}
