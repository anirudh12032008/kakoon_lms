import { APP_NAME } from "@/shared/config/brand";
import { useEffect, useRef, useState } from "react";
import {
  SplitSquareHorizontal, Code2, BookOpen, ChevronLeft, Cpu, Sparkles,
  GraduationCap, Download, Upload, Cloud, CloudOff, Check, Loader2, MoreHorizontal,
  Save, Pencil, Share2, Eye, User,
} from "lucide-react";
import { motion } from "framer-motion";
import type { EditorLaunchContext } from "@/entities/editor-launch/model/config";
import type { ViewMode } from "@/pages/editor/ui/EditorPage";
import type { SyncState } from "@/features/editor/save-draft/model/useCourseSync";
import { useAnimations } from "@/shared/context/AnimationContext";
import { ThemeSwitcher } from "@/shared/theme/ThemeSwitcher";
import { BOARDS, BOARD_ORDER, useBoardStore, type BoardId } from "@/entities/board";
import { PlayerChip, AchievementsModal } from "@/entities/gamification";
import { BrandMark } from "@/shared/ui/BrandMark";

interface EditorHeaderProps {
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
  setIsEditing: (v: boolean) => void;
  launchContext?: EditorLaunchContext;
  isCourse?: boolean;
  syncState?: SyncState;
  /** Set for a saved-project session - drives the "Saved/Saving" project chip. */
  projectSyncState?: SyncState;
  /** Name of the active saved project, if any. */
  projectName?: string | null;
  /** Whether the Save-to-projects action is available (non-course sessions). */
  canSaveProject?: boolean;
  /** Save the current workspace as a project, or rename the active one. */
  onSaveProject?: () => void;
  /** Copy a public share link for the project. */
  onShareProject?: () => void;
  /** Transient "Copied!" feedback for the share button. */
  shareCopied?: boolean;
  /** View-only shared session - hides editing actions, shows author label. */
  readOnly?: boolean;
  sharedAuthorName?: string;
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
    idle: { icon: <Cloud className="h-3.5 w-3.5" />, label: "Synced", cls: "text-sub" },
    loading: { icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />, label: "Loading…", cls: "text-sub" },
    saving: { icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />, label: "Saving…", cls: "text-info-c" },
    saved: { icon: <Check className="h-3.5 w-3.5" />, label: "Saved", cls: "text-success-c" },
    error: { icon: <CloudOff className="h-3.5 w-3.5" />, label: "Save failed", cls: "text-error-c" },
  };
  const s = map[state];
  return (
    <div
      role="status"
      className={`flex shrink-0 items-center gap-1.5 text-xs font-semibold ${s.cls}`}
      title={`Your work is saved to your ${APP_NAME} account`}
    >
      {s.icon}
      <span className="sr-only xl:not-sr-only">{s.label}</span>
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

/** Overflow menu for secondary project actions - keeps the header calm. */
function MoreMenu({ onImportProject, onExportProject, onSaveAsTutorial, compactItems }: {
  /** Header actions that fold into this menu below the `lg` breakpoint. */
  compactItems: { label: string; icon: React.ReactNode; onClick: () => void }[];
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
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("mousedown", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item =
    "flex min-h-9 w-full items-center gap-2.5 rounded-md px-3 text-left text-[13px] font-semibold text-sub transition-colors hover:bg-hover hover:text-body";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="More actions"
        aria-label="More actions"
        aria-haspopup="true"
        aria-expanded={open}
        className={`btn btn-ghost btn-sm px-2 ${open ? "bg-hover text-body" : "text-sub"}`}
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
      </button>

      {open && (
        <div className="anim-pop-in absolute right-0 top-full z-[1200] mt-1.5 w-56 rounded-lg border border-subtle bg-panel p-1.5 shadow-xl">
          {compactItems.map((it) => (
            <button key={it.label} onClick={() => { it.onClick(); setOpen(false); }} className={`${item} lg:hidden`}>
              {it.icon} {it.label}
            </button>
          ))}
          {compactItems.length > 0 && <div className="my-1 border-t border-subtle lg:hidden" />}
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
          <button onClick={toggleAnimations} aria-pressed={animationsEnabled} className={item}>
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Animations
            <span className={`ml-auto text-xs font-semibold ${animationsEnabled ? "text-primary-c" : "text-sub"}`}>
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
  launchContext, isCourse, syncState,
  projectSyncState, projectName, canSaveProject, onSaveProject,
  onShareProject, shareCopied, readOnly, sharedAuthorName,
  showTutorialsCatalog, onToggleTutorials, onBackToDashboard,
  onSaveAsTutorial, onExportProject, onImportProject,
}: EditorHeaderProps) {
  const title      = launchContext?.title      ?? "Full Workshop";
  const [showAchievements, setShowAchievements] = useState(false);
  const boardId = useBoardStore((s) => s.boardId);
  const setBoard = useBoardStore((s) => s.setBoard);

  // Below `lg` these three live in the More menu so the header stays on one row.
  const compactItems = [
    ...(canSaveProject && onSaveProject
      ? [{
          label: projectName ? "Rename project" : "Save to my projects",
          icon: projectName ? <Pencil className="h-4 w-4" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />,
          onClick: onSaveProject,
        }]
      : []),
    ...(onShareProject
      ? [{ label: "Copy share link", icon: <Share2 className="h-4 w-4" aria-hidden="true" />, onClick: onShareProject }]
      : []),
    { label: "Tutorials", icon: <BookOpen className="h-4 w-4" aria-hidden="true" />, onClick: onToggleTutorials },
  ];
  const actionLabel = "hidden text-xs 2xl:inline";

  return (
    <header className="flex h-12 shrink-0 items-center justify-between gap-2 px-2 bg-panel border-b border-subtle">
      <title>{`${projectName || title} · ${APP_NAME}`}</title>
      <h1 className="sr-only">{projectName || title}</h1>
      {/* Logo + back */}
      <div className="flex items-center gap-1 shrink-0">
        <div className="hidden px-1 md:flex">
          <BrandMark size="sm" nameClassName="hidden 2xl:inline" />
        </div>
        {onBackToDashboard && (
          <button
            onClick={onBackToDashboard}
            className="btn btn-ghost btn-sm gap-1 px-2 text-sub"
            title={isCourse ? "Back to course" : "Back to dashboard"}
            aria-label={isCourse ? "Back to course" : "Back to dashboard"}
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            <span className="hidden xl:inline text-xs">{isCourse ? "Course" : "Dashboard"}</span>
          </button>
        )}
      </div>

      {/* Centre breadcrumb */}
      <div className="hidden flex-1 items-center justify-center px-2 lg:flex min-w-0">
        <div className="flex min-w-0 max-w-[42rem] items-center gap-2 rounded-md px-3 py-1.5 bg-raised border border-subtle">
          {isCourse && <GraduationCap className="h-3.5 w-3.5 text-primary-c shrink-0" aria-hidden="true" />}
          {readOnly ? (
            <>
              <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-sub">
                <Eye className="h-3.5 w-3.5" aria-hidden="true" /> View only
              </span>
              <span className="text-[13px] font-semibold truncate text-body">{title}</span>
              {sharedAuthorName && (
                <span className="hidden shrink-0 items-center gap-1 text-xs font-semibold text-sub lg:flex">
                  <User className="h-3.5 w-3.5" aria-hidden="true" /> By {sharedAuthorName}
                </span>
              )}
            </>
          ) : (
            <>
              <span className="text-[13px] font-semibold truncate text-body">{projectName || title}</span>
              {isCourse && syncState && <SyncIndicator state={syncState} />}
              {!isCourse && projectName && projectSyncState && <SyncIndicator state={projectSyncState} />}
            </>
          )}
        </div>
      </div>

      {/* View mode switcher - Framer Motion layoutId for sliding active indicator */}
      <div className="flex items-center shrink-0">
        <div role="group" aria-label="View" className="flex rounded-lg border border-subtle bg-raised p-0.5 gap-0.5">
          {VIEW_TABS.map(({ mode, icon, label }) => {
            const active = viewMode === mode;
            return (
              <button
                key={mode}
                onClick={() => { setViewMode(mode); if (mode !== "code") setIsEditing(false); }}
                aria-pressed={active}
                aria-label={`${label} view`}
                title={`${label} view`}
                className={`relative flex min-h-7 items-center gap-1.5 rounded-md px-2 text-xs font-semibold transition-colors sm:px-3 ${
                  active ? "text-on-primary" : "text-sub hover:text-body"
                }`}
              >
                {/* Sliding background - shared layoutId makes it animate between tabs */}
                {active && (
                  <motion.div
                    layoutId="view-tab-indicator"
                    className="absolute inset-0 rounded-md bg-brand-gradient"
                    transition={{ duration: 0.18, ease: "easeOut" }}
                  />
                )}
                <span className="relative z-10" aria-hidden="true">{icon}</span>
                <span className="relative z-10 hidden xl:inline">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right actions - only the essentials stay top-level */}
      <div className="flex items-center gap-1 shrink-0">
        <div className="hidden md:block">
          <PlayerChip compact onClick={() => setShowAchievements(true)} />
        </div>

        {canSaveProject && onSaveProject && (
          <button
            onClick={onSaveProject}
            className="btn btn-ghost btn-sm hidden gap-1.5 text-sub lg:inline-flex"
            title={projectName ? "Rename project" : "Save to my projects"}
            aria-label={projectName ? "Rename project" : "Save to my projects"}
          >
            {projectName ? <Pencil className="h-4 w-4" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />}
            <span className={actionLabel}>{projectName ? "Rename" : "Save"}</span>
          </button>
        )}

        {onShareProject && (
          <button
            onClick={onShareProject}
            className={`btn btn-ghost btn-sm hidden gap-1.5 lg:inline-flex ${shareCopied ? "text-success-c" : "text-sub"}`}
            title="Copy a public share link"
            aria-label="Copy a public share link"
          >
            {shareCopied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Share2 className="h-4 w-4" aria-hidden="true" />}
            <span className={actionLabel}>{shareCopied ? "Copied!" : "Share"}</span>
          </button>
        )}
        <span role="status" className="sr-only">{shareCopied ? "Share link copied to clipboard" : ""}</span>

        <button
          onClick={onToggleTutorials}
          aria-pressed={showTutorialsCatalog}
          aria-label="Tutorials"
          className={`btn btn-ghost btn-sm hidden gap-1.5 lg:inline-flex ${showTutorialsCatalog ? "text-primary-c bg-primary-tint" : "text-sub"}`}
          title="Tutorials"
        >
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          <span className={actionLabel}>Tutorials</span>
        </button>

        <label className="flex items-center gap-1.5 text-sub" title="Board you are programming">
          <Cpu className="hidden h-4 w-4 shrink-0 sm:block" aria-hidden="true" />
          <select
            aria-label="Board"
            value={boardId}
            onChange={(e) => setBoard(e.target.value as BoardId)}
            className="select select-sm h-8 min-h-0 w-24 bg-raised text-xs font-semibold text-body sm:w-auto"
          >
            {BOARD_ORDER.map((id) => (
              <option key={id} value={id}>{BOARDS[id].label}</option>
            ))}
          </select>
        </label>

        <div className="hidden sm:block">
          <ThemeSwitcher compact />
        </div>

        <MoreMenu
          compactItems={compactItems}
          onImportProject={onImportProject}
          onExportProject={onExportProject}
          onSaveAsTutorial={onSaveAsTutorial}
        />
      </div>

      <AchievementsModal open={showAchievements} onClose={() => setShowAchievements(false)} />
    </header>
  );
}
