import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { checkoutBodySchema } from "@/lib/validations";
import { apiRateLimit } from "@/lib/rate-limiter";
import {
  getOrCreatePayMongoCustomer,
  createPayMongoSubscription,
  PayMongoError,
  type PlanInterval,
} from "@/lib/paymongo";

export async function POST(request: NextRequest) {
  if (!process.env.PAYMONGO_SECRET_KEY) {
    return NextResponse.json(
      { error: "PayMongo not configured" },
      { status: 500 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimitResult = await apiRateLimit(
    `paymongo:checkout:${user.id}`,
    10,
    60,
  );
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(rateLimitResult.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": rateLimitResult.reset.toISOString(),
        },
      },
    );
  }

  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const parseResult = checkoutBodySchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parseResult.error.flatten() },
      { status: 400 },
    );
  }

  const interval = parseResult.data.interval as PlanInterval;

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", user.id)
    .single();

  try {
    const customerId = await getOrCreatePayMongoCustomer(
      user.id,
      profile?.email || user.email!,
      profile?.full_name || undefined,
    );

    const { subscriptionId, checkoutUrl } = await createPayMongoSubscription(
      customerId,
      user.id,
      interval,
    );

    // If checkout URL exists, redirect to PayMongo hosted checkout
    if (checkoutUrl) {
      return NextResponse.json(
        { url: checkoutUrl },
        {
          headers: {
            "X-RateLimit-Limit": String(rateLimitResult.limit),
            "X-RateLimit-Remaining": String(rateLimitResult.remaining),
            "X-RateLimit-Reset": rateLimitResult.reset.toISOString(),
          },
        },
      );
    }

    // If already active (card vaulted), return success without redirect
    return NextResponse.json(
      { url: null, subscriptionId },
      {
        headers: {
          "X-RateLimit-Limit": String(rateLimitResult.limit),
          "X-RateLimit-Remaining": String(rateLimitResult.remaining),
          "X-RateLimit-Reset": rateLimitResult.reset.toISOString(),
        },
      },
    );
  } catch (error) {
    if (error instanceof PayMongoError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    }
    import("@sentry/nextjs").then(({ captureException }) =>
      captureException(error),
    );
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
