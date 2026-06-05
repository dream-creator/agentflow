"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getOAuthRedirectTo } from "@/lib/auth";
import { TurnstileWidget } from "@/components/turnstile-widget";
import { Mail, Loader2, Home, CheckCircle2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaReady, setCaptchaReady] = useState(false);
  const captchaVerified = captchaToken !== "";

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
    <div className="min-h-dvh lg:h-dvh flex flex-col lg:flex-row lg:overflow-hidden">
      {/* Left: Value Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-center px-12 xl:px-20">
        <div className="max-w-md">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-12 group">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center group-hover:bg-white/25 transition-colors">
              <Home className="h-5 w-5 text-white" />
            </div>
            <span className="font-heading text-xl font-bold text-white">
              AgentFlow
            </span>
          </Link>
          <h2 className="font-heading text-3xl font-bold text-white mb-6 leading-tight">
            The CRM for agents who hate CRMs
          </h2>
          <p className="text-white/80 text-lg mb-10 leading-relaxed">
            Start managing your leads in 30 seconds. No credit card required.
          </p>
          <div className="space-y-5">
            {[
              "10 free leads included",
              "Set up in 3 minutes, not 3 hours",
              "See who to call today — instantly",
              "No credit card required",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary-200 shrink-0" />
                <span className="text-white/90 text-sm">{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-16 p-5 bg-white/10 rounded-xl border border-white/20">
            <p className="text-sm text-white/90 italic">
              &ldquo;I deleted my Follow Up Boss account after a week with AgentFlow. It&apos;s exactly what I needed.&rdquo;
            </p>
            <p className="text-xs text-white/65 mt-2">
              — Solo agent, Austin TX
            </p>
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
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 lg:py-0 bg-surface">
        <div className="w-full max-w-sm">
          <h1 className="font-heading text-2xl font-bold text-surface-900 mb-2">
            Create your account
          </h1>
          <p className="text-surface-500 text-sm mb-8">
            Start managing leads in 30 seconds
          </p>

          <form onSubmit={handleSignup} className="space-y-4">
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

            <div>
              <div className="flex justify-center">
                <TurnstileWidget
                  onLoad={() => setCaptchaReady(true)}
                  onSuccess={(token) => setCaptchaToken(token)}
                  onExpire={() => setCaptchaToken("")}
                  onError={() => setCaptchaToken("")}
                />
              </div>
              <p
                id="captcha-hint"
                className={`mt-2 flex items-center justify-center gap-1.5 text-[12px] ${
                  captchaVerified ? "text-success-600" : "text-surface-500"
                }`}
                aria-live="polite"
              >
                {captchaVerified ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Verification complete</span>
                  </>
                ) : (
                  <>
                    <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {captchaReady
                        ? "Complete the verification above to continue"
                        : "Loading security check..."}
                    </span>
                  </>
                )}
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading || !captchaVerified}
              aria-describedby="captcha-hint"
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
