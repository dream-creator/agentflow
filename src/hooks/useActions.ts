import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types";

type Action = Database["public"]["Tables"]["actions"]["Row"];
type ActionInsert = Database["public"]["Tables"]["actions"]["Insert"];

export async function fetchActions(leadId?: string): Promise<{ data: Action[] | null; error: string | null }> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  let query = supabase
    .from("actions")
    .select("*")
    .eq("user_id", user.id)
    .order("due_date", { ascending: true });

  if (leadId) {
    query = query.eq("lead_id", leadId);
  }

  const { data, error } = await query;

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function createAction(action: ActionInsert): Promise<{ data: Action | null; error: string | null }> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("actions")
    .insert({ ...action, user_id: user.id })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function completeAction(id: string): Promise<{ data: Action | null; error: string | null }> {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("actions")
    .update({
      completed: true,
      completed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}
