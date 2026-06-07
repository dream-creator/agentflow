"use client";

import { useEffect, useState } from "react";
import { fetchLeads } from "@/hooks/useLeads";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { UserPlus, Phone, Mail, MessageSquare, Search, Upload } from "lucide-react";
import Link from "next/link";
import { formatStage, getStageVariant } from "@/lib/utils";
import { isFeatureEnabled } from "@/lib/feature-flags";
import type { Database } from "@/types";

type Lead = Database["public"]["Tables"]["leads"]["Row"];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function loadLeads() {
      const { data, error } = await fetchLeads();
      if (data) {
        const filtered = filter === "all" ? data : data.filter(l => l.pipeline_stage === filter);
        setLeads(filtered);
      }
      setLoading(false);
    }

    loadLeads();
  }, [filter]);

  const filteredLeads = leads.filter(
    (lead) =>
      lead.full_name.toLowerCase().includes(search.toLowerCase()) ||
      lead.email?.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone?.includes(search)
  );

  if (loading) {
    return (
      <div className="p-4 md:p-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-surface-900">Leads</h1>
          <p className="text-surface-500 text-sm mt-1">{leads.length} total leads</p>
        </div>
        <div className="flex gap-2">
          {isFeatureEnabled("csv_import") && (
            <Link href="/leads/import">
              <Button variant="secondary" size="sm">
                <Upload className="h-4 w-4 mr-1" />
                Import
              </Button>
            </Link>
          )}
          <Link href="/leads/new">
            <Button size="sm">
              <UserPlus className="h-4 w-4 mr-1" />
              Add Lead
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-surface-500" />
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input-field w-full sm:w-40"
        >
          <option value="all">All Stages</option>
          <option value="new_lead">New Lead</option>
          <option value="contacted">Contacted</option>
          <option value="showing">Showing</option>
          <option value="offer">Offer</option>
          <option value="closed_won">Closed Won</option>
          <option value="closed_lost">Closed Lost</option>
        </select>
      </div>

      {filteredLeads.length === 0 ? (
        <EmptyState
          icon={<UserPlus className="h-6 w-6 text-surface-500" />}
          title={search ? "No leads found" : "No leads yet"}
          description={
            search
              ? "Try a different search term."
              : "Add your first lead to start tracking your pipeline."
          }
          action={
            !search ? (
              <Link href="/leads/new">
                <Button>Add your first lead</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredLeads.map((lead) => (
            <Card key={lead.id} className="hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="font-medium text-surface-900 hover:text-primary truncate"
                    >
                      {lead.full_name}
                    </Link>
                    <Badge variant={getStageVariant(lead.pipeline_stage)}>
                      {formatStage(lead.pipeline_stage)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-surface-500">
                    {lead.email && <span className="truncate">{lead.email}</span>}
                    {lead.phone && <span>{lead.phone}</span>}
                    <span>Source: {lead.source.replace("_", " ")}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  {lead.phone && (
                    <a
                      href={`tel:${lead.phone}`}
                      aria-label="Call"
                      className="p-2 rounded-lg hover:bg-surface-100 text-surface-500 hover:text-primary transition-colors min-w-touch min-h-touch flex items-center justify-center"
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  )}
                  {lead.email && (
                    <a
                      href={`mailto:${lead.email}`}
                      aria-label="Send email"
                      className="p-2 rounded-lg hover:bg-surface-100 text-surface-500 hover:text-primary transition-colors min-w-touch min-h-touch flex items-center justify-center"
                    >
                      <Mail className="h-4 w-4" />
                    </a>
                  )}
                  {lead.phone && (
                    <a
                      href={`sms:${lead.phone}`}
                      aria-label="Send text message"
                      className="p-2 rounded-lg hover:bg-surface-100 text-surface-500 hover:text-primary transition-colors min-w-touch min-h-touch flex items-center justify-center"
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
