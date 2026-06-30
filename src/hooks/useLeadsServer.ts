import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];

const PAGE_SIZE = 1000;

export async function getLeadsForServer(): Promise<{
  data: Lead[] | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const allLeads: Lead[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) return { data: null, error: error.message };
    if (!data || data.length === 0) break;

    allLeads.push(...data);
    hasMore = data.length === PAGE_SIZE;
    offset += PAGE_SIZE;
  }

  return { data: allLeads, error: null };
}
