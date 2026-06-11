import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendDailyDigest } from "@/lib/resend";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  const supabase = createServiceClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: leads, error } = await supabase
    .from("leads")
    .select("user_id, full_name, next_action, next_action_date, profiles!inner(email, full_name)")
    .eq("is_active", true)
    .lte("next_action_date", today)
    .not("next_action", "is", null);

  if (error || !leads) {
    console.error("Daily digest query error:", error?.message);
    return NextResponse.json({ error: "Failed to fetch leads for digest" }, { status: 500 });
  }

  const userLeads: Record<string, { email: string; name: string; leads: typeof leads }> = {};
  for (const lead of leads) {
    const userId = lead.user_id;
    if (!userLeads[userId]) {
      const profile = lead.profiles as unknown as { email: string; full_name: string };
      userLeads[userId] = {
        email: profile.email,
        name: profile.full_name,
        leads: [],
      };
    }
    userLeads[userId].leads.push(lead);
  }

  const results = [];
  for (const [userId, data] of Object.entries(userLeads)) {
    const result = await sendDailyDigest(data.email, data.name, data.leads);
    results.push({ userId, status: result.success ? "sent" : "failed", error: result.error });
  }

  return NextResponse.json({
    sent: results.filter((r) => r.status === "sent").length,
    failed: results.filter((r) => r.status === "failed").length,
  });
}
