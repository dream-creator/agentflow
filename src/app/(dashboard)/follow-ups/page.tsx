"use client";

import { useEffect, useState } from "react";
import { fetchLeads, updateLead } from "@/hooks/useLeads";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, Mail, MessageSquare, CheckCircle2 } from "lucide-react";
import { formatStage, getStageVariant } from "@/lib/utils";
import type { Database } from "@/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];

export default function FollowUpsPage() {
  const [overdue, setOverdue] = useState<Lead[]>([]);
  const [today, setToday] = useState<Lead[]>([]);
  const [upcoming, setUpcoming] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFollowUps() {
      const { data, error } = await fetchLeads();
      if (data) {
        const now = new Date();
        const todayStr = now.toISOString().split("T")[0];
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextWeekStr = nextWeek.toISOString().split("T")[0];

        const withDates = data.filter(l => l.next_action_date);
        setOverdue(withDates.filter(l => l.next_action_date! < todayStr).sort((a, b) => (a.next_action_date || "").localeCompare(b.next_action_date || "")));
        setToday(withDates.filter(l => l.next_action_date === todayStr));
        setUpcoming(withDates.filter(l => l.next_action_date! > todayStr && l.next_action_date! <= nextWeekStr).sort((a, b) => (a.next_action_date || "").localeCompare(b.next_action_date || "")));
      }
      setLoading(false);
    }

    loadFollowUps();
  }, []);

  async function markComplete(leadId: string) {
    await updateLead(leadId, {
      next_action: null,
      next_action_date: null,
    });

    setOverdue((prev) => prev.filter((l) => l.id !== leadId));
    setToday((prev) => prev.filter((l) => l.id !== leadId));
    setUpcoming((prev) => prev.filter((l) => l.id !== leadId));
  }

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const totalFollowUps = overdue.length + today.length + upcoming.length;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold text-surface-900">Follow-ups</h1>
        <p className="text-surface-500 text-sm mt-1">
          {totalFollowUps} leads need attention
        </p>
      </div>

      {totalFollowUps === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-6 w-6 text-emerald-500" />}
          title="All caught up!"
          description="No follow-ups due. Add leads with next actions to see them here."
        />
      ) : (
        <div className="space-y-6">
          {/* Overdue */}
          {overdue.length > 0 && (
            <Section title="Overdue" count={overdue.length} variant="destructive">
              {overdue.map((lead) => (
                <FollowUpCard
                  key={lead.id}
                  lead={lead}
                  onComplete={() => markComplete(lead.id)}
                />
              ))}
            </Section>
          )}

          {/* Today */}
          {today.length > 0 && (
            <Section title="Today" count={today.length} variant="primary">
              {today.map((lead) => (
                <FollowUpCard
                  key={lead.id}
                  lead={lead}
                  onComplete={() => markComplete(lead.id)}
                />
              ))}
            </Section>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <Section title="Upcoming" count={upcoming.length} variant="default">
              {upcoming.map((lead) => (
                <FollowUpCard
                  key={lead.id}
                  lead={lead}
                  onComplete={() => markComplete(lead.id)}
                />
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  count,
  variant,
  children,
}: {
  title: string;
  count: number;
  variant: "destructive" | "primary" | "default";
  children: React.ReactNode;
}) {
  const colors = {
    destructive: "text-destructive",
    primary: "text-primary",
    default: "text-surface-500",
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h2 className={`font-heading text-sm font-semibold uppercase tracking-wide ${colors[variant]}`}>
          {title}
        </h2>
        <Badge variant={variant === "destructive" ? "destructive" : variant === "primary" ? "primary" : "default"}>
          {count}
        </Badge>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function FollowUpCard({
  lead,
  onComplete,
}: {
  lead: Lead;
  onComplete: () => void;
}) {
  return (
    <Card className="hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-surface-900 truncate">{lead.full_name}</h3>
            <Badge variant={getStageVariant(lead.pipeline_stage)}>
              {formatStage(lead.pipeline_stage)}
            </Badge>
          </div>
          {lead.next_action && (
            <p className="text-sm text-surface-500 mb-2">{lead.next_action}</p>
          )}
          <div className="flex items-center gap-3 text-xs text-surface-400">
            <span>Due: {lead.next_action_date ? new Date(lead.next_action_date).toLocaleDateString() : "No date"}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={onComplete}
            className="p-2 rounded-lg hover:bg-emerald-50 text-surface-400 hover:text-emerald-600 transition-colors min-w-touch min-h-touch flex items-center justify-center"
            title="Mark complete"
          >
            <CheckCircle2 className="h-4 w-4" />
          </button>
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
  );
}
