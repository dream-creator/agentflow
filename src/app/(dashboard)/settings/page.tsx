"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { fetchProfile } from "@/hooks/useProfile";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LogOut, CreditCard, User, Edit, Download } from "lucide-react";
import Link from "next/link";
import type { Database } from "@/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function loadProfile() {
      const { data, error } = await fetchProfile();
      if (error || !data) {
        router.push("/login");
        return;
      }
      setProfile(data);
      setLoading(false);
    }

    loadProfile();
  }, [router]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-surface-900">Settings</h1>
        <p className="text-surface-500 text-sm mt-1">Manage your account</p>
      </div>

      <div className="space-y-4">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile
              </div>
              <Link href="/settings/profile/edit">
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-surface-500">Name</span>
              <span className="text-sm text-surface-900">{profile?.full_name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-surface-500">Email</span>
              <span className="text-sm text-surface-900">{profile?.email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-surface-500">Brokerage</span>
              <span className="text-sm text-surface-900">{profile?.brokerage || "Not set"}</span>
            </div>
          </div>
        </Card>

        {/* Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription
            </CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-surface-500">Current Plan</span>
              <Badge variant={profile?.plan === "pro" ? "primary" : "default"}>
                {profile?.plan === "pro" ? "Pro" : "Free"}
              </Badge>
            </div>
            {profile?.plan === "free" && (
              <div className="pt-2">
                <Button className="w-full" onClick={() => router.push("/settings/billing")}>
                  Upgrade to Pro — $8/mo
                </Button>
                <p className="text-xs text-surface-500 text-center mt-2">
                  Unlimited leads, unlimited pipelines, custom branding
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Data Export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Your Data
            </CardTitle>
          </CardHeader>
          <div className="space-y-3">
            <p className="text-sm text-surface-500">
              Download a copy of all your leads, contacts, and activity history.
            </p>
            <Button
              variant="secondary"
              className="w-full"
              onClick={async () => {
                const res = await fetch("/api/export");
                if (!res.ok) return;
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `agentflow-export-${new Date().toISOString().split("T")[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download My Data
            </Button>
          </div>
        </Card>

        {/* Sign Out */}
        <Card>
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive-50"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        </Card>
      </div>
    </div>
  );
}
