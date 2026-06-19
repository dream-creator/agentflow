import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimiter } from "@/lib/rate-limiter";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateKey = `export:${user.id}`;
  const { allowed } = await rateLimiter(rateKey, { limit: 5, window: 60 });
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  const [profileResult, leadsResult, actionsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single(),
    supabase
      .from("leads")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("actions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const exportData = {
    exportedAt: new Date().toISOString(),
    userId: user.id,
    profile: profileResult.data,
    leads: leadsResult.data ?? [],
    actions: actionsResult.data ?? [],
  };

  const json = JSON.stringify(exportData, null, 2);

  return new NextResponse(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="agentflow-export-${new Date().toISOString().split("T")[0]}.json"`,
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
