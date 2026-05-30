"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { showToast } from "@/components/ui/toast";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import Link from "next/link";
import type { Database } from "@/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default function EditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [brokerage, setBrokerage] = useState("");

  const supabase = createClient();

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data);
        setFullName(data.full_name);
        setEmail(data.email);
        setBrokerage(data.brokerage || "");
      }
      setLoading(false);
    }

    fetchProfile();
  }, [supabase, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    if (!profile) {
      setError("Profile not found");
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        brokerage: brokerage || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    showToast("Profile updated successfully!", "success");
    router.push("/settings");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <p className="text-surface-500">Profile not found.</p>
        <Link href="/settings" className="text-primary hover:underline mt-2 inline-block">
          Back to settings
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to settings
        </Link>
        <h1 className="font-heading text-2xl font-bold text-surface-900">Edit Profile</h1>
        <p className="text-surface-500 text-sm mt-1">Update your personal information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-surface-700 mb-1">
              Full name <span className="text-destructive">*</span>
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="input-field"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-surface-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              disabled
              className="input-field bg-surface-50 text-surface-500"
            />
            <p className="text-xs text-surface-400 mt-1">
              Email cannot be changed here. Contact support to update your email.
            </p>
          </div>

          <div>
            <label htmlFor="brokerage" className="block text-sm font-medium text-surface-700 mb-1">
              Brokerage
            </label>
            <input
              id="brokerage"
              type="text"
              value={brokerage}
              onChange={(e) => setBrokerage(e.target.value)}
              placeholder="e.g., Keller Williams, RE/MAX"
              className="input-field"
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-destructive-50 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Link href="/settings" className="flex-1">
              <Button type="button" variant="secondary" className="w-full">
                Cancel
              </Button>
            </Link>
            <Button type="submit" loading={saving} className="flex-1">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
