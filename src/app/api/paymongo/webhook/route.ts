import { NextRequest, NextResponse } from "next/server";
import {
  verifyWebhookSignature,
  handleSubscriptionActivated,
  handleSubscriptionCancelled,
  handlePaymentFailed,
  handlePaymentPaid,
  PayMongoError,
} from "@/lib/paymongo";
import { createServiceClient } from "@/lib/supabase/service";

interface PayMongoWebhookEvent {
  id: string;
  type: string;
  data: {
    id: string;
    type: string;
    attributes: Record<string, unknown>;
  };
}

export async function POST(request: NextRequest) {
  if (!process.env.PAYMONGO_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "PayMongo not configured" },
      { status: 500 },
    );
  }

  // Read raw body for signature verification
  const body = await request.text();
  const signature = request.headers.get("paymongo-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  // Verify webhook signature
  try {
    const isValid = verifyWebhookSignature(body, signature);
    if (!isValid) {
      console.error("PayMongo webhook signature verification failed");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  } catch (error) {
    console.error("PayMongo webhook verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  // Parse event
  let event: PayMongoWebhookEvent;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Deduplicate: check if we've already processed this event
  const supabase = createServiceClient();
  const { data: existingEvent } = await supabase
    .from("webhook_events")
    .select("id")
    .eq("paymongo_event_id", event.id)
    .single();

  if (existingEvent) {
    // Already processed — return 200 to acknowledge
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Process event
  try {
    const subscriptionId = event.data.id;

    switch (event.type) {
      case "subscription.activated":
        await handleSubscriptionActivated(subscriptionId);
        break;
      case "subscription.cancelled":
        await handleSubscriptionCancelled(subscriptionId);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(subscriptionId);
        break;
      case "invoice.paid":
        await handlePaymentPaid(subscriptionId);
        break;
      default:
        // Unhandled event type — log but return 200
        console.log(`Unhandled PayMongo event type: ${event.type}`);
    }

    // Record event as processed
    await supabase.from("webhook_events").insert({
      paymongo_event_id: event.id,
      event_type: event.type,
      processed_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error(`PayMongo webhook handler failed for ${event.type}:`, error);

    if (error instanceof PayMongoError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    }

    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
