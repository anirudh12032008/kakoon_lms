import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "@/shared/auth/AuthContext";
import { ThemeSwitcher } from "@/shared/theme/ThemeSwitcher";
import { PlayerChip, AchievementsModal } from "@/entities/gamification";

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showAchievements, setShowAchievements] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-subtle bg-panel/90 px-5 py-3 backdrop-blur-xl">
      <button onClick={() => navigate("/courses")} className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-lg">⚡</div>
        <span className="text-xl font-black tracking-tight text-body">Kokoon</span>
      </button>

      <div className="flex items-center gap-3">
        <PlayerChip onClick={() => setShowAchievements(true)} />
        {user && (
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ background: user.avatarColor }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block leading-tight">
              <div className="text-sm font-semibold text-body">{user.name}</div>
              <div className="text-[12px] text-hint">{user.email}</div>
            </div>
          </div>
        )}
        <ThemeSwitcher />
        <button
          onClick={async () => {
            await logout();
            navigate("/login", { replace: true });
          }}
          className="flex items-center gap-1.5 rounded-lg border border-subtle px-3 py-2 text-sm font-semibold text-sub transition-colors hover:bg-hover hover:text-body"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>

      <AchievementsModal open={showAchievements} onClose={() => setShowAchievements(false)} />
    </header>
  );
}

const DIFFICULTY_STYLES: Record<string, string> = {
  beginner: "bg-success-tint text-success-c",
  intermediate: "bg-warning-tint text-warning-c",
  advanced: "bg-error-tint text-error-c",
};

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${DIFFICULTY_STYLES[difficulty] ?? "bg-hover text-sub"}`}>
      {difficulty}
    </span>
  );
}
