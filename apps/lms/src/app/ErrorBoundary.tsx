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
 * their bearings. Work is safe - drafts/course sync persist outside React.
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
      <div role="alert" className="flex min-h-screen items-center justify-center bg-page px-4">
        <div className="w-full max-w-md rounded-lg border border-subtle bg-panel p-6">
          <h1 className="text-lg font-semibold text-body">Something went wrong</h1>
          <p className="mt-2 text-sm leading-relaxed text-sub">
            This page hit an unexpected error. Your saved work is not affected. Reload to carry on.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--k-primary)]"
            >
              Reload
            </button>
            <a href="/courses" className="rounded-md border border-subtle px-4 py-2 text-sm font-medium text-sub transition-colors hover:bg-hover hover:text-body">
              Back to dashboard
            </a>
          </div>
          <details className="mt-5">
            <summary className="cursor-pointer text-xs font-medium text-sub">Technical details</summary>
            <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap rounded-md border border-subtle bg-page p-3 text-xs leading-relaxed text-sub">
              {this.state.error.message}
            </pre>
          </details>
        </div>
      </div>
    );
  }
}
