"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchLeads, updateLead } from "@/hooks/useLeads";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import Link from "next/link";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import type { Database } from "@/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    async function loadLeads() {
      const { data, error } = await fetchLeads();
      if (data) setLeads(data);
      setLoading(false);
    }

    loadLeads();
  }, []);

  const onStageChange = useCallback(
    async (leadId: string, newStage: string) => {
      const lead = leads.find((l) => l.id === leadId);
      if (!lead || lead.pipeline_stage === newStage) return;

      setUpdating(leadId);

      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId
            ? { ...l, pipeline_stage: newStage as Lead["pipeline_stage"] }
            : l
        )
      );

      const { error } = await updateLead(leadId, {
        pipeline_stage: newStage as Lead["pipeline_stage"],
      });

      if (error) {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === leadId
              ? { ...l, pipeline_stage: lead.pipeline_stage }
              : l
          )
        );
      }

      setUpdating(null);
    },
    [leads]
  );

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-surface-900">
            Pipeline
          </h1>
          <p className="text-surface-500 text-sm mt-1">
            {leads.length} active leads
          </p>
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
          icon={<UserPlus className="h-6 w-6 text-surface-500" />}
          title="No leads yet"
          description="Add your first lead to start building your pipeline."
          action={
            <Link href="/leads/new">
              <Button>Add your first lead</Button>
            </Link>
          }
        />
      ) : (
        <PipelineBoard
          leads={leads}
          updating={updating}
          onStageChange={onStageChange}
        />
      )}
    </div>
  );
}
