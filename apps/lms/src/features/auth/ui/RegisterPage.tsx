import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/auth/AuthContext";
import { apiErrorMessage } from "@/shared/api/client";
import { AuthShell, AuthField, AuthFormError, AuthDivider, authSubmitClass } from "./AuthShell";
import { GoogleSignInButton, GOOGLE_ENABLED } from "./GoogleSignInButton";

export function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; form?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  // After a failed submit, put the keyboard on the first field that needs fixing.
  useEffect(() => {
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [errors]);

  const validate = () => {
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = "Enter your name (at least 2 characters).";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) next.email = "Enter a valid email, like you@example.com.";
    if (password.length < 8) next.password = "Use at least 8 characters.";
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
      subtitle="Free for students. Build and run IoT projects from your browser."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary-c underline underline-offset-2">
            Sign in
          </Link>
        </>
      }
    >
      <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <AuthField
          label="Full name" error={errors.name} type="text" required autoComplete="name"
          value={name} onChange={(e) => setName(e.target.value)}
        />
        <AuthField
          label="Email" error={errors.email} type="email" required autoComplete="email" placeholder="you@example.com"
          value={email} onChange={(e) => setEmail(e.target.value)}
        />
        <AuthField
          label="Password" error={errors.password} hint="At least 8 characters."
          type="password" required autoComplete="new-password"
          value={password} onChange={(e) => setPassword(e.target.value)}
        />

        <AuthFormError message={errors.form} />

        <button type="submit" disabled={submitting} className={authSubmitClass}>
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      {GOOGLE_ENABLED && (
        <div>
          <AuthDivider />
          <GoogleSignInButton onCredential={handleGoogle} onError={(m) => setErrors({ form: m })} />
        </div>
      )}
    </AuthShell>
  );
}
