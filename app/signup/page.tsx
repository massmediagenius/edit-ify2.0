"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

function friendlyError(msg: string): string {
  if (msg.includes("User already registered") || msg.includes("already been registered")) return "An account with this email already exists. Try signing in.";
  if (msg.includes("Password should be") || msg.includes("password")) return "Password must be at least 6 characters.";
  if (msg.includes("Unable to validate email") || msg.includes("invalid email")) return "Please enter a valid email address.";
  if (msg.includes("signup_disabled")) return "New signups are currently paused. Contact the admin.";
  if (msg.includes("rate limit") || msg.includes("too many")) return "Too many attempts. Please wait a moment and try again.";
  if (msg.includes("network") || msg.includes("fetch")) return "Connection error. Check your internet and try again.";
  return msg;
}

function getPasswordStrength(password: string): { label: string; color: string; pct: number } {
  if (password.length === 0) return { label: "", color: "", pct: 0 };
  if (password.length < 6) return { label: "Too short", color: "bg-red-500", pct: 15 };
  let score = 1;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 2) return { label: "Weak", color: "bg-accent-orange", pct: 33 };
  if (score === 3) return { label: "Fair", color: "bg-accent-yellow", pct: 60 };
  if (score === 4) return { label: "Strong", color: "bg-accent-green", pct: 82 };
  return { label: "Very strong", color: "bg-accent-green", pct: 100 };
}

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const strength = getPasswordStrength(password);
  const confirmMismatch = confirmPassword.length > 0 && confirmPassword !== password;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (authError) {
      setError(friendlyError(authError.message));
      setLoading(false);
      return;
    }

    setRedirecting(true);
    router.push("/onboarding/step-1");
  }

  return (
    <>
      {/* Full-screen redirect overlay */}
      {redirecting && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center gap-4">
          <img src="/editify-icon.svg" alt="Edit-ify" className="w-14 h-14" />
          <div className="flex items-center gap-2 text-text-secondary text-sm">
            <Spinner />
            Setting up your account…
          </div>
        </div>
      )}

      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="text-center mb-8">
            <img src="/editify-logo.svg" alt="Edit-ify" className="h-10 mx-auto mb-3" />
            <p className="text-text-secondary text-sm">Create your editor account</p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2.5 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/30"
                  placeholder="Jane Smith"
                  autoComplete="name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2.5 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/30"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2.5 pr-10 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:border-accent-cyan/50 focus:ring-1 focus:ring-accent-cyan/30"
                    placeholder="Min. 6 characters"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Strength bar */}
                {password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="h-1 w-full bg-surface-raised rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-300", strength.color)}
                        style={{ width: `${strength.pct}%` }}
                      />
                    </div>
                    <p className={cn("text-xs", strength.pct <= 15 ? "text-red-400" : strength.pct <= 33 ? "text-accent-orange" : strength.pct <= 60 ? "text-accent-yellow" : "text-accent-green")}>
                      {strength.label}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm text-text-secondary mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={cn(
                      "w-full bg-surface-raised border rounded-lg px-3 py-2.5 pr-10 text-text-primary text-sm placeholder:text-text-muted focus:outline-none focus:ring-1 transition-colors",
                      confirmMismatch
                        ? "border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20"
                        : "border-border focus:border-accent-cyan/50 focus:ring-accent-cyan/30"
                    )}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmMismatch && (
                  <p className="text-xs text-red-400 mt-1">Passwords don&apos;t match.</p>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2.5">
                  <svg className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || redirecting || confirmMismatch}
                className="w-full bg-accent-cyan text-background font-semibold py-2.5 rounded-lg text-sm hover:bg-accent-cyan/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Spinner />
                    Creating account…
                  </>
                ) : "Create Account"}
              </button>
            </form>
          </div>

          <p className="text-center text-sm text-text-muted mt-4">
            Already have an account?{" "}
            <Link href="/login" className="text-accent-cyan hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
