import { Blocks, SplitSquareHorizontal, Code2, BookOpen, ChevronLeft, Cpu, Sparkles, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";
import type { EditorLaunchContext } from "@/entities/editor-launch/model/config";
import type { ViewMode } from "@/pages/editor/ui/EditorPage";
import { useAnimations } from "@/shared/context/AnimationContext";

interface EditorHeaderProps {
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
  setIsEditing: (v: boolean) => void;
  launchContext?: EditorLaunchContext;
  showTutorialsCatalog: boolean;
  onToggleTutorials: () => void;
  onBackToDashboard?: () => void;
  onSaveAsTutorial?: () => void;
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
  { mode: "split",    icon: <SplitSquareHorizontal className="h-3.5 w-3.5" />, label: "Split"    },
  { mode: "code",     icon: <Code2 className="h-3.5 w-3.5" />,                label: "Code"     },
  { mode: "hardware", icon: <Cpu className="h-3.5 w-3.5" />,                  label: "Hardware" },
];

export function EditorHeader({
  viewMode, setViewMode, setIsEditing,
  launchContext, showTutorialsCatalog, onToggleTutorials, onBackToDashboard,
  onSaveAsTutorial,
}: EditorHeaderProps) {
  const title      = launchContext?.title      ?? "Full Workshop";
  const launchType = launchContext?.launchType ?? "mode";
  const { animationsEnabled, toggle: toggleAnimations } = useAnimations();

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-2 px-2 bg-panel border-b border-subtle">
      {/* Logo */}
      <div className="flex items-center gap-2 px-1 shrink-0">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-gradient">
          <Blocks className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-bold text-body hidden sm:inline">Kakoon</span>
      </div>

      {/* Centre breadcrumb */}
      <div className="hidden flex-1 items-center justify-center px-2 md:flex min-w-0">
        <div className="flex max-w-[42rem] items-center gap-2 rounded-full px-3 py-1.5 bg-raised border border-subtle">
          <span className="badge badge-ghost badge-sm uppercase tracking-wider text-[10px] text-hint">
            {launchType}
          </span>
          <span className="text-xs font-semibold truncate text-body">{title}</span>
        </div>
      </div>

      {/* View mode switcher — Framer Motion layoutId for sliding active indicator */}
      <div className="flex items-center shrink-0">
        <div className="flex rounded-full p-1 gap-0.5 bg-raised">
          {VIEW_TABS.map(({ mode, icon, label }) => (
            <button
              key={mode}
              onClick={() => { setViewMode(mode); if (mode !== "code") setIsEditing(false); }}
              className="relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors"
              style={{ color: viewMode === mode ? "white" : undefined }}
            >
              {/* Sliding background — shared layoutId makes it animate between tabs */}
              {viewMode === mode && (
                <motion.div
                  layoutId="view-tab-indicator"
                  className="absolute inset-0 rounded-full bg-brand-gradient shadow-sm"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
              <span className={`relative z-10 ${viewMode === mode ? "" : "text-sub hover:text-body"}`}>
                {icon}
              </span>
              <span className={`relative z-10 hidden sm:inline ${viewMode === mode ? "" : "text-sub hover:text-body"}`}>
                {label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Animation toggle */}
        <button
          onClick={toggleAnimations}
          title={animationsEnabled ? "Disable animations" : "Enable animations"}
          className={`btn btn-ghost btn-sm gap-1.5 ${animationsEnabled ? "text-primary-c" : "text-sub"}`}
        >
          <Sparkles className={`h-4 w-4 transition-all ${animationsEnabled ? "fill-current opacity-90" : "opacity-40"}`} />
          <span className="hidden md:inline text-xs">{animationsEnabled ? "Anim" : "Anim"}</span>
        </button>

        {onSaveAsTutorial && (
          <button
            onClick={onSaveAsTutorial}
            title="Save current canvas as a tutorial"
            className="btn btn-ghost btn-sm gap-1.5 text-sub hover:text-emerald-400 transition-colors"
          >
            <GraduationCap className="h-4 w-4" />
            <span className="hidden md:inline text-xs">Save Tutorial</span>
          </button>
        )}

        <button
          onClick={onToggleTutorials}
          className={`btn btn-ghost btn-sm gap-1.5 ${showTutorialsCatalog ? "text-secondary-c bg-secondary-tint" : "text-sub"}`}
          title="Tutorials"
        >
          <BookOpen className="h-4 w-4" />
          <span className="hidden md:inline text-xs">Tutorials</span>
        </button>

        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="btn btn-ghost btn-sm gap-1.5 text-sub hidden md:flex"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span className="text-xs">Dashboard</span>
          </button>
        )}
      </div>
    </header>
  );
}
