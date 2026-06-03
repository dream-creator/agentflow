"use client";

import { useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GripVertical } from "lucide-react";
import Link from "next/link";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import type { Database } from "@/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];

const STAGES = [
  { key: "new_lead", label: "New Lead" },
  { key: "contacted", label: "Contacted" },
  { key: "showing", label: "Showing" },
  { key: "offer", label: "Offer" },
  { key: "closed_won", label: "Closed Won" },
  { key: "closed_lost", label: "Closed Lost" },
] as const;

type StageKey = (typeof STAGES)[number]["key"];

interface DndBoardProps {
  leads: Lead[];
  updating: string | null;
  onDragEnd: (result: DropResult) => void;
}

export function DndBoard({ leads, updating, onDragEnd }: DndBoardProps) {
  const getLeadsByStage = useCallback(
    (stageKey: StageKey) => leads.filter((l) => l.pipeline_stage === stageKey),
    [leads]
  );

  return (
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
                            className={`mb-2 ${
                              updating === lead.id ? "opacity-50" : ""
                            }`}
                          >
                            <Card
                              className={`${
                                snapshot.isDragging ? "shadow-lg" : ""
                              } hover:shadow-card-hover transition-shadow`}
                            >
                              <div className="flex items-start gap-2">
                                <div
                                  {...provided.dragHandleProps}
                                  className="mt-1 text-surface-500 hover:text-surface-600 cursor-grab active:cursor-grabbing"
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
                                  <span className="text-xs text-surface-500">
                                    {lead.next_action_date
                                      ? new Date(
                                          lead.next_action_date
                                        ).toLocaleDateString()
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
  );
}
