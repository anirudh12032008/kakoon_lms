import { useEffect, useRef, useState } from "react";
import {
  Blocks, SplitSquareHorizontal, Code2, BookOpen, ChevronLeft, Cpu, Sparkles,
  GraduationCap, Download, Upload, Cloud, CloudOff, Check, Loader2, MoreHorizontal,
} from "lucide-react";
import { motion } from "framer-motion";
import type { EditorLaunchContext } from "@/entities/editor-launch/model/config";
import type { ViewMode } from "@/pages/editor/ui/EditorPage";
import type { SyncState } from "@/features/editor/save-draft/model/useCourseSync";
import { useAnimations } from "@/shared/context/AnimationContext";
import { ThemeSwitcher } from "@/shared/theme/ThemeSwitcher";
import { PlayerChip, AchievementsModal } from "@/entities/gamification";

interface EditorHeaderProps {
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
  setIsEditing: (v: boolean) => void;
  launchContext?: EditorLaunchContext;
  isCourse?: boolean;
  syncState?: SyncState;
  showTutorialsCatalog: boolean;
  onToggleTutorials: () => void;
  onBackToDashboard?: () => void;
  onSaveAsTutorial?: () => void;
  onExportProject?: () => void;
  onImportProject?: () => void;
}

/** Live "saved to your account" indicator for course sessions. */
function SyncIndicator({ state }: { state: SyncState }) {
  const map: Record<SyncState, { icon: React.ReactNode; label: string; cls: string }> = {
    idle: { icon: <Cloud className="h-3.5 w-3.5" />, label: "Synced", cls: "text-hint" },
    loading: { icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />, label: "Loading…", cls: "text-hint" },
    saving: { icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />, label: "Saving…", cls: "text-info-c" },
    saved: { icon: <Check className="h-3.5 w-3.5" />, label: "Saved", cls: "text-success-c" },
    error: { icon: <CloudOff className="h-3.5 w-3.5" />, label: "Save failed", cls: "text-error-c" },
  };
  const s = map[state];
  return (
    <div
      className={`flex items-center gap-1.5 rounded-full border border-subtle bg-raised px-2.5 py-1 text-[11px] font-semibold ${s.cls}`}
      title="Your work is saved to your Kokoon account"
    >
      {s.icon}
      <span className="hidden sm:inline">{s.label}</span>
    </div>
  );
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

/** Overflow menu for secondary project actions — keeps the header calm. */
function MoreMenu({ onImportProject, onExportProject, onSaveAsTutorial }: {
  onImportProject?: () => void;
  onExportProject?: () => void;
  onSaveAsTutorial?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { animationsEnabled, toggle: toggleAnimations } = useAnimations();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [open]);

  const item =
    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-sub transition-colors hover:bg-hover hover:text-body";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="More actions"
        className={`btn btn-ghost btn-sm px-2 ${open ? "bg-hover text-body" : "text-sub"}`}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[1200] mt-1.5 w-56 rounded-xl border border-subtle bg-panel p-1.5 shadow-2xl">
          {onImportProject && (
            <button onClick={() => { onImportProject(); setOpen(false); }} className={item}>
              <Upload className="h-4 w-4" /> Import project…
            </button>
          )}
          {onExportProject && (
            <button onClick={() => { onExportProject(); setOpen(false); }} className={item}>
              <Download className="h-4 w-4" /> Export project
            </button>
          )}
          {onSaveAsTutorial && (
            <button onClick={() => { onSaveAsTutorial(); setOpen(false); }} className={item}>
              <GraduationCap className="h-4 w-4" /> Save as tutorial
            </button>
          )}
          <div className="my-1 border-t border-subtle" />
          <button onClick={toggleAnimations} className={item}>
            <Sparkles className={`h-4 w-4 ${animationsEnabled ? "text-primary-c" : "opacity-40"}`} />
            Animations
            <span className={`ml-auto text-[10px] font-bold uppercase ${animationsEnabled ? "text-primary-c" : "text-hint"}`}>
              {animationsEnabled ? "On" : "Off"}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

export function EditorHeader({
  viewMode, setViewMode, setIsEditing,
  launchContext, isCourse, syncState, showTutorialsCatalog, onToggleTutorials, onBackToDashboard,
  onSaveAsTutorial, onExportProject, onImportProject,
}: EditorHeaderProps) {
  const title      = launchContext?.title      ?? "Full Workshop";
  const launchType = isCourse ? "course" : (launchContext?.launchType ?? "mode");
  const [showAchievements, setShowAchievements] = useState(false);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-2 px-2 bg-panel border-b border-subtle">
      {/* Logo + back */}
      <div className="flex items-center gap-1 shrink-0">
        <div className="flex items-center gap-2 px-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-gradient">
            <Blocks className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold text-body hidden lg:inline">Kokoon</span>
        </div>
        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="btn btn-ghost btn-sm gap-1 px-2 text-sub"
            title={isCourse ? "Back to course" : "Back to dashboard"}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden md:inline text-xs">{isCourse ? "Course" : "Dashboard"}</span>
          </button>
        )}
      </div>

      {/* Centre breadcrumb */}
      <div className="hidden flex-1 items-center justify-center px-2 md:flex min-w-0">
        <div className="flex max-w-[42rem] items-center gap-2 rounded-full px-3 py-1.5 bg-raised border border-subtle">
          {isCourse && <GraduationCap className="h-3.5 w-3.5 text-primary-c shrink-0" />}
          <span className="badge badge-ghost badge-sm uppercase tracking-wider text-[10px] text-hint">
            {launchType}
          </span>
          <span className="text-xs font-semibold truncate text-body">{title}</span>
          {isCourse && syncState && <SyncIndicator state={syncState} />}
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

      {/* Right actions — only the essentials stay top-level */}
      <div className="flex items-center gap-1 shrink-0">
        <PlayerChip compact onClick={() => setShowAchievements(true)} />

        <button
          onClick={onToggleTutorials}
          className={`btn btn-ghost btn-sm gap-1.5 ${showTutorialsCatalog ? "text-secondary-c bg-secondary-tint" : "text-sub"}`}
          title="Tutorials"
        >
          <BookOpen className="h-4 w-4" />
          <span className="hidden lg:inline text-xs">Tutorials</span>
        </button>

        <ThemeSwitcher compact />

        <MoreMenu
          onImportProject={onImportProject}
          onExportProject={onExportProject}
          onSaveAsTutorial={onSaveAsTutorial}
        />
      </div>

      <AchievementsModal open={showAchievements} onClose={() => setShowAchievements(false)} />
    </header>
  );
}
