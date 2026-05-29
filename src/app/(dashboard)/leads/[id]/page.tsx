"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Phone, Mail, MessageSquare, Trash2, Edit } from "lucide-react";
import Link from "next/link";
import type { Database } from "@/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchLead() {
      const { data } = await supabase
        .from("leads")
        .select("*")
        .eq("id", params.id)
        .single();

      if (data) setLead(data);
      setLoading(false);
    }

    fetchLead();
  }, [supabase, params.id]);

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this lead?")) return;

    await supabase.from("leads").delete().eq("id", params.id as string);
    router.push("/leads");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <p className="text-surface-500">Lead not found.</p>
        <Link href="/leads" className="text-primary hover:underline mt-2 inline-block">
          Back to leads
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/leads"
          className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-700 mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to leads
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-surface-900">
              {lead.full_name}
            </h1>
            <Badge variant={getStageVariant(lead.pipeline_stage)} className="mt-2">
              {formatStage(lead.pipeline_stage)}
            </Badge>
          </div>
          <div className="flex gap-2">
            <Link href={`/leads/${lead.id}/edit`}>
              <Button variant="ghost" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <div className="space-y-3">
            {lead.phone && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-surface-500">Phone</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-surface-900">{lead.phone}</span>
                  <a
                    href={`tel:${lead.phone}`}
                    className="p-2 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-primary transition-colors min-w-touch min-h-touch flex items-center justify-center"
                  >
                    <Phone className="h-4 w-4" />
                  </a>
                  <a
                    href={`sms:${lead.phone}`}
                    className="p-2 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-primary transition-colors min-w-touch min-h-touch flex items-center justify-center"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </a>
                </div>
              </div>
            )}
            {lead.email && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-surface-500">Email</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-surface-900">{lead.email}</span>
                  <a
                    href={`mailto:${lead.email}`}
                    className="p-2 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-primary transition-colors min-w-touch min-h-touch flex items-center justify-center"
                  >
                    <Mail className="h-4 w-4" />
                  </a>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-surface-500">Source</span>
              <span className="text-sm text-surface-900 capitalize">
                {lead.source.replace("_", " ")}
              </span>
            </div>
          </div>
        </Card>

        {/* Next Action */}
        <Card>
          <CardHeader>
            <CardTitle>Next Action</CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {lead.next_action ? (
              <>
                <p className="text-sm text-surface-900">{lead.next_action}</p>
                {lead.next_action_date && (
                  <p className="text-xs text-surface-400">
                    Due: {new Date(lead.next_action_date).toLocaleDateString()}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-surface-400">No next action set</p>
            )}
          </div>
        </Card>

        {/* Notes */}
        {lead.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <p className="text-sm text-surface-700 whitespace-pre-wrap">{lead.notes}</p>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-3 gap-2">
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                className="btn-primary flex flex-col items-center gap-1 py-3"
              >
                <Phone className="h-5 w-5" />
                <span className="text-xs">Call</span>
              </a>
            )}
            {lead.phone && (
              <a
                href={`sms:${lead.phone}`}
                className="btn-secondary flex flex-col items-center gap-1 py-3"
              >
                <MessageSquare className="h-5 w-5" />
                <span className="text-xs">Text</span>
              </a>
            )}
            {lead.email && (
              <a
                href={`mailto:${lead.email}`}
                className="btn-secondary flex flex-col items-center gap-1 py-3"
              >
                <Mail className="h-5 w-5" />
                <span className="text-xs">Email</span>
              </a>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function formatStage(stage: string): string {
  return stage
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function getStageVariant(
  stage: string
): "default" | "primary" | "accent" | "destructive" | "success" | "warning" {
  const variants: Record<string, "default" | "primary" | "accent" | "destructive" | "success" | "warning"> = {
    new_lead: "primary",
    contacted: "accent",
    showing: "warning",
    offer: "default",
    closed_won: "success",
    closed_lost: "destructive",
  };
  return variants[stage] || "default";
}
