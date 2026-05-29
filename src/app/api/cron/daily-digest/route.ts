import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  // Get all users with overdue/today follow-ups
  const { data: leads, error } = await supabase
    .from("leads")
    .select("user_id, full_name, next_action, next_action_date, profiles!inner(email, full_name)")
    .eq("is_active", true)
    .lte("next_action_date", today)
    .not("next_action", "is", null);

  if (error || !leads) {
    return NextResponse.json({ error: error?.message }, { status: 500 });
  }

  // Group by user
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

  // Send emails
  const results = [];
  for (const [userId, data] of Object.entries(userLeads)) {
    const leadList = data.leads
      .map(
        (l) =>
          `<li><strong>${l.full_name}</strong>${l.next_action ? `: ${l.next_action}` : ""}${l.next_action_date ? ` (due ${new Date(l.next_action_date).toLocaleDateString()})` : ""}</li>`
      )
      .join("");

    const html = `
      <h2>Good morning, ${data.name}!</h2>
      <p>You have ${data.leads.length} lead${data.leads.length === 1 ? "" : "s"} to follow up with today:</p>
      <ul>${leadList}</ul>
      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/follow-ups" style="display:inline-block;background-color:#0F766E;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:500;">
          View Follow-ups
        </a>
      </p>
      <p style="color:#94A3B8;font-size:12px;margin-top:24px;">
        — AgentFlow: The CRM for agents who hate CRMs
      </p>
    `;

    try {
      await resend.emails.send({
        from: "AgentFlow <daily@agentflow.app>",
        to: data.email,
        subject: `${data.leads.length} follow-up${data.leads.length === 1 ? "" : "s"} due today`,
        html,
      });
      results.push({ userId, status: "sent" });
    } catch (err) {
      results.push({ userId, status: "failed", error: String(err) });
    }
  }

  return NextResponse.json({
    sent: results.filter((r) => r.status === "sent").length,
    failed: results.filter((r) => r.status === "failed").length,
  });
}
