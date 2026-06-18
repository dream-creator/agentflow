import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
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

  // Parse interval from request body (default: monthly)
  let interval: PlanInterval = "monthly";
  try {
    const body = await request.json().catch(() => ({}));
    if (body?.interval === "annual") {
      interval = "annual";
    }
  } catch {
    // Default to monthly
  }

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
      return NextResponse.json({ url: checkoutUrl });
    }

    // If already active (card vaulted), return success without redirect
    return NextResponse.json({ url: null, subscriptionId });
  } catch (error) {
    if (error instanceof PayMongoError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    }
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
