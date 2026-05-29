"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { UserPlus, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Database } from "@/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];

const STAGES = [
  { key: "new_lead", label: "New Lead", color: "bg-primary-100 text-primary-700" },
  { key: "contacted", label: "Contacted", color: "bg-accent-100 text-accent-700" },
  { key: "showing", label: "Showing", color: "bg-amber-100 text-amber-700" },
  { key: "offer", label: "Offer", color: "bg-surface-100 text-surface-600" },
  { key: "closed_won", label: "Closed Won", color: "bg-emerald-100 text-emerald-700" },
  { key: "closed_lost", label: "Closed Lost", color: "bg-destructive-50 text-destructive" },
] as const;

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchLeads() {
      const { data } = await supabase
        .from("leads")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (data) setLeads(data);
      setLoading(false);
    }

    fetchLeads();
  }, [supabase]);

  async function moveToStage(leadId: string, newStage: string) {
    await supabase
      .from("leads")
      .update({ pipeline_stage: newStage, updated_at: new Date().toISOString() })
      .eq("id", leadId);

    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, pipeline_stage: newStage as Lead["pipeline_stage"] } : l))
    );
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-surface-900">Pipeline</h1>
          <p className="text-surface-500 text-sm mt-1">{leads.length} active leads</p>
        </div>
        <Link href="/leads/new">
          <Button size="sm">
            <UserPlus className="h-4 w-4 mr-1" />
            Add Lead
          </Button>
        </Link>
      </div>

      {leads.length === 0 ? (
        <EmptyState
          icon={<UserPlus className="h-6 w-6 text-surface-400" />}
          title="No leads yet"
          description="Add your first lead to start building your pipeline."
          action={
            <Link href="/leads/new">
              <Button>Add your first lead</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {STAGES.map((stage) => {
            const stageLeads = leads.filter((l) => l.pipeline_stage === stage.key);
            if (stageLeads.length === 0) return null;

            return (
              <div key={stage.key}>
                <div className="flex items-center gap-2 mb-3">
                  <h2 className="font-heading text-sm font-semibold text-surface-700 uppercase tracking-wide">
                    {stage.label}
                  </h2>
                  <Badge variant="default">{stageLeads.length}</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {stageLeads.map((lead) => (
                    <Card key={lead.id} className="hover:shadow-card-hover transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="font-medium text-surface-900 hover:text-primary truncate"
                        >
                          {lead.full_name}
                        </Link>
                      </div>
                      {lead.next_action && (
                        <p className="text-sm text-surface-500 mb-2 truncate">
                          {lead.next_action}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-surface-400">
                          {lead.next_action_date
                            ? new Date(lead.next_action_date).toLocaleDateString()
                            : "No date"}
                        </span>
                        <div className="flex gap-1">
                          {STAGES.filter(
                            (s) =>
                              s.key !== lead.pipeline_stage &&
                              s.key !== "closed_won" &&
                              s.key !== "closed_lost"
                          )
                            .slice(0, 2)
                            .map((s) => (
                              <button
                                key={s.key}
                                onClick={() => moveToStage(lead.id, s.key)}
                                className="p-1 rounded hover:bg-surface-100 text-surface-400 hover:text-primary transition-colors min-w-touch min-h-touch flex items-center justify-center"
                                title={`Move to ${s.label}`}
                              >
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
