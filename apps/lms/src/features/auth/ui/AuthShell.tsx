import type { ReactNode } from "react";

/** Centered split-card shell used by the login & register screens. */
export function AuthShell({ title, subtitle, children, footer }: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-page p-4 overflow-y-auto">
      {/* Ambient brand glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-secondary/20 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient text-xl">⚡</div>
          <span className="text-2xl font-black tracking-tight text-body">Kokoon</span>
        </div>

        <div className="rounded-2xl border border-subtle bg-raised/80 backdrop-blur-xl p-7 shadow-2xl">
          <h1 className="text-2xl font-black text-body tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-sub">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>

        <div className="mt-5 text-center text-sm text-sub">{footer}</div>
      </div>
    </div>
  );
}

export function AuthField({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-sub">{label}</span>
      {children}
      {error && <span className="mt-1 block text-[13px] font-medium text-error-c">{error}</span>}
    </label>
  );
}

export const authInputClass =
  "w-full rounded-xl border border-subtle bg-page px-4 py-3 text-[15px] text-body outline-none transition-colors placeholder:text-hint focus:border-primary";
