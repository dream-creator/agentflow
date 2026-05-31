import { createClient } from "@/lib/supabase/client";
import { PLAN_LIMITS, type PlanType } from "@/lib/constants";

interface PlanLimitResult {
  allowed: boolean;
  plan: PlanType;
  currentCount: number;
  maxAllowed: number;
}

export async function checkPlanLimit(): Promise<PlanLimitResult> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { allowed: false, plan: "free", currentCount: 0, maxAllowed: 0 };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();

  const plan: PlanType = (profile?.plan as PlanType) || "free";
  const limits = PLAN_LIMITS[plan];

  const { count } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_active", true);

  const currentCount = count ?? 0;

  return {
    allowed: currentCount < limits.maxActiveLeads,
    plan,
    currentCount,
    maxAllowed: limits.maxActiveLeads,
  };
}
