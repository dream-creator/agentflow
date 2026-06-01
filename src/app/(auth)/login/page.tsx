"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getOAuthRedirectTo } from "@/lib/auth";
import {
  Mail,
  Home,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";

// Email typo suggestions
const COMMON_DOMAINS: Record<string, string> = {
  "gmail.con": "gmail.com",
  "gmail.cmo": "gmail.com",
  "gmail.om": "gmail.com",
  "outlok.com": "outlook.com",
  "outlook.con": "outlook.com",
  "yahooo.com": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "hotmail.con": "hotmail.com",
  "hotmail.cmo": "hotmail.com",
  "icloud.con": "icloud.com",
};

function suggestCorrection(email: string): string | null {
  const parts = email.split("@");
  if (parts.length !== 2) return null;
  const domain = parts[1]?.toLowerCase();
  if (domain && COMMON_DOMAINS[domain]) {
    return `${parts[0]}@${COMMON_DOMAINS[domain]}`;
  }
  return null;
}

type AuthView = "magic-link" | "password" | "forgot-password";

function LoginContent() {
  const router = useRouter();
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Auth state
  const [authLoading, setAuthLoading] = useState(true);
  const [activeView, setActiveView] = useState<AuthView>("magic-link");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  // Error state
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [authError, setAuthError] = useState("");
  const [emailSuggestion, setEmailSuggestion] = useState("");

  // Resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0);

  const getSupabase = useCallback(() => createClient(), []);

  // Check if user is already authenticated
  useEffect(() => {
    const checkSession = async () => {
      try {
        const supabase = getSupabase();
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          router.push("/dashboard");
          return;
        }
      } catch {
        // Even on error, show the form
      }
      setAuthLoading(false);
    };
    checkSession();
  }, [getSupabase, router]);

  // Auto-focus email input when view changes
  useEffect(() => {
    if (!authLoading) {
      const timer = setTimeout(() => {
        emailInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [authLoading, activeView]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Email validation
  const validateEmail = (value: string, showSuggestion = false): boolean => {
    if (!value.trim()) {
      setEmailError("Email address is required");
      setEmailSuggestion("");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setEmailError("Please enter a valid email address");
      setEmailSuggestion("");
      return false;
    }
    // Check for typos
    if (showSuggestion) {
      const correction = suggestCorrection(value);
      if (correction) {
        setEmailSuggestion(correction);
        setEmailError("");
        return true;
      }
    }
    setEmailError("");
    setEmailSuggestion("");
    return true;
  };

  // Password validation (only for signup context, not login)
  const validatePassword = (value: string): boolean => {
    if (!value) {
      setPasswordError("Password is required");
      return false;
    }
    setPasswordError("");
    return true;
  };

  // Handle magic link send
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (!validateEmail(email, true)) return;

    setMagicLinkLoading(true);

    const { error } = await getSupabase().auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: getOAuthRedirectTo(),
      },
    });

    if (error) {
      setAuthError(error.message);
    } else {
      setMagicLinkSent(true);
      setSentEmail(email);
      setResendCooldown(30);
    }
    setMagicLinkLoading(false);
  };

  // Handle password sign in
  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setPasswordError("");

    if (!validateEmail(email)) return;
    if (!validatePassword(password)) return;

    setPasswordLoading(true);

    const { error } = await getSupabase().auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setAuthError("Incorrect email or password. Please try again.");
      setPassword("");
      // Focus password input for retry
      setTimeout(() => passwordInputRef.current?.focus(), 100);
    } else {
      router.push("/dashboard");
    }
    setPasswordLoading(false);
  };

  // Handle Google OAuth
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setAuthError("");

    const { error } = await getSupabase().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: getOAuthRedirectTo(),
      },
    });

    if (error) {
      setAuthError(error.message);
      setGoogleLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (!validateEmail(email, false)) return;

    setForgotPasswordLoading(true);

    const { error } = await getSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setAuthError(error.message);
    } else {
      setForgotPasswordSent(true);
    }
    setForgotPasswordLoading(false);
  };

  // Handle resend magic link
  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setMagicLinkLoading(true);
    const { error } = await getSupabase().auth.signInWithOtp({
      email: sentEmail,
      options: {
        emailRedirectTo: getOAuthRedirectTo(),
      },
    });

    if (!error) {
      setResendCooldown(30);
    }
    setMagicLinkLoading(false);
  };

  // Reset to magic link form
  const resetToMagicLink = () => {
    setMagicLinkSent(false);
    setSentEmail("");
    setEmailError("");
    setEmailSuggestion("");
    setAuthError("");
  };

  // Reset to login form
  const resetToLogin = () => {
    setActiveView("magic-link");
    setForgotPasswordSent(false);
    setForgotPasswordLoading(false);
    setEmailError("");
    setEmailSuggestion("");
    setAuthError("");
  };

  // Loading skeleton
  if (authLoading) {
    return (
      <div className="min-h-dvh flex flex-col lg:flex-row">
        {/* Left panel - renders normally */}
        <div className="hidden lg:flex lg:w-[55%] bg-[#0F766E] flex-col justify-center px-16 min-h-dvh">
          <div className="max-w-[340px]">
            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-14">
              <div className="w-7 h-7 flex items-center justify-center">
                <Home className="w-7 h-7 text-white" />
              </div>
              <span className="text-xl font-semibold text-white tracking-tight">
                AgentFlow
              </span>
            </div>
            {/* Headline skeleton */}
            <div className="h-8 w-[280px] bg-white/20 rounded-md mb-4 animate-pulse" />
            {/* Body skeleton */}
            <div className="h-4 w-[320px] bg-white/15 rounded mb-2 animate-pulse" />
            <div className="h-4 w-[240px] bg-white/15 rounded mb-8 animate-pulse" />
          </div>
        </div>

        {/* Right panel skeleton */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white min-h-dvh">
        <div className="w-full max-w-[380px] mx-auto">
            {/* Title skeleton */}
            <div className="h-7 w-[220px] bg-[#f1f5f9] rounded-md mb-2 animate-pulse" />
            {/* Subtitle skeleton */}
            <div className="h-4 w-[180px] bg-[#f1f5f9] rounded mb-7 animate-pulse" />
            {/* Input skeleton */}
            <div className="h-11 w-full bg-[#f1f5f9] rounded-lg mb-3 animate-pulse" />
            {/* Button skeleton */}
            <div className="h-11 w-full bg-[#e2e8f0] rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row">
      {/* Left Panel - Teal */}
      <div className="hidden lg:flex lg:w-[55%] bg-[#0F766E] flex-col justify-center items-start px-16 min-h-dvh">
        <div className="max-w-[340px]">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-14">
            <div className="w-7 h-7 flex items-center justify-center">
              <Home className="w-7 h-7 text-white" />
            </div>
            <span className="text-xl font-semibold text-white tracking-tight">
              AgentFlow
            </span>
          </div>

          {/* Headline */}
          <h2 className="text-[32px] font-semibold text-white leading-[1.2] tracking-[-0.02em] mb-4">
            Welcome back to your daily follow-up tool
          </h2>

          {/* Body copy */}
          <p className="text-base text-white/80 leading-[1.6] mb-9">
            The only CRM designed for solo agents who want to close more deals
            without the complexity.
          </p>

          {/* Benefit bullets */}
          <div className="flex flex-col gap-[14px] mb-9">
            {[
              "See who to call today — instantly",
              "Track every lead without the clutter",
              "Set up in 3 minutes, not 3 hours",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <CheckCircle2 className="w-[18px] h-[18px] text-[#99f6e4] shrink-0" />
                <span className="text-[15px] text-white/90">{item}</span>
              </div>
            ))}
          </div>

          {/* Testimonial card */}
          <div className="bg-white/10 border border-white/20 rounded-xl p-5">
            <p className="text-sm text-white/90 italic leading-[1.5] mb-3">
              &ldquo;I tried 4 CRMs. This is the only one I actually open every
              day.&rdquo;
            </p>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-semibold text-white">
                MT
              </div>
              <div>
                <span className="text-[13px] font-medium text-white">
                  Marcus T.
                </span>
                <span className="text-[12px] text-white/65 ml-1.5">
                  · Solo agent, Austin TX
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile top bar */}
      <div className="lg:hidden flex items-center h-[72px] bg-[#0F766E] px-6">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 flex items-center justify-center">
            <Home className="w-6 h-6 text-white" />
          </div>
          <span className="text-lg font-semibold text-white tracking-tight">
            AgentFlow
          </span>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div
        role="main"
        className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12 py-12 bg-white min-h-dvh"
      >
        <div className="w-full max-w-[380px]">
          {/* Magic link success state */}
          {magicLinkSent ? (
            <div className="text-center">
              {/* Icon */}
              <div className="w-14 h-14 rounded-full bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-center mx-auto mb-5">
                <Mail className="w-7 h-7 text-[#16a34a]" />
              </div>
              <h2 className="text-2xl font-semibold text-[#0f172a] mb-2">
                Check your email
              </h2>
              <p className="text-[15px] text-[#64748b] leading-[1.6] mb-7 max-w-[320px] mx-auto">
                We sent a magic link to {sentEmail}. Click the link to sign in
                — it expires in 10 minutes.
              </p>
              <p className="text-[14px] text-[#64748b]">
                Didn&apos;t get it?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || magicLinkLoading}
                  className="text-[#0F766E] font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s...`
                    : "Resend the link"}
                </button>
              </p>
              <p className="text-[13px] text-[#94a3b8] mt-3">
                Wrong email?{" "}
                <button
                  type="button"
                  onClick={resetToMagicLink}
                  className="text-[#0F766E] hover:underline"
                >
                  Sign in with a different address
                </button>
              </p>
            </div>
          ) : forgotPasswordSent ? (
            /* Forgot password success state */
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-[#f0fdf4] border border-[#bbf7d0] flex items-center justify-center mx-auto mb-5">
                <Mail className="w-7 h-7 text-[#16a34a]" />
              </div>
              <h2 className="text-2xl font-semibold text-[#0f172a] mb-2">
                Reset link sent
              </h2>
              <p className="text-[15px] text-[#64748b] leading-[1.6] mb-7 max-w-[320px] mx-auto">
                Check your email for a link to reset your password. It expires
                in 1 hour.
              </p>
              <button
                type="button"
                onClick={resetToLogin}
                className="text-[14px] text-[#0F766E] font-medium hover:underline"
              >
                &larr; Back to sign in
              </button>
            </div>
          ) : (
            /* Form */
            <>
              {/* Heading */}
              <h1 className="text-[26px] font-semibold text-[#0f172a] tracking-[-0.02em] leading-[1.2] mb-2">
                Sign in to your account
              </h1>
              <p className="text-[15px] text-[#64748b] mb-7">
                {activeView === "forgot-password"
                  ? "Enter your email and we'll send you a reset link."
                  : "Enter your email to receive a magic link"}
              </p>

              {/* Back link for forgot password */}
              {activeView === "forgot-password" && (
                <button
                  type="button"
                  onClick={resetToLogin}
                  className="text-[14px] text-[#0F766E] font-medium hover:underline mb-4"
                >
                  &larr; Back to sign in
                </button>
              )}

              {/* Google OAuth button (hidden during forgot password) */}
              {activeView !== "forgot-password" && (
                <>
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={googleLoading}
                    aria-label="Continue with Google"
                    className="w-full h-11 flex items-center justify-center gap-2.5 bg-white text-[#374151] text-[15px] font-medium border-[1.5px] border-[#e2e8f0] rounded-lg cursor-pointer hover:bg-[#f8fafc] hover:border-[#cbd5e1] active:scale-[0.98] focus:outline-2 focus:outline-[#0F766E] focus:outline-offset-2 transition-all duration-150 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {googleLoading ? (
                      <Loader2 className="w-[18px] h-[18px] animate-spin" />
                    ) : (
                      <svg
                        className="w-[18px] h-[18px]"
                        viewBox="0 0 24 24"
                      >
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
                    )}
                    Continue with Google
                  </button>

                  {/* Divider */}
                  <div className="flex items-center my-5">
                    <div className="flex-1 h-px bg-[#e2e8f0]" />
                    <span className="text-[13px] text-[#94a3b8] px-3">
                      or
                    </span>
                    <div className="flex-1 h-px bg-[#e2e8f0]" />
                  </div>
                </>
              )}

              {/* Tab switcher (hidden during forgot password) */}
              {activeView !== "forgot-password" && (
                <div className="flex bg-[#f1f5f9] rounded-lg p-1 mb-5">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView("magic-link");
                      setAuthError("");
                      setEmailError("");
                      setEmailSuggestion("");
                    }}
                    className={`flex-1 h-[34px] rounded-md text-[14px] font-medium cursor-pointer transition-all duration-150 ${
                      activeView === "magic-link"
                        ? "bg-white text-[#0f172a] shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
                        : "bg-transparent text-[#64748b] hover:text-[#475569]"
                    }`}
                  >
                    Magic link
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveView("password");
                      setAuthError("");
                      setEmailError("");
                      setEmailSuggestion("");
                    }}
                    className={`flex-1 h-[34px] rounded-md text-[14px] font-medium cursor-pointer transition-all duration-150 ${
                      activeView === "password"
                        ? "bg-white text-[#0f172a] shadow-[0_1px_3px_rgba(0,0,0,0.1)]"
                        : "bg-transparent text-[#64748b] hover:text-[#475569]"
                    }`}
                  >
                    Password
                  </button>
                </div>
              )}

              {/* Auth error banner */}
              {authError && (
                <div
                  role="alert"
                  className="flex items-start gap-2 bg-[#fef2f2] border border-[#fecaca] rounded-lg p-3 mb-3"
                >
                  <AlertCircle className="w-4 h-4 text-[#dc2626] mt-0.5 shrink-0" />
                  <span className="text-[14px] text-[#dc2626] leading-[1.4]">
                    {authError}
                  </span>
                </div>
              )}

              {/* Magic link form */}
              {activeView === "magic-link" && !magicLinkSent && (
                <form onSubmit={handleMagicLink}>
                  <div className="mb-3">
                    <label
                      htmlFor="magic-email"
                      className="block text-[14px] font-medium text-[#374151] mb-1.5"
                    >
                      Email address
                    </label>
                    <input
                      ref={emailInputRef}
                      id="magic-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError("");
                        if (emailSuggestion) setEmailSuggestion("");
                      }}
                      onBlur={() => {
                        if (email) validateEmail(email, true);
                      }}
                      placeholder="you@example.com"
                      aria-describedby={
                        emailError
                          ? "magic-email-error"
                          : emailSuggestion
                            ? "magic-email-suggestion"
                            : undefined
                      }
                      aria-invalid={!!emailError}
                      className={`w-full h-11 px-3 text-[15px] text-[#0f172a] bg-white border-[1.5px] rounded-lg placeholder:text-[#94a3b8] focus:outline-none transition-all duration-150 ${
                        emailError
                          ? "border-[#dc2626] shadow-[0_0_0_3px_rgba(220,38,38,0.1)]"
                          : "border-[#e2e8f0] hover:border-[#94a3b8] focus:border-[#0F766E] focus:shadow-[0_0_0_3px_rgba(15,118,110,0.12)]"
                      }`}
                    />
                    {emailError && (
                      <p
                        id="magic-email-error"
                        className="flex items-center gap-1 mt-1 text-[13px] text-[#dc2626]"
                        role="alert"
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {emailError}
                      </p>
                    )}
                    {emailSuggestion && !emailError && (
                      <p
                        id="magic-email-suggestion"
                        className="mt-1 text-[13px] text-[#64748b]"
                      >
                        Did you mean{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setEmail(emailSuggestion);
                            setEmailSuggestion("");
                          }}
                          className="text-[#0F766E] font-medium hover:underline cursor-pointer"
                        >
                          {emailSuggestion}
                        </button>
                        ?
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={magicLinkLoading}
                    aria-busy={magicLinkLoading}
                    className="w-full h-11 flex items-center justify-center gap-2 bg-[#0F766E] text-white text-[15px] font-medium rounded-lg cursor-pointer hover:bg-[#0d6b64] active:bg-[#0a5c56] active:scale-[0.98] focus:outline-2 focus:outline-[#0F766E] focus:outline-offset-2 transition-all duration-150 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {magicLinkLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Mail className="w-4 h-4" />
                        Send magic link
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Password form */}
              {activeView === "password" && (
                <form onSubmit={handlePasswordSignIn}>
                  <div className="mb-3">
                    <label
                      htmlFor="password-email"
                      className="block text-[14px] font-medium text-[#374151] mb-1.5"
                    >
                      Email address
                    </label>
                    <input
                      ref={emailInputRef}
                      id="password-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError("");
                      }}
                      onBlur={() => {
                        if (email) validateEmail(email, false);
                      }}
                      placeholder="you@example.com"
                      aria-describedby={
                        emailError ? "password-email-error" : undefined
                      }
                      aria-invalid={!!emailError}
                      className={`w-full h-11 px-3 text-[15px] text-[#0f172a] bg-white border-[1.5px] rounded-lg placeholder:text-[#94a3b8] focus:outline-none transition-all duration-150 ${
                        emailError
                          ? "border-[#dc2626] shadow-[0_0_0_3px_rgba(220,38,38,0.1)]"
                          : "border-[#e2e8f0] hover:border-[#94a3b8] focus:border-[#0F766E] focus:shadow-[0_0_0_3px_rgba(15,118,110,0.12)]"
                      }`}
                    />
                    {emailError && (
                      <p
                        id="password-email-error"
                        className="flex items-center gap-1 mt-1 text-[13px] text-[#dc2626]"
                        role="alert"
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {emailError}
                      </p>
                    )}
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <label
                        htmlFor="password-input"
                        className="text-[14px] font-medium text-[#374151]"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setActiveView("forgot-password")}
                        className="text-[13px] text-[#0F766E] hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        ref={passwordInputRef}
                        id="password-input"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (passwordError) setPasswordError("");
                          if (authError) setAuthError("");
                        }}
                        placeholder="Your password"
                        aria-describedby={
                          passwordError ? "password-error" : undefined
                        }
                        aria-invalid={!!passwordError}
                        className={`w-full h-11 px-3 pr-10 text-[15px] text-[#0f172a] bg-white border-[1.5px] rounded-lg placeholder:text-[#94a3b8] focus:outline-none transition-all duration-150 ${
                          passwordError
                            ? "border-[#dc2626] shadow-[0_0_0_3px_rgba(220,38,38,0.1)]"
                            : "border-[#e2e8f0] hover:border-[#94a3b8] focus:border-[#0F766E] focus:shadow-[0_0_0_3px_rgba(15,118,110,0.12)]"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] cursor-pointer"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {passwordError && (
                      <p
                        id="password-error"
                        className="flex items-center gap-1 mt-1 text-[13px] text-[#dc2626]"
                        role="alert"
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {passwordError}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    aria-busy={passwordLoading}
                    className="w-full h-11 flex items-center justify-center gap-2 bg-[#0F766E] text-white text-[15px] font-medium rounded-lg cursor-pointer hover:bg-[#0d6b64] active:bg-[#0a5c56] active:scale-[0.98] focus:outline-2 focus:outline-[#0F766E] focus:outline-offset-2 transition-all duration-150 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {passwordLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign in"
                    )}
                  </button>
                </form>
              )}

              {/* Forgot password form */}
              {activeView === "forgot-password" && !forgotPasswordSent && (
                <form onSubmit={handleForgotPassword}>
                  <div className="mb-3">
                    <label
                      htmlFor="forgot-email"
                      className="block text-[14px] font-medium text-[#374151] mb-1.5"
                    >
                      Email address
                    </label>
                    <input
                      ref={emailInputRef}
                      id="forgot-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError("");
                      }}
                      onBlur={() => {
                        if (email) validateEmail(email, false);
                      }}
                      placeholder="you@example.com"
                      aria-describedby={
                        emailError ? "forgot-email-error" : undefined
                      }
                      aria-invalid={!!emailError}
                      className={`w-full h-11 px-3 text-[15px] text-[#0f172a] bg-white border-[1.5px] rounded-lg placeholder:text-[#94a3b8] focus:outline-none transition-all duration-150 ${
                        emailError
                          ? "border-[#dc2626] shadow-[0_0_0_3px_rgba(220,38,38,0.1)]"
                          : "border-[#e2e8f0] hover:border-[#94a3b8] focus:border-[#0F766E] focus:shadow-[0_0_0_3px_rgba(15,118,110,0.12)]"
                      }`}
                    />
                    {emailError && (
                      <p
                        id="forgot-email-error"
                        className="flex items-center gap-1 mt-1 text-[13px] text-[#dc2626]"
                        role="alert"
                      >
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        {emailError}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={forgotPasswordLoading}
                    aria-busy={forgotPasswordLoading}
                    className="w-full h-11 flex items-center justify-center gap-2 bg-[#0F766E] text-white text-[15px] font-medium rounded-lg cursor-pointer hover:bg-[#0d6b64] active:bg-[#0a5c56] active:scale-[0.98] focus:outline-2 focus:outline-[#0F766E] focus:outline-offset-2 transition-all duration-150 disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    {forgotPasswordLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      "Send reset link"
                    )}
                  </button>
                </form>
              )}

              {/* Sign up link */}
              {activeView !== "forgot-password" && (
                <p className="text-center text-[14px] text-[#64748b] mt-6">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/signup"
                    className="text-[#0F766E] font-medium hover:underline"
                  >
                    Sign up free
                  </Link>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <LoginContent />;
}
