"use client";

import { useEffect, useState, useCallback } from "react";
import { fetchLeads, updateLead } from "@/hooks/useLeads";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { Database } from "@/types";

// DnD DropResult shape — avoids importing @hello-pangea/dnd in this file
// which would pull the 191KB library into the webpack chunk graph for auth pages
interface DropResult {
  draggableId: string;
  type: string;
  source: { index: number; droppableId: string };
  destination: { index: number; droppableId: string } | null;
}

const DndBoard = dynamic(
  () => import("@/components/pipeline/dnd-board").then((mod) => mod.DndBoard),
  {
    loading: () => (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-shrink-0 w-72">
            <Skeleton className="h-6 w-24 mb-3" />
            <Skeleton className="h-64 w-full" />
          </div>
        ))}
      </div>
    ),
    ssr: false,
  }
);

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

  const onDragEnd = useCallback(
    async (result: DropResult) => {
      const { destination, source, draggableId } = result;

      if (!destination) return;
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      )
        return;

      const newStage = destination.droppableId as Lead["pipeline_stage"];
      const lead = leads.find((l) => l.id === draggableId);

      if (!lead || lead.pipeline_stage === newStage) return;

      setUpdating(draggableId);

      setLeads((prev) =>
        prev.map((l) =>
          l.id === draggableId
            ? { ...l, pipeline_stage: newStage }
            : l
        )
      );

      const { error } = await updateLead(draggableId, {
        pipeline_stage: newStage,
      });

      if (error) {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === draggableId
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
        <DndBoard
          leads={leads}
          updating={updating}
          onDragEnd={onDragEnd}
        />
      )}
    </div>
  );
}
