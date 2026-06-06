"use client";

import { CheckCircle2, Loader2, Shield } from "lucide-react";

/**
 * Tiny status indicator that lives inside each auth form (right above
 * the submit button). Renders one of three states so the user has
 * continuous feedback that the invisible Cloudflare Turnstile check is
 * running and has succeeded:
 *
 *   - "protected"  : initial state, gray shield + "Protected by Cloudflare"
 *   - "verifying"  : widget iframe is mounted and the check is running,
 *                    spinner + "Verifying…"
 *   - "verified"   : check passed, green check + "Verified"
 *
 * The wrapper has a fixed `min-h` so swapping between states doesn't
 * shift the submit button. The whole pill is `aria-live="polite"` so
 * screen readers announce the verification outcome when it flips.
 *
 * The hidden captcha widget that drives this state lives off-screen in
 * the same form (see `src/components/turnstile-widget.tsx`) so the
 * visible layout never has to compete with the iframe.
 */
export function CaptchaStatusPill({
  captchaVerified,
  captchaReady,
}: {
  captchaVerified: boolean;
  captchaReady: boolean;
}) {
  const state = captchaVerified
    ? "verified"
    : captchaReady
      ? "verifying"
      : "protected";

  return (
    <div
      id="captcha-status"
      className="flex items-center justify-center min-h-[24px] mb-3"
      aria-live="polite"
    >
      <span
        className={
          state === "verified"
            ? "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success-50 border border-success-200 text-[11px] font-medium text-success-700"
            : "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-50 border border-surface-200 text-[11px] font-medium text-surface-500"
        }
      >
        {state === "verified" ? (
          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
        ) : state === "verifying" ? (
          <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
        ) : (
          <Shield className="h-3 w-3" aria-hidden="true" />
        )}
        <span>
          {state === "verified"
            ? "Verified"
            : state === "verifying"
              ? "Verifying…"
              : "Protected by Cloudflare"}
        </span>
      </span>
    </div>
  );
}
