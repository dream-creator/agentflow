"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Construction, X, ArrowRight } from "lucide-react";
import { isMaintenanceBannerVisible } from "@/lib/feature-flags";
import { useSessionStorage } from "@/hooks/use-session-storage";

const DISMISS_KEY = "maintenance-banner-dismissed";
const CHANGELOG_PATH = "/changelog" as const;

/**
 * Shipping Status Bar.
 *
 * Renders a thin amber banner at the top of dashboard pages when the
 * NEXT_PUBLIC_MAINTENANCE_BANNER env var is the literal string "true".
 * Marketing surfaces (/, /login, /signup, /privacy, /terms) are
 * intentionally excluded — the banner lives only in the dashboard
 * layout (see src/app/(dashboard)/layout.tsx).
 *
 * Behavior:
 *   - Hidden by default (env var unset → returns null, zero layout impact).
 *   - Dismissible per session via the X button or Escape key. State
 *     persists in sessionStorage so the banner reappears on the next
 *     visit but not after refresh.
 *   - Mobile (< md): collapses to icon + "Active development" + View button.
 *   - Desktop (>= md): full "AgentFlow is in active development" + "See what's new".
 *   - Respects `prefers-reduced-motion: reduce` — no pulse animation.
 *   - Accessible: role="status", aria-live="polite", aria-label on
 *     dismiss button, focus ring on interactive elements.
 *
 *   `useSessionStorage` returns `false` by default → the banner is
 *   shown on the first visit of a session. The user clicks X or hits
 *   Escape → the value flips to `true` → banner disappears.
 */
export function MaintenanceBanner() {
  const [dismissed, setDismissed] = useSessionStorage<boolean>(DISMISS_KEY, false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Detect prefers-reduced-motion once after mount (no SSR mismatch —
  // initial render returns false, then we re-render with the user's
  // actual setting).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (!isMaintenanceBannerVisible()) return null;
  if (dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Development status notification"
      data-testid="maintenance-banner"
      className="bg-warning-50 border-b border-warning-200 text-warning-800"
    >
      <div className="mx-auto flex max-w-screen-2xl items-center gap-3 px-4 py-2.5 md:gap-4 md:px-6">
        {/* Status indicator — pulsing dot (animation paused when
            user prefers reduced motion). */}
        <span
          aria-hidden="true"
          className="relative flex h-2 w-2 shrink-0"
        >
          {!reducedMotion && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning-500 opacity-60" />
          )}
          <span className="relative inline-flex h-2 w-2 rounded-full bg-warning-500" />
        </span>

        {/* Icon — hidden from screen readers (decorative). */}
        <Construction
          aria-hidden="true"
          className="hidden h-4 w-4 shrink-0 text-warning-700 md:block"
        />

        {/* Status text — short on mobile, full on desktop. */}
        <p className="flex-1 text-sm font-medium">
          <span className="md:hidden">Active development</span>
          <span className="hidden md:inline">
            AgentFlow is in active development
          </span>
        </p>

        {/* Secondary action — desktop only ("See what's new" link). */}
        <Link
          href={CHANGELOG_PATH}
          className="hidden text-sm font-medium text-warning-700 underline-offset-2 transition-colors hover:text-warning-900 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warning-500 md:inline-flex md:items-center md:gap-1"
        >
          See what&apos;s new
          <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
        </Link>

        {/* Mobile "View" button — same destination, different label. */}
        <Link
          href={CHANGELOG_PATH}
          className="inline-flex h-8 items-center rounded-button border border-warning-300 bg-white px-3 text-xs font-semibold text-warning-700 transition-colors hover:bg-warning-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warning-500 md:hidden"
        >
          View
        </Link>

        {/* Dismiss button — visible on all viewports, also dismisses
            on Escape when focused. */}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setDismissed(true);
          }}
          aria-label="Dismiss notification"
          className="ml-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-button text-warning-700 transition-colors hover:bg-warning-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warning-500"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
