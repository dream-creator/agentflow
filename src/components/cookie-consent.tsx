"use client";

import { useEffect, useState, useCallback } from "react";
import { Shield } from "lucide-react";

const CONSENT_KEY = "agentflow_cookie_consent";

type ConsentState = "accepted" | "declined" | null;

export function getStoredConsent(): ConsentState {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(CONSENT_KEY);
  if (stored === "accepted" || stored === "declined") return stored;
  return null;
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored) setVisible(true);

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const dismiss = useCallback(
    (consent: ConsentState) => {
      if (!consent) return;
      localStorage.setItem(CONSENT_KEY, consent);
      setVisible(false);
      window.dispatchEvent(
        new CustomEvent("cookieconsent", { detail: { consent } })
      );
    },
    []
  );

  useEffect(() => {
    if (!visible) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss("declined");
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [visible, dismiss]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      className={`fixed bottom-0 inset-x-0 z-50 p-4 md:p-6 ${
        prefersReducedMotion ? "" : "animate-slide-up"
      }`}
    >
      <div className="mx-auto max-w-3xl bg-surface-900 text-white rounded-card p-5 md:p-6 shadow-elevated">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <Shield className="h-5 w-5 text-cta" />
            <span className="text-sm font-semibold">Cookie Preferences</span>
          </div>
          <p className="text-sm text-surface-300 flex-1 leading-relaxed">
            We use analytics cookies to understand how you use AgentFlow and
            improve the product. No tracking cookies. No third-party ads. You
            can decline and the app works exactly the same.
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => dismiss("declined")}
              className="px-4 py-2 text-sm font-medium text-surface-300 hover:text-white border border-surface-700 rounded-button hover:border-surface-500 transition-colors"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={() => dismiss("accepted")}
              className="px-4 py-2 text-sm font-semibold text-white bg-cta hover:bg-cta-600 rounded-button transition-colors"
            >
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
