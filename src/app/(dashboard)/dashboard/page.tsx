"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchLeads } from "@/hooks/useLeads";
import { fetchProfile } from "@/hooks/useProfile";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Phone,
  Mail,
  MessageSquare,
  UserPlus,
  Users,
  AlertTriangle,
  Clock,
  TrendingUp,
  ArrowRight,
  Upload,
  CalendarCheck,
} from "lucide-react";
import Link from "next/link";
import { formatStage, getStageVariant } from "@/lib/utils";
import type { Database } from "@/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    async function loadData() {
      const [leadsResult, profileResult] = await Promise.all([
        fetchLeads(),
        fetchProfile(),
      ]);
      if (leadsResult.data) setLeads(leadsResult.data);
      if (profileResult.data?.full_name) {
        setUserName(profileResult.data.full_name.split(" ")[0]);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const totalLeads = leads.length;
    const overdueLeads = leads.filter(
      (l) => l.next_action_date && l.next_action_date < today
    );
    const todayLeads = leads.filter(
      (l) => l.next_action_date === today
    );
    const pipelineLeads = leads.filter(
      (l) => !["closed_won", "closed_lost"].includes(l.pipeline_stage)
    );

    return {
      total: totalLeads,
      overdue: overdueLeads.length,
      today: todayLeads.length,
      pipeline: pipelineLeads.length,
      overdueLeads: overdueLeads.slice(0, 5),
      todayLeads: todayLeads.slice(0, 5),
    };
  }, [leads]);

  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-surface-900">
          {getGreeting()}, {userName || "there"}
        </h1>
        <p className="text-surface-500 text-sm mt-1">{getFormattedDate()}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Users className="h-5 w-5" />}
          label="Total Leads"
          value={stats.total}
          color="primary"
        />
        <StatCard
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Overdue"
          value={stats.overdue}
          color="destructive"
          href="/follow-ups"
        />
        <StatCard
          icon={<Clock className="h-5 w-5" />}
          label="Today"
          value={stats.today}
          color="warning"
          href="/follow-ups"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="In Pipeline"
          value={stats.pipeline}
          color="accent"
          href="/pipeline"
        />
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/leads/new">
          <Button size="sm">
            <UserPlus className="h-4 w-4 mr-1.5" />
            Add Lead
          </Button>
        </Link>
        <Link href="/pipeline">
          <Button variant="secondary" size="sm">
            <TrendingUp className="h-4 w-4 mr-1.5" />
            View Pipeline
          </Button>
        </Link>
        <Link href="/leads/import">
          <Button variant="secondary" size="sm">
            <Upload className="h-4 w-4 mr-1.5" />
            Import CSV
          </Button>
        </Link>
      </div>

      {/* Today's Focus */}
      {stats.todayLeads.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CalendarCheck className="h-4 w-4 text-primary" />
            <h2 className="font-heading text-sm font-semibold text-surface-900">
              Today&apos;s Focus
            </h2>
            <Badge variant="primary">{stats.todayLeads.length}</Badge>
          </div>
          <div className="space-y-2">
            {stats.todayLeads.map((lead) => (
              <FollowUpRow key={lead.id} lead={lead} />
            ))}
          </div>
        </div>
      )}

      {/* Overdue Alert */}
      {stats.overdueLeads.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <h2 className="font-heading text-sm font-semibold text-surface-900">
              Overdue
            </h2>
            <Badge variant="destructive">{stats.overdue}</Badge>
          </div>
          <div className="space-y-2">
            {stats.overdueLeads.map((lead) => (
              <FollowUpRow key={lead.id} lead={lead} overdue />
            ))}
          </div>
          {stats.overdue > 5 && (
            <Link
              href="/follow-ups"
              className="text-xs text-primary hover:text-primary-700 font-medium flex items-center gap-1 mt-3"
            >
              View all {stats.overdue} overdue <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      )}

      {/* Empty State */}
      {stats.total === 0 && (
        <EmptyState
          icon={<UserPlus className="h-6 w-6 text-surface-500" />}
          title="Welcome to AgentFlow"
          description="Add your first lead to start tracking your pipeline and follow-ups."
          action={
            <Link href="/leads/new">
              <Button>Add your first lead</Button>
            </Link>
          }
        />
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: "primary" | "destructive" | "warning" | "accent";
  href?: string;
}) {
  const colorMap = {
    primary: "bg-primary-50 text-primary",
    destructive: "bg-destructive-50 text-destructive",
    warning: "bg-warning-50 text-warning-600",
    accent: "bg-accent-50 text-accent",
  };

  const content = (
    <Card className="p-4 hover:border-surface-300 transition-colors">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-lg ${colorMap[color]} flex items-center justify-center shrink-0`}
        >
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold text-surface-900">{value}</p>
          <p className="text-xs text-surface-500">{label}</p>
        </div>
      </div>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }
  return content;
}

function FollowUpRow({
  lead,
  overdue = false,
}: {
  lead: Lead;
  overdue?: boolean;
}) {
  return (
    <Card
      className={`p-3 ${
        overdue
          ? "border-destructive-200 bg-destructive-50/30"
          : "hover:border-primary-200"
      } transition-colors`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
              overdue ? "bg-destructive-100" : "bg-primary-100"
            }`}
          >
            <span
              className={`text-xs font-semibold ${
                overdue ? "text-destructive" : "text-primary"
              }`}
            >
              {lead.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Link
                href={`/leads/${lead.id}`}
                className="font-medium text-sm text-surface-900 hover:text-primary truncate"
              >
                {lead.full_name}
              </Link>
              <Badge variant={getStageVariant(lead.pipeline_stage)}>
                {formatStage(lead.pipeline_stage)}
              </Badge>
            </div>
            {lead.next_action && (
              <p className="text-xs text-surface-500 truncate">
                {lead.next_action}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 ml-2 shrink-0">
          {lead.phone && (
            <a
              href={`tel:${lead.phone}`}
              aria-label="Call"
              className="p-2 rounded-lg hover:bg-surface-100 text-surface-500 hover:text-primary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <Phone className="h-4 w-4" />
            </a>
          )}
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              aria-label="Send email"
              className="p-2 rounded-lg hover:bg-surface-100 text-surface-500 hover:text-primary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <Mail className="h-4 w-4" />
            </a>
          )}
          {lead.phone && (
            <a
              href={`sms:${lead.phone}`}
              aria-label="Send text message"
              className="p-2 rounded-lg hover:bg-surface-100 text-surface-500 hover:text-primary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <MessageSquare className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}
