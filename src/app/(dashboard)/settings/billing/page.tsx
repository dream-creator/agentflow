"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, CreditCard, ExternalLink, Loader2 } from "lucide-react";

function BillingContent() {
  const searchParams = useSearchParams();
  const upgraded = searchParams.get("upgraded") === "true";
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState("");
  const supabase = createClient();

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("plan")
          .eq("id", user.id)
          .single();
        if (profile) {
          setPlan(profile.plan as "free" | "pro");
        }
      }
      setLoadingProfile(false);
    }
    fetchProfile();
  }, [supabase]);

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Failed to start checkout. Please try again.");
    }
    setLoading(false);
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-surface-900">Billing</h1>
        <p className="text-surface-500 text-sm mt-1">Manage your subscription</p>
      </div>

      {upgraded && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          <p className="text-sm text-emerald-700">
            Your account has been upgraded to Pro! You now have unlimited leads and pipelines.
          </p>
        </div>
      )}

      {loadingProfile ? (
        <div className="space-y-4">
          <div className="skeleton h-64 w-full" />
          <div className="skeleton h-48 w-full" />
        </div>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <div className="flex items-center justify-between mb-4">
              <span className="text-surface-700 font-medium">
                {plan === "pro" ? "Pro" : "Free"} Plan
              </span>
              <Badge variant={plan === "pro" ? "primary" : "default"}>
                {plan === "pro" ? "$19/mo" : "$0/mo"}
              </Badge>
            </div>
            {plan === "free" && (
              <div className="p-4 bg-primary-50 rounded-lg">
                <h3 className="font-heading font-semibold text-surface-900 mb-2">
                  Upgrade to Pro
                </h3>
                <ul className="space-y-1 mb-4">
                  {[
                    "Unlimited leads",
                    "Unlimited pipelines",
                    "Custom branding",
                    "SMS reminders",
                    "Priority support",
                  ].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-surface-600">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button onClick={handleUpgrade} loading={loading} className="w-full">
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-2" />
                  )}
                  Upgrade to Pro — $19/mo
                </Button>
                {error && (
                  <p className="text-sm text-destructive mt-2 text-center">{error}</p>
                )}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Plan Comparison</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-200">
                    <th className="text-left py-2 text-surface-500 font-medium">Feature</th>
                    <th className="text-center py-2 text-surface-500 font-medium">Free</th>
                    <th className="text-center py-2 text-surface-500 font-medium">Pro</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: "Active leads", free: "1", pro: "Unlimited" },
                    { feature: "Pipelines", free: "1", pro: "Unlimited" },
                    { feature: "Daily email digest", free: "✓", pro: "✓" },
                    { feature: "Custom branding", free: "—", pro: "✓" },
                    { feature: "SMS reminders", free: "—", pro: "✓" },
                    { feature: "Priority support", free: "—", pro: "✓" },
                  ].map((row) => (
                    <tr key={row.feature} className="border-b border-surface-100">
                      <td className="py-2 text-surface-700">{row.feature}</td>
                      <td className="py-2 text-center text-surface-500">{row.free}</td>
                      <td className="py-2 text-center text-surface-700 font-medium">{row.pro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="p-4 md:p-8"><div className="skeleton h-8 w-48 mb-6" /><div className="skeleton h-64 w-full" /></div>}>
      <BillingContent />
    </Suspense>
  );
}
