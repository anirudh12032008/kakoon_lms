import { APP_NAME } from "@/shared/config/brand";
import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { motion } from "framer-motion";
import { AlertCircle } from "lucide-react";
import { BrandMark } from "@/shared/ui/BrandMark";
import { ThemeSwitcher } from "@/shared/theme/ThemeSwitcher";

/** Centered card shell used by the login & register screens. */
export function AuthShell({ title, subtitle, children, footer }: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    // The document itself never scrolls (html/body are overflow:hidden), so this
    // element is the scroller: a tall form stays reachable on short screens.
    <div className="h-full w-full overflow-y-auto bg-page">
      <title>{`${title} · ${APP_NAME}`}</title>
      <a href="#main" className="skip-link">Skip to main content</a>
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-4 py-5 sm:py-8">
        <header className="flex items-center justify-between">
          <BrandMark />
          <ThemeSwitcher compact />
        </header>

        <main id="main" tabIndex={-1} className="flex flex-1 flex-col justify-center py-8 outline-none">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="rounded-lg border border-subtle bg-panel p-6 sm:p-8"
          >
            <h1 className="font-display text-3xl font-semibold text-body">{title}</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-sub">{subtitle}</p>
            <div className="mt-7">{children}</div>
          </motion.div>

          <p className="mt-6 text-center text-sm text-sub">{footer}</p>
        </main>
      </div>
    </div>
  );
}

/** Label + input + hint + error, wired together for assistive tech. */
export function AuthField({ label, error, hint, ...input }: {
  label: string;
  error?: string;
  hint?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-body">{label}</label>
      <input
        {...input}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`min-h-11 w-full rounded-md border bg-page px-3.5 py-2.5 text-base text-body transition-colors placeholder:text-hint ${
          error ? "border-error" : "border-strong"
        }`}
      />
      {hint && !error && <p id={`${id}-hint`} className="mt-1.5 text-[13px] text-sub">{hint}</p>}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 flex items-center gap-1.5 text-[13px] font-medium text-error-c">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

/** Form-level error. Always mounted so screen readers announce it when it fills. */
export function AuthFormError({ message }: { message?: string | null }) {
  return (
    <div role="alert">
      {message && (
        <p className="flex items-start gap-2 rounded-md border border-error-tint bg-error-tint px-3.5 py-2.5 text-sm font-medium text-error-c">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {message}
        </p>
      )}
    </div>
  );
}

export const authSubmitClass =
  "mt-1 min-h-11 w-full rounded-md bg-brand-gradient px-4 text-base font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60";

/** "or" rule between the password form and Google sign-in. */
export function AuthDivider() {
  return (
    <div className="my-5 flex items-center" role="separator" aria-label="or">
      <div className="flex-1 border-t border-subtle" />
      <span className="px-3 text-xs font-medium text-sub" aria-hidden="true">or</span>
      <div className="flex-1 border-t border-subtle" />
    </div>
  );
}
