import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import {
  cancelPayMongoSubscription,
  PayMongoError,
} from "@/lib/paymongo";

export async function POST() {
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("paymongo_subscription_id")
    .eq("id", user.id)
    .single();

  if (!profile?.paymongo_subscription_id) {
    return NextResponse.json(
      { error: "No active subscription" },
      { status: 400 },
    );
  }

  try {
    await cancelPayMongoSubscription(profile.paymongo_subscription_id);

    // Webhook will handle the actual plan downgrade
    // For now, just acknowledge the cancellation request
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof PayMongoError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    }
    console.error("Cancel subscription error:", error);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 },
    );
  }
}
