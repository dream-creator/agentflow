import { NextRequest, NextResponse } from "next/server";
import { handleGracePeriodExpired } from "@/lib/paymongo";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const downgradedCount = await handleGracePeriodExpired();

    console.info(`Billing check: ${downgradedCount} subscriptions downgraded after grace period`);

    return NextResponse.json({
      success: true,
      downgraded: downgradedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    import("@sentry/nextjs").then(({ captureException }) =>
      captureException(error),
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
