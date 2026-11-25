import type { ReactNode } from "react";
import { Blocks } from "lucide-react";
import { APP_NAME } from "@/shared/config/brand";

/** The product logo: a solid accent tile plus the wordmark. One source for every screen. */
export function BrandMark({ size = "md", showName = true, nameClassName = "" }: {
  size?: "sm" | "md";
  showName?: boolean;
  /** Extra classes for the wordmark, e.g. responsive visibility. */
  nameClassName?: string;
}) {
  const tile = size === "sm" ? "h-7 w-7 rounded-md" : "h-9 w-9 rounded-lg";
  const icon = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const name = size === "sm" ? "text-base" : "text-xl";
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className={`flex shrink-0 items-center justify-center bg-brand-gradient text-on-primary ${tile}`}>
        <Blocks className={icon} aria-hidden="true" />
      </span>
      {showName && (
        <span className={`font-display font-semibold text-body ${name} ${nameClassName}`}>{APP_NAME}</span>
      )}
    </span>
  );
}

/** Full-screen branded state: a spinner by default, or any message passed as children. */
export function BrandScreen({ children }: { children?: ReactNode }) {
  return (
    <main className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-page p-6 text-center">
      <BrandMark />
      {children ?? (
        <span role="status" className="flex items-center">
          <span className="loading loading-spinner loading-md text-primary-c" aria-hidden="true" />
          <span className="sr-only">Loading {APP_NAME}</span>
        </span>
      )}
    </main>
  );
}
