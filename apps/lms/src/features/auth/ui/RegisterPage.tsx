import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/auth/AuthContext";
import { apiErrorMessage } from "@/shared/api/client";
import { AuthShell, AuthField, authInputClass } from "./AuthShell";
import { GoogleSignInButton, GOOGLE_ENABLED } from "./GoogleSignInButton";

export function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = "Please enter your name";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) next.email = "Enter a valid email";
    if (password.length < 8) next.password = "At least 8 characters";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);
      navigate("/courses", { replace: true });
    } catch (err) {
      setErrors({ form: apiErrorMessage(err, "Could not create account") });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async (credential: string) => {
    setErrors({});
    try {
      await loginWithGoogle(credential);
      navigate("/courses", { replace: true });
    } catch (err) {
      setErrors({ form: apiErrorMessage(err, "Google sign-in failed") });
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="It's free — start building robots in minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary-c hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <AuthField label="Name" error={errors.name}>
          <input
            type="text" autoComplete="name" placeholder="Ada Lovelace"
            value={name} onChange={(e) => setName(e.target.value)}
            className={authInputClass}
          />
        </AuthField>
        <AuthField label="Email" error={errors.email}>
          <input
            type="email" autoComplete="email" placeholder="you@example.com"
            value={email} onChange={(e) => setEmail(e.target.value)}
            className={authInputClass}
          />
        </AuthField>
        <AuthField label="Password" error={errors.password}>
          <input
            type="password" autoComplete="new-password" placeholder="At least 8 characters"
            value={password} onChange={(e) => setPassword(e.target.value)}
            className={authInputClass}
          />
        </AuthField>

        {errors.form && (
          <div className="rounded-xl border border-error-tint bg-error-tint px-4 py-2.5 text-sm font-medium text-error-c">
            {errors.form}
          </div>
        )}

        <button
          type="submit" disabled={submitting}
          className="mt-1 w-full rounded-xl bg-brand-gradient py-3 text-[15px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      {GOOGLE_ENABLED && (
        <div className="mt-2">
          <div className="relative my-4 flex items-center">
            <div className="flex-1 border-t border-subtle" />
            <span className="px-3 text-[12px] font-medium text-hint">or</span>
            <div className="flex-1 border-t border-subtle" />
          </div>
          <GoogleSignInButton onCredential={handleGoogle} onError={(m) => setErrors({ form: m })} />
        </div>
      )}
    </AuthShell>
  );
}
