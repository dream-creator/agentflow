import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
});

export const STRIPE_CONFIG = {
  price: 1900, // $19.00
  currency: "usd",
  productName: "AgentFlow Pro",
  productDescription:
    "Unlimited leads, unlimited pipelines, custom branding, SMS reminders",
  interval: "month" as const,
};

export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  fullName?: string
): Promise<string> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();

  if (profile?.stripe_customer_id) {
    return profile.stripe_customer_id;
  }

  const customer = await stripe.customers.create({
    email,
    name: fullName || undefined,
    metadata: { user_id: userId },
  });

  await supabase
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);

  return customer.id;
}

export async function createCheckoutSession(
  customerId: string,
  userId: string
): Promise<string> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: STRIPE_CONFIG.currency,
          product_data: {
            name: STRIPE_CONFIG.productName,
            description: STRIPE_CONFIG.productDescription,
          },
          unit_amount: STRIPE_CONFIG.price,
          recurring: { interval: STRIPE_CONFIG.interval },
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?cancelled=true`,
    metadata: { user_id: userId },
  });

  return session.url!;
}

export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const userId = session.metadata?.user_id;
  if (!userId) return;

  const supabase = await createClient();
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

export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const supabase = await createClient();

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

export async function handlePaymentFailed(
  invoice: Stripe.Invoice
): Promise<void> {
  const customerId = invoice.customer as string;
  const supabase = await createClient();

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

export function constructWebhookEvent(
  body: string,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}

export { stripe };
