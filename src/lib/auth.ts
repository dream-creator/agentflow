/**
 * Returns the base URL the browser is currently on, or falls back to the
 * configured `NEXT_PUBLIC_APP_URL` when there is no browser context
 * (server-side rendering, server actions, email link generation outside
 * a request). Use this for OAuth callback URLs and email redirect
 * targets so the callback lands the user back on the same host they
 * signed in from — works automatically for localhost, Vercel preview
 * deploys, and the canonical production domain without per-environment
 * env var configuration.
 */
export function getBrowserOrigin(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL || "";
}

export function getAuthCallbackUrl(path: string = "/auth/callback"): string {
  return `${getBrowserOrigin()}${path}`;
}

export function getOAuthRedirectTo(): string {
  return getAuthCallbackUrl("/auth/callback");
}
