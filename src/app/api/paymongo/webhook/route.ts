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

const PG_UNIQUE_VIOLATION = "23505";

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

  // Verify webhook signature before any parsing or DB work
  try {
    const isValid = verifyWebhookSignature(body, signature);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  // Parse event
  let event: PayMongoWebhookEvent;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Atomic dedup: insert the event first. The unique constraint on
  // paymongo_event_id guarantees that only one delivery can be processed.
  const { error: insertError } = await supabase.from("webhook_events").insert({
    paymongo_event_id: event.id,
    event_type: event.type,
    status: "pending",
  });

  if (insertError) {
    if (insertError.code === PG_UNIQUE_VIOLATION) {
      // Duplicate delivery. If it was already processed successfully, just
      // acknowledge it. If it failed or is still pending, we fall through and
      // re-process (PayMongo retries give us another chance to fix a transient
      // failure).
      const { data: existingEvent } = await supabase
        .from("webhook_events")
        .select("status")
        .eq("paymongo_event_id", event.id)
        .single();

      if (existingEvent?.status === "processed") {
        return NextResponse.json({ received: true, duplicate: true });
      }
    } else {
      return NextResponse.json(
        { error: "Failed to record event" },
        { status: 500 },
      );
    }
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
        // Unhandled event types are acknowledged with 200 so PayMongo does
        // not retry them, but we intentionally do not touch business state.
        break;
    }

    // Mark event as successfully processed
    await supabase
      .from("webhook_events")
      .update({
        status: "processed",
        processed_at: new Date().toISOString(),
      })
      .eq("paymongo_event_id", event.id);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    await supabase
      .from("webhook_events")
      .update({
        status: "failed",
        error_message: errorMessage,
      })
      .eq("paymongo_event_id", event.id);

    import("@sentry/nextjs").then(({ captureException }) =>
      captureException(error),
    );

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
