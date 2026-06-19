"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const CONSENT_KEY = "agentflow_cookie_consent";

export function ConsentAwareAnalytics() {
  const [consent, setConsent] = useState<"accepted" | "declined" | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored === "accepted" || stored === "declined") {
      setConsent(stored);
    }

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setConsent(detail.consent);
    };
    window.addEventListener("cookieconsent", handler);
    return () => window.removeEventListener("cookieconsent", handler);
  }, []);

  if (consent !== "accepted") return null;

  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
