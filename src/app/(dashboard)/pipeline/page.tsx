"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { UserPlus, GripVertical } from "lucide-react";
import Link from "next/link";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
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

type StageKey = (typeof STAGES)[number]["key"];

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
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

  const getLeadsByStage = useCallback(
    (stageKey: StageKey) => leads.filter((l) => l.pipeline_stage === stageKey),
    [leads]
  );

  const onDragEnd = useCallback(
    async (result: DropResult) => {
      const { destination, source, draggableId } = result;

      if (!destination) return;
      if (destination.droppableId === source.droppableId && destination.index === source.index) return;

      const newStage = destination.droppableId as StageKey;
      const lead = leads.find((l) => l.id === draggableId);

      if (!lead || lead.pipeline_stage === newStage) return;

      setUpdating(draggableId);

      setLeads((prev) =>
        prev.map((l) =>
          l.id === draggableId ? { ...l, pipeline_stage: newStage as Lead["pipeline_stage"] } : l
        )
      );

      const { error } = await supabase
        .from("leads")
        .update({ pipeline_stage: newStage, updated_at: new Date().toISOString() })
        .eq("id", draggableId);

      if (error) {
        setLeads((prev) =>
          prev.map((l) =>
            l.id === draggableId
              ? { ...l, pipeline_stage: lead.pipeline_stage as Lead["pipeline_stage"] }
              : l
          )
        );
      }

      setUpdating(null);
    },
    [leads, supabase]
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
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STAGES.map((stage) => {
              const stageLeads = getLeadsByStage(stage.key);

              return (
                <div key={stage.key} className="flex-shrink-0 w-72">
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="font-heading text-sm font-semibold text-surface-700 uppercase tracking-wide">
                      {stage.label}
                    </h2>
                    <Badge variant="default">{stageLeads.length}</Badge>
                  </div>
                  <Droppable droppableId={stage.key}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[200px] rounded-lg p-2 transition-colors ${
                          snapshot.isDraggingOver ? "bg-primary-50" : "bg-surface-50"
                        }`}
                      >
                        {stageLeads.map((lead, index) => (
                          <Draggable key={lead.id} draggableId={lead.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`mb-2 ${updating === lead.id ? "opacity-50" : ""}`}
                              >
                                <Card
                                  className={`${
                                    snapshot.isDragging ? "shadow-lg" : ""
                                  } hover:shadow-card-hover transition-shadow`}
                                >
                                  <div className="flex items-start gap-2">
                                    <div
                                      {...provided.dragHandleProps}
                                      className="mt-1 text-surface-400 hover:text-surface-600 cursor-grab active:cursor-grabbing"
                                    >
                                      <GripVertical className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between mb-1">
                                        <Link
                                          href={`/leads/${lead.id}`}
                                          className="font-medium text-surface-900 hover:text-primary truncate text-sm"
                                        >
                                          {lead.full_name}
                                        </Link>
                                      </div>
                                      {lead.next_action && (
                                        <p className="text-xs text-surface-500 mb-1 truncate">
                                          {lead.next_action}
                                        </p>
                                      )}
                                      <span className="text-xs text-surface-400">
                                        {lead.next_action_date
                                          ? new Date(lead.next_action_date).toLocaleDateString()
                                          : "No date"}
                                      </span>
                                    </div>
                                  </div>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}
