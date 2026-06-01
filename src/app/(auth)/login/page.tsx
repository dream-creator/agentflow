"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getOAuthRedirectTo } from "@/lib/auth";
import { Mail, Loader2, Home, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function LoginPageContent() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const getSupabase = () => createClient();

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      setMessage(error.replace(/_/g, " "));
    }
  }, [searchParams]);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await getSupabase().auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: getOAuthRedirectTo(),
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for the login link!");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getOAuthRedirectTo(),
      },
    });
    if (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="min-h-dvh flex">
      {/* Left: Value Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-50 flex-col justify-center px-12 xl:px-20">
        <div className="max-w-md">
          <Link href="/" className="flex items-center gap-2.5 mb-12 group">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center group-hover:bg-primary-700 transition-colors">
              <Home className="h-5 w-5 text-white" />
            </div>
            <span className="font-heading text-xl font-bold text-surface-900">
              AgentFlow
            </span>
          </Link>
          <h2 className="font-heading text-3xl font-bold text-surface-900 mb-6 leading-tight">
            Welcome back to your daily follow-up tool
          </h2>
          <p className="text-surface-500 text-lg mb-8 leading-relaxed">
            The only CRM designed for solo agents who want to close more deals without the complexity.
          </p>
          <div className="space-y-4">
            {[
              "See who to call today — instantly",
              "Track every lead without the clutter",
              "Set up in 3 minutes, not 3 hours",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <span className="text-surface-600 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="text-center mb-8 lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Home className="h-5 w-5 text-white" />
              </div>
              <span className="font-heading text-xl font-bold text-surface-900">
                AgentFlow
              </span>
            </Link>
          </div>

          <h1 className="font-heading text-2xl font-bold text-surface-900 mb-2">
            Sign in to your account
          </h1>
          <p className="text-surface-500 text-sm mb-8">
            Enter your email to receive a magic link
          </p>

          <form onSubmit={handleMagicLink} className="space-y-4">
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

            <Button
              type="submit"
              disabled={loading}
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
              <span className="px-2 bg-white text-surface-400">or</span>
            </div>
          </div>

          <Button
            onClick={handleGoogleLogin}
            variant="secondary"
            className="w-full"
          >
            <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>

          {message && (
            <div className="mt-4 p-3 rounded-lg bg-primary-50 text-primary-700 text-sm text-center">
              {message}
            </div>
          )}

          <p className="text-center text-sm text-surface-500 mt-8">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-primary-600 hover:text-primary-700 font-medium">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  );
}
