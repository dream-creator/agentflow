import { createServiceClient } from "@/lib/supabase/service";
import { sendMagicLinkEmail } from "@/lib/resend";
import { NextRequest, NextResponse } from "next/server";
import { apiRateLimit } from "@/lib/rate-limiter";

const TURNSTILE_SECRET_KEY = process.env.TURNSTILE_SECRET_KEY;

async function verifyTurnstileToken(token: string): Promise<boolean> {
  if (!TURNSTILE_SECRET_KEY) return true; // skip if not configured
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret: TURNSTILE_SECRET_KEY,
      response: token,
    }),
  });
  const data = await res.json();
  return data.success === true;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, fullName, captchaToken } = body as {
    email?: string;
    fullName?: string;
    captchaToken?: string;
  };

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return NextResponse.json(
      { error: "Invalid email address" },
      { status: 400 }
    );
  }

  // Verify Turnstile CAPTCHA (skip if captchaDisabled env var is set)
  const captchaDisabled = process.env.NEXT_PUBLIC_TURNSTILE_DISABLED === "true";
  if (!captchaDisabled) {
    if (!captchaToken) {
      return NextResponse.json(
        { error: "Captcha verification required" },
        { status: 400 }
      );
    }
    const captchaValid = await verifyTurnstileToken(captchaToken);
    if (!captchaValid) {
      return NextResponse.json(
        { error: "Captcha verification failed" },
        { status: 403 }
      );
    }
  }

  // Rate limit: 5 magic link requests per email per 10 minutes
  const rateLimitResult = await apiRateLimit(
    `magic-link:${email.toLowerCase()}`,
    5,
    600
  );
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const supabase = createServiceClient();

  // Build the redirect URL — after Supabase verifies the token, it redirects
  // back to our callback with a PKCE code.
  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "";
  const redirectTo = `${origin}/auth/callback`;

  // Generate the magic link (does NOT send an email — that's our job)
  const { data, error: linkError } = await supabase.auth.admin.generateLink({
    email: email.toLowerCase().trim(),
    type: "magiclink",
    options: {
      redirectTo,
      data: fullName ? { full_name: fullName } : undefined,
    },
  });

  if (linkError) {
    console.error("[magic-link] generateLink error:", linkError.message);
    return NextResponse.json(
      { error: "Failed to generate sign-in link. Please try again." },
      { status: 500 }
    );
  }

  const actionLink = data?.properties?.action_link;
  if (!actionLink) {
    console.error("[magic-link] No action_link in response");
    return NextResponse.json(
      { error: "Failed to generate sign-in link. Please try again." },
      { status: 500 }
    );
  }

  // Send the branded email via Resend (fire-and-forget is fine, but we await
  // so we can report errors back to the client).
  const userName =
    fullName || email.split("@")[0];
  const emailResult = await sendMagicLinkEmail(
    email.toLowerCase().trim(),
    userName,
    actionLink
  );

  if (!emailResult.success) {
    console.error("[magic-link] Email send failed:", emailResult.error);
    return NextResponse.json(
      { error: "Failed to send email. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
