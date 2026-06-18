"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getOAuthRedirectTo } from "@/lib/auth";
import { Loader2 } from "lucide-react";

type Provider = "google" | "slack_oidc" | "linkedin_oidc";

const PROVIDER_DISPLAY: Record<Provider, string> = {
  google: "Google",
  slack_oidc: "Slack",
  linkedin_oidc: "LinkedIn",
};

interface OAuthButtonsProps {
  onError?: (message: string) => void;
}

const ALL_PROVIDERS: Provider[] = ["google", "slack_oidc", "linkedin_oidc"];

async function getEnabledProviders(): Promise<Set<Provider>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return new Set(ALL_PROVIDERS);

  try {
    const res = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: key },
    });
    const data = await res.json();
    const ext = data?.external ?? {};
    const enabled: Provider[] = [];
    if (ext.google) enabled.push("google");
    if (ext.slack_oidc) enabled.push("slack_oidc");
    if (ext.linkedin_oidc) enabled.push("linkedin_oidc");
    return new Set(enabled);
  } catch {
    return new Set(ALL_PROVIDERS);
  }
}

export function OAuthButtons({ onError }: OAuthButtonsProps) {
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);
  const [enabledProviders, setEnabledProviders] = useState<Set<Provider> | null>(null);

  useEffect(() => {
    getEnabledProviders().then(setEnabledProviders);
  }, []);

  const handleOAuth = async (provider: Provider) => {
    if (enabledProviders && !enabledProviders.has(provider)) {
      onError?.(`${PROVIDER_DISPLAY[provider]} sign-in is not available yet. Please use another method.`);
      return;
    }
    setLoadingProvider(provider);
    const { error } = await createClient().auth.signInWithOAuth({
      provider,
      options: { redirectTo: getOAuthRedirectTo() },
    });
    if (error) {
      const msg =
        error.message?.includes("provider is not enabled")
          ? `${PROVIDER_DISPLAY[provider]} sign-in is not available yet. Please use another method.`
          : "Something went wrong. Please try again.";
      onError?.(msg);
      setLoadingProvider(null);
    }
  };

  const isDisabled = (provider: Provider) =>
    loadingProvider !== null || (enabledProviders !== null && !enabledProviders.has(provider));

  return (
    <div className="flex flex-col gap-3">
      {/* Google — hero button */}
      <button
        type="button"
        onClick={() => handleOAuth("google")}
        disabled={isDisabled("google")}
        aria-label="Continue with Google"
        className="w-full h-12 flex items-center justify-center gap-2.5 bg-white text-surface-700 text-[15px] font-medium border-[1.5px] border-surface-200 rounded-lg cursor-pointer hover:bg-surface-50 hover:border-surface-300 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loadingProvider === "google" ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
        )}
        Continue with Google
      </button>

      {/* Slack + LinkedIn — icon row */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleOAuth("slack_oidc")}
          disabled={isDisabled("slack_oidc")}
          aria-label="Continue with Slack"
          className="h-11 flex items-center justify-center gap-2 bg-white text-surface-600 text-[14px] font-medium border-[1.5px] border-surface-200 rounded-lg cursor-pointer hover:bg-surface-50 hover:border-surface-300 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingProvider === "slack_oidc" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#E01E5A" />
              <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#36C5F0" />
              <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.27 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.163 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" fill="#2EB67D" />
              <path d="M15.163 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.163 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.27a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.315A2.527 2.527 0 0 1 24 15.163a2.528 2.528 0 0 1-2.522 2.523h-6.315z" fill="#ECB22E" />
            </svg>
          )}
          Slack
        </button>

        <button
          type="button"
          onClick={() => handleOAuth("linkedin_oidc")}
          disabled={isDisabled("linkedin_oidc")}
          aria-label="Continue with LinkedIn"
          className="h-11 flex items-center justify-center gap-2 bg-white text-surface-600 text-[14px] font-medium border-[1.5px] border-surface-200 rounded-lg cursor-pointer hover:bg-surface-50 hover:border-surface-300 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingProvider === "linkedin_oidc" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="#0A66C2" />
            </svg>
          )}
          LinkedIn
        </button>
      </div>
    </div>
  );
}
