import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import {
  getOrCreateStripeCustomer,
  createCheckoutSession,
} from "@/lib/stripe";

export async function POST(request: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", user.id)
    .single();

  const customerId = await getOrCreateStripeCustomer(
    user.id,
    profile?.email || user.email!,
    profile?.full_name || undefined
  );

  const url = await createCheckoutSession(customerId, user.id);

  return NextResponse.json({ url });
}
