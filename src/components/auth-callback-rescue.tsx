"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Safety net for Supabase OAuth redirect issue.
 *
 * When Supabase GoTrue fails to honor the `redirectTo` parameter,
 * it falls back to `site_url` (the root) and appends `?code=<pkce_code>`.
 * This component detects that scenario and redirects to `/auth/callback`
 * so the PKCE code exchange can complete.
 */
export function AuthCallbackRescue() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      // Redirect to the callback route with the code preserved
      const callbackUrl = `/auth/callback?code=${encodeURIComponent(code)}`;
      window.location.replace(callbackUrl);
    }
  }, [searchParams]);

  // This component renders nothing — it just performs the redirect
  return null;
}
