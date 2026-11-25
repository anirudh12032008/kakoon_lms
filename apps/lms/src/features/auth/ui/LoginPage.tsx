import { APP_NAME } from "@/shared/config/brand";
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/shared/auth/AuthContext";
import { apiErrorMessage } from "@/shared/api/client";
import { AuthShell, AuthField, AuthFormError, AuthDivider, authSubmitClass } from "./AuthShell";
import { GoogleSignInButton, GOOGLE_ENABLED } from "./GoogleSignInButton";

export function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/courses";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, "Could not sign in"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async (credential: string) => {
    setError(null);
    try {
      await loginWithGoogle(credential);
      navigate(from, { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, "Google sign-in failed"));
    }
  };

  return (
    <AuthShell
      title="Sign in"
      subtitle="Continue to your projects and coursework."
      footer={
        <>
          New to {APP_NAME}?{" "}
          <Link to="/register" className="font-semibold text-primary-c underline underline-offset-2">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <AuthField
          label="Email" type="email" required autoComplete="email" placeholder="you@example.com"
          value={email} onChange={(e) => setEmail(e.target.value)}
        />
        <AuthField
          label="Password" type="password" required autoComplete="current-password"
          value={password} onChange={(e) => setPassword(e.target.value)}
        />

        <AuthFormError message={error} />

        <button type="submit" disabled={submitting} className={authSubmitClass}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {GOOGLE_ENABLED && (
        <div>
          <AuthDivider />
          <GoogleSignInButton onCredential={handleGoogle} onError={setError} />
        </div>
      )}
    </AuthShell>
  );
}
