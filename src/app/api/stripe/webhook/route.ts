import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: `Webhook Error: ${err}` }, { status: 400 });
  }

  const supabase = await createClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.user_id;

    if (userId) {
      await supabase
        .from("profiles")
        .update({
          plan: "pro",
          stripe_subscription_id: session.subscription as string,
          subscription_status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object as Stripe.Subscription;
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("stripe_subscription_id", subscription.id)
      .single();

    if (profile) {
      await supabase
        .from("profiles")
        .update({
          plan: "free",
          stripe_subscription_id: null,
          subscription_status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);
    }
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    // For invoice events, we need to find the customer and update their status
    const customerId = invoice.customer as string;
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (profile) {
      await supabase
        .from("profiles")
        .update({
          subscription_status: "past_due",
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);
    }
  }

  return NextResponse.json({ received: true });
}
