import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? searchParams.get("redirect") ?? "/";
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (error) {
    console.error("OAuth error:", error, errorDescription);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    if (supabase) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (!exchangeError) {
        const redirectUrl = next.startsWith("/") && !next.startsWith("//") ? next : "/";
        return NextResponse.redirect(`${origin}${redirectUrl}`);
      }
      console.error("Session exchange error:", exchangeError.message);
    } else {
      console.error("Supabase client not available - check env vars");
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
