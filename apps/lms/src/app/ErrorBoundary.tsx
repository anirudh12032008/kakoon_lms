import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Top-level crash guard. Without it, one throwing component (e.g. a single
 * bad node on the canvas) white-screens the entire app and the student loses
 * their bearings. Work is safe — drafts/course sync persist outside React.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Hook point for Sentry/console collector once telemetry lands.
    console.error("Kokoon crashed:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-page px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-subtle bg-raised text-3xl">
         
        </div>
        <h1 className="text-xl font-black tracking-tight text-body">Oops — something short-circuited</h1>
        <p className="max-w-sm text-sm leading-relaxed text-sub">
          Don't worry, your work is saved. Reload the page to keep building.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Reload
          </button>
          <button
            onClick={() => { window.location.href = "/courses"; }}
            className="rounded-xl border border-subtle px-5 py-2.5 text-sm font-semibold text-sub transition-colors hover:bg-hover hover:text-body"
          >
            Back to courses
          </button>
        </div>
        <details className="mt-2 max-w-md text-left">
          <summary className="cursor-pointer text-[11px] font-semibold text-hint">Technical details</summary>
          <pre className="mt-2 max-h-32 overflow-auto rounded-lg border border-subtle bg-raised p-3 text-[10px] leading-relaxed text-hint">
            {this.state.error.message}
          </pre>
        </details>
      </div>
    );
  }
}
