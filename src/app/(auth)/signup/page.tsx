"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getOAuthRedirectTo } from "@/lib/auth";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { CaptchaStatusPill } from "@/components/auth/captcha-status-pill";
import { Mail, Loader2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaReady, setCaptchaReady] = useState(false);
  // Emergency kill switch — when set, the widget returns null and we
  // treat the form as captcha-verified. MUST be paired with disabling
  // `security_captcha_enabled` in the Supabase dashboard.
  const captchaDisabled =
    process.env.NEXT_PUBLIC_TURNSTILE_DISABLED === "true";
  const captchaVerified = captchaDisabled || captchaToken !== "";

  const getSupabase = () => createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await getSupabase().auth.signInWithOtp({
      email,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: getOAuthRedirectTo(),
        captchaToken,
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for the login link!");
    }
    setLoading(false);
  };

  const handleGoogleSignup = async () => {
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: getOAuthRedirectTo() },
    });
    if (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left: Value Panel */}
      <div className="hidden lg:flex lg:w-1/2 min-h-screen bg-surface-50 border-r border-surface-200 flex-col justify-center items-start px-16 xl:px-20">
        <div className="w-full max-w-[420px]">
          {/* Logo */}
          <div className="flex items-center gap-2.5" style={{ marginTop: "48px" }}>
            <div className="w-6 h-6 flex items-center justify-center">
              <Home className="w-6 h-6 text-primary" />
            </div>
            <span className="text-lg font-semibold text-surface-900 tracking-tight">
              AgentFlow
            </span>
          </div>

          {/* Brand statement */}
          <h2 className="text-[32px] font-semibold text-surface-900 leading-[1.15] tracking-[-0.02em] mt-4">
            The only thing on your screen should be who to call today.
          </h2>

          {/* Supporting line */}
          <p className="text-[15px] text-surface-500 leading-[1.6] mt-4">
            AgentFlow removes everything a solo agent doesn&apos;t need.
          </p>

          {/* Three plain text lines */}
          <div className="mt-[36px]" style={{ gap: "10px", display: "flex", flexDirection: "column" }}>
            <p className="text-[14px] text-surface-600">Open the app. See who to call.</p>
            <p className="text-[14px] text-surface-600">Track every lead without the noise.</p>
            <p className="text-[14px] text-surface-600">Set up in minutes, not hours.</p>
          </div>
        </div>
      </div>

      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center h-[72px] bg-primary px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-6 h-6 flex items-center justify-center">
            <Home className="w-6 h-6 text-white" />
          </div>
          <span className="text-lg font-semibold text-white tracking-tight">
            AgentFlow
          </span>
        </Link>
      </div>

      {/* Right: Signup Form */}
      <div className="flex-1 flex flex-col justify-center items-center min-h-screen px-4 sm:px-6 py-12 lg:py-0 bg-surface">
        <div className="w-full max-w-sm">
          <div className="text-center mb-1.5">
            <h1 className="font-heading text-2xl font-bold text-surface-900">
              Create your account
            </h1>
            <p className="text-surface-500 text-sm">
              Start managing leads in 30 seconds
            </p>
          </div>

          <form onSubmit={handleSignup} className="relative space-y-3">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-surface-700 mb-1.5">
                Full name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jane Smith"
                required
                className="input-field"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-surface-700 mb-1.5">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="input-field"
              />
            </div>

            {/* Off-screen Turnstile widget — the iframe still mounts and
                fires onSuccess, but invisible mode + 0×0 visual footprint
                means it doesn't take space in the form. */}
            {!captchaDisabled && (
              <div
                className="absolute -left-[9999px] -top-[9999px] w-px h-px overflow-hidden pointer-events-none"
                aria-hidden="true"
              >
                <TurnstileWidget
                  onLoad={() => setCaptchaReady(true)}
                  onSuccess={(token) => setCaptchaToken(token)}
                  onExpire={() => setCaptchaToken("")}
                  onError={() => setCaptchaToken("")}
                />
              </div>
            )}

            {!captchaDisabled && (
              <CaptchaStatusPill
                captchaVerified={captchaVerified}
                captchaReady={captchaReady}
              />
            )}

            <Button
              type="submit"
              disabled={loading || !captchaVerified}
              aria-describedby="captcha-status"
              className="w-full"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Send magic link
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-surface text-surface-500">or</span>
            </div>
          </div>

          <Button
            onClick={handleGoogleSignup}
            variant="secondary"
            className="w-full"
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </Button>

          {message && (
            <div className="mt-4 p-3 rounded-lg bg-success-50 text-success-700 text-sm text-center border border-success-100">
              {message}
            </div>
          )}

          <p className="text-center text-sm text-surface-500 mt-8">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:text-primary-700 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
