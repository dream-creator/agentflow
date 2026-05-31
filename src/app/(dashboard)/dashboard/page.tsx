"use client";

import { useEffect, useState } from "react";
import { fetchLeads } from "@/hooks/useLeads";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MessageSquare, UserPlus } from "lucide-react";
import Link from "next/link";
import { formatStage, getStageVariant } from "@/lib/utils";
import type { Database } from "@/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFollowUps() {
      const { data, error } = await fetchLeads();
      if (data) {
        const today = new Date().toISOString().split("T")[0];
        const filtered = data
          .filter(l => l.next_action_date && l.next_action_date <= today)
          .sort((a, b) => (a.next_action_date || "").localeCompare(b.next_action_date || ""))
          .slice(0, 10);
        setLeads(filtered);
      }
      setLoading(false);
    }

    loadFollowUps();
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-surface-900">
          Today&apos;s Follow-ups
        </h1>
        <p className="text-surface-500 text-sm mt-1">
          Leads that need your attention
        </p>
      </div>

      {leads.length === 0 ? (
        <EmptyState
          icon={<UserPlus className="h-6 w-6 text-surface-400" />}
          title="No follow-ups today"
          description="Add your first lead to start tracking follow-ups. You'll see them here when they're due."
          action={
            <Link href="/leads/new">
              <Button>Add your first lead</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <Card key={lead.id} className="hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-surface-900 truncate">
                      {lead.full_name}
                    </h3>
                    <Badge variant={getStageVariant(lead.pipeline_stage)}>
                      {formatStage(lead.pipeline_stage)}
                    </Badge>
                  </div>
                  {lead.next_action && (
                    <p className="text-sm text-surface-500 mb-2">
                      {lead.next_action}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-surface-400">
                    <span>Due: {formatDate(lead.next_action_date)}</span>
                    {lead.phone && <span>{lead.phone}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  {lead.phone && (
                    <a
                      href={`tel:${lead.phone}`}
                      className="p-2 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-primary transition-colors min-w-touch min-h-touch flex items-center justify-center"
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  )}
                  {lead.email && (
                    <a
                      href={`mailto:${lead.email}`}
                      className="p-2 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-primary transition-colors min-w-touch min-h-touch flex items-center justify-center"
                    >
                      <Mail className="h-4 w-4" />
                    </a>
                  )}
                  {lead.phone && (
                    <a
                      href={`sms:${lead.phone}`}
                      className="p-2 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-primary transition-colors min-w-touch min-h-touch flex items-center justify-center"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(date: string | null): string {
  if (!date) return "No date set";
  const d = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays === -1) return "Yesterday";
  if (diffDays < -1) return `${Math.abs(diffDays)} days ago`;
  if (diffDays > 0) return `In ${diffDays} days`;

  return d.toLocaleDateString();
}
