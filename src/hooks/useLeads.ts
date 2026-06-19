import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"];

export async function fetchLeads(): Promise<{ data: Lead[] | null; error: string | null }> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .range(0, 49999); // Supabase defaults to 1000 rows — override for large accounts

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function createLead(lead: LeadInsert): Promise<{ data: Lead | null; error: string | null }> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("leads")
    .insert({ ...lead, user_id: user.id })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function updateLead(id: string, updates: LeadUpdate): Promise<{ data: Lead | null; error: string | null }> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("leads")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function deleteLead(id: string): Promise<{ success: boolean; error: string | null }> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("leads")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}

export async function bulkDeleteLeads(ids: string[]): Promise<{ success: boolean; error: string | null }> {
  if (ids.length === 0) return { success: true, error: null };

  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase.rpc("bulk_delete_leads", { lead_ids: ids });
  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}

export async function bulkUpdateLeads(
  ids: string[],
  updates: Pick<LeadUpdate, "pipeline_stage">
): Promise<{ success: boolean; error: string | null }> {
  if (ids.length === 0) return { success: true, error: null };

  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const { error } = await supabase.rpc("bulk_update_leads", {
    lead_ids: ids,
    new_stage: updates.pipeline_stage,
  });
  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}
