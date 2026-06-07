import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/shared/theme/ThemeProvider";

/**
 * Renders the official "Sign in with Google" button via Google Identity
 * Services. On success it hands the ID token (credential) back to the caller,
 * which exchanges it with our API. Renders nothing if VITE_GOOGLE_CLIENT_ID is
 * unset, so the app works fine before Google is configured.
 */

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GIS_SRC = "https://accounts.google.com/gsi/client";

// Minimal typing for the GIS global we use.
interface GoogleIdApi {
  accounts: {
    id: {
      initialize: (cfg: { client_id: string; callback: (r: { credential: string }) => void }) => void;
      renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
    };
  };
}
declare global {
  interface Window {
    google?: GoogleIdApi;
  }
}

function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const existing = document.getElementById("gis-script") as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject());
      return;
    }
    const s = document.createElement("script");
    s.src = GIS_SRC;
    s.async = true;
    s.defer = true;
    s.id = "gis-script";
    s.onload = () => resolve();
    s.onerror = () => reject();
    document.head.appendChild(s);
  });
}

export function GoogleSignInButton({
  onCredential,
  onError,
}: {
  onCredential: (credential: string) => void;
  onError?: (msg: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID || !ref.current) return;
    let cancelled = false;

    loadGisScript()
      .then(() => {
        if (cancelled || !ref.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (resp) => resp?.credential && onCredential(resp.credential),
        });
        ref.current.innerHTML = "";
        window.google.accounts.id.renderButton(ref.current, {
          type: "standard",
          theme: theme.mode === "light" ? "outline" : "filled_black",
          size: "large",
          text: "continue_with",
          shape: "pill",
          logo_alignment: "left",
          width: Math.min(ref.current.offsetWidth || 320, 400),
        });
        setReady(true);
      })
      .catch(() => onError?.("Could not load Google sign-in"));

    return () => {
      cancelled = true;
    };
    // Re-render the button when the theme changes so it matches.
  }, [onCredential, onError, theme.mode]);

  if (!CLIENT_ID) return null;

  return (
    <div className="flex w-full justify-center">
      <div ref={ref} className="w-full" style={{ minHeight: ready ? undefined : 0 }} />
    </div>
  );
}

/** True when Google sign-in is configured (client id present). */
export const GOOGLE_ENABLED = !!CLIENT_ID;
