import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? searchParams.get("redirect") ?? "/";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  console.log("[auth/callback] Incoming:", {
    hasCode: !!code,
    hasNext: !!searchParams.get("next"),
    hasRedirect: !!searchParams.get("redirect"),
    error,
    errorDescription,
    url: request.url,
  });

  if (error) {
    console.error("[auth/callback] OAuth provider error:", error, errorDescription);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (!exchangeError) {
        console.log("[auth/callback] Exchange success, redirecting to:", next);
        const redirectUrl = next.startsWith("/") && !next.startsWith("//") ? next : "/";
        return NextResponse.redirect(`${origin}${redirectUrl}`);
      }
      console.error("[auth/callback] Exchange failed:", exchangeError.message, exchangeError);
    } catch (err) {
      console.error("[auth/callback] Exception during exchange:", err);
    }
  } else {
    console.error("[auth/callback] No code parameter in callback URL");
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
