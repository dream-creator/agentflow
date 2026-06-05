"use client";

import { lazy, Suspense, useEffect, useState } from "react";
import { Loader2, AlertCircle, RefreshCw, FlaskConical } from "lucide-react";

const Turnstile = lazy(() =>
  import("@marsidev/react-turnstile").then((mod) => ({
    default: mod.Turnstile,
  }))
);

interface TurnstileWidgetProps {
  onSuccess: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
  /**
   * Optional callback fired once the Turnstile iframe has rendered and the
   * verification challenge is visible. Lets the parent page distinguish
   * "widget still loading" from "widget shown, awaiting user interaction"
   * so it can disable submit until verification is complete.
   */
  onLoad?: () => void;
  theme?: "light" | "dark" | "auto";
  /**
   * Width of the Turnstile iframe in pixels. Defaults to 280 so the widget
   * fits inside 320px viewports without horizontal overflow. Pass a larger
   * value for desktop layouts if you have the horizontal space.
   */
  width?: number;
}

/**
 * When the deploy environment sets `NEXT_PUBLIC_TURNSTILE_TEST_BYPASS=true`
 * the widget skips the Turnstile iframe + Cloudflare round-trip entirely
 * and auto-fires onSuccess with a mock token. This is for staging / preview
 * environments only — production Supabase still has `security_captcha_enabled`
 * on, so a fake token will be rejected at the Supabase auth layer. The env
 * var is `NEXT_PUBLIC_` because the widget renders client-side and needs
 * the value at runtime; do NOT set it in production.
 */
const TEST_BYPASS_ENABLED =
  process.env.NEXT_PUBLIC_TURNSTILE_TEST_BYPASS === "true";
const TEST_BYPASS_TOKEN = "test-bypass-token";

/**
 * Visual stand-in rendered when the test bypass is active. Shows a clearly
 * labeled "Test mode" badge so anyone running tests can see at a glance that
 * captcha is not real. Auto-fires onSuccess once on mount so the form
 * becomes submittable the same way it would after a real verification.
 */
function TurnstileTestBypass({
  onSuccess,
  width,
}: {
  onSuccess: (token: string) => void;
  width: number;
}) {
  useEffect(() => {
    // Fire once after mount. The auth page's `captchaVerified` derived
    // value flips to true and the submit button enables. We deliberately
    // skip onLoad — the auth page's "Loading..." → "Complete verification"
    // text transition is meaningless when there's nothing to verify.
    onSuccess(TEST_BYPASS_TOKEN);
  }, [onSuccess]);

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="turnstile-widget"
      data-bypass="true"
      data-width={width}
      className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-warning-300 bg-warning-50 px-3 py-3"
      style={{ width, minHeight: 65 }}
    >
      <FlaskConical
        className="h-4 w-4 text-warning-700 shrink-0"
        aria-hidden="true"
      />
      <div className="flex flex-col leading-tight">
        <span className="text-[13px] font-medium text-warning-700">
          Test mode
        </span>
        <span className="text-[11px] text-warning-700/80">
          Captcha bypassed (NEXT_PUBLIC_TURNSTILE_TEST_BYPASS)
        </span>
      </div>
    </div>
  );
}

export function TurnstileWidget({
  onSuccess,
  onExpire,
  onError,
  onLoad,
  theme = "auto",
  width = 280,
}: TurnstileWidgetProps) {
  // Internal error state — when the Turnstile script fails to load or the
  // challenge errors out, we surface a visible message with a retry button
  // instead of letting the page silently submit an empty token.
  const [loadError, setLoadError] = useState<string | null>(null);
  // Bumping this key forces React to remount the lazy chunk and re-run
  // the script load — simplest reliable retry for an iframe-based widget.
  const [retryKey, setRetryKey] = useState(0);

  // Short-circuit before any Turnstile code runs. The bypass renders its
  // own component so the @marsidev/react-turnstile chunk is never fetched
  // in test environments — saves the ~40 KB lazy import and avoids any
  // CSP / network issues with challenges.cloudflare.com in test runners.
  if (TEST_BYPASS_ENABLED) {
    return <TurnstileTestBypass onSuccess={onSuccess} width={width} />;
  }

  const handleRetry = () => {
    setLoadError(null);
    setRetryKey((k) => k + 1);
  };

  if (loadError) {
    return (
      <div
        role="alert"
        aria-live="polite"
        className="flex items-center justify-between gap-3 rounded-lg border border-destructive-100 bg-destructive-50 px-3 py-2 text-left"
      >
        <div className="flex items-start gap-2 min-w-0">
          <AlertCircle
            className="h-4 w-4 text-destructive mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <p className="text-[13px] text-destructive leading-snug">{loadError}</p>
        </div>
        <button
          type="button"
          onClick={handleRetry}
          className="inline-flex items-center gap-1 rounded-md border border-destructive-200 bg-white px-2.5 py-1 text-[12px] font-medium text-destructive hover:bg-destructive-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-1 transition-colors shrink-0"
        >
          <RefreshCw className="h-3 w-3" aria-hidden="true" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      className="flex justify-center"
      data-testid="turnstile-widget"
      data-width={width}
    >
      <Suspense
        fallback={
          <div
            role="status"
            aria-live="polite"
            className="flex items-center justify-center gap-2 rounded-lg border border-surface-200 bg-surface-50 px-3 py-3"
            style={{ width, minHeight: 65 }}
          >
            <Loader2
              className="h-4 w-4 animate-spin text-surface-500"
              aria-hidden="true"
            />
            <span className="text-[13px] text-surface-500">
              Loading verification...
            </span>
          </div>
        }
      >
        <Turnstile
          key={retryKey}
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
          onSuccess={(token: string) => {
            setLoadError(null);
            onSuccess(token);
          }}
          onExpire={() => {
            onExpire?.();
          }}
          onError={() => {
            setLoadError(
              "Verification failed to load. Check your connection and retry."
            );
            onError?.();
          }}
          onLoad={onLoad}
          options={{ theme, size: "flexible" }}
        />
      </Suspense>
    </div>
  );
}
