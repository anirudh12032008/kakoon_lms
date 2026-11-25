import { APP_NAME } from "@/shared/config/brand";
import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { BookOpen, FolderOpen, LogOut } from "lucide-react";
import { useAuth } from "@/shared/auth/AuthContext";
import { ThemeSwitcher } from "@/shared/theme/ThemeSwitcher";
import { BrandMark } from "@/shared/ui/BrandMark";
import { PlayerChip, AchievementsModal } from "@/entities/gamification";

// The active page is marked by the underline and weight (and aria-current, which
// NavLink sets), not by colour alone.
const navItem = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-11 flex-1 items-center justify-center gap-2 border-b-2 px-3 text-sm font-semibold transition-colors sm:flex-none ${
    isActive
      ? "border-[var(--k-primary-text)] text-body"
      : "border-transparent text-sub hover:text-body"
  }`;

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showAchievements, setShowAchievements] = useState(false);

  return (
    <>
      <a href="#main" className="skip-link">Skip to main content</a>
      <header className="sticky top-0 z-30 border-b border-subtle bg-panel">
        {/* Phones: brand + account on row one, the two nav tabs on a full-width row two. */}
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 px-4 sm:px-6">
          <Link to="/courses" aria-label={`${APP_NAME} home`} className="flex items-center rounded-md py-2.5">
            <BrandMark nameClassName="hidden sm:inline" />
          </Link>

          <nav
            aria-label="Main"
            className="order-last -mx-4 flex w-[calc(100%+2rem)] border-t border-subtle sm:order-none sm:mx-0 sm:w-auto sm:self-stretch sm:border-t-0"
          >
            <NavLink to="/courses" className={navItem}>
              <BookOpen className="h-4 w-4" aria-hidden="true" /> Learn
            </NavLink>
            <NavLink to="/projects" className={navItem}>
              <FolderOpen className="h-4 w-4" aria-hidden="true" /> My projects
            </NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <PlayerChip onClick={() => setShowAchievements(true)} />
            {user && (
              <div className="hidden items-center gap-2.5 md:flex">
                <div
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: user.avatarColor }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden max-w-40 leading-tight lg:block">
                  <div className="truncate text-sm font-semibold text-body">{user.name}</div>
                  <div className="truncate text-xs text-sub">{user.email}</div>
                </div>
              </div>
            )}
            <ThemeSwitcher />
            <button
              onClick={async () => {
                await logout();
                navigate("/login", { replace: true });
              }}
              className="flex min-h-10 min-w-10 items-center justify-center gap-1.5 rounded-md border border-subtle px-2.5 text-sm font-semibold text-sub transition-colors hover:bg-hover hover:text-body"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden lg:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <AchievementsModal open={showAchievements} onClose={() => setShowAchievements(false)} />
    </>
  );
}

const DIFFICULTY_STYLES: Record<string, string> = {
  beginner: "bg-success-tint text-success-c",
  intermediate: "bg-warning-tint text-warning-c",
  advanced: "bg-error-tint text-error-c",
};

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-semibold capitalize ${DIFFICULTY_STYLES[difficulty] ?? "bg-hover text-sub"}`}>
      {difficulty}
    </span>
  );
}
