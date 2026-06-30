import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type Action = Database["public"]["Tables"]["actions"]["Row"];

export async function getLead(id: string): Promise<{
  lead: Lead | null;
  actions: Action[];
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { lead: null, actions: [], error: "Not authenticated" };

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .single();

  if (leadError || !lead) {
    return { lead: null, actions: [], error: leadError?.message ?? "Lead not found" };
  }

  const { data: actions } = await supabase
    .from("actions")
    .select("*")
    .eq("lead_id", id)
    .order("created_at", { ascending: false });

  return { lead, actions: actions ?? [], error: null };
}
