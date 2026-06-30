"use client";

import { useState, useCallback } from "react";
import { updateLead } from "@/hooks/useLeads";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import type { Database } from "@/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];

export function PipelineClient({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [updating, setUpdating] = useState<string | null>(null);

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

  return (
    <PipelineBoard
      leads={leads}
      updating={updating}
      onStageChange={onStageChange}
    />
  );
}
