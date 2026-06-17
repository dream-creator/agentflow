"use client";

import { useState, useCallback } from "react";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import {
  LayoutDashboard,
  GitBranch,
  Users,
  CalendarClock,
  Settings,
  Search,
  Bell,
} from "lucide-react";

type Lead = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  pipeline_stage: string;
  source: string;
  next_action: string | null;
  next_action_date: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
};

const MOCK_LEADS: Lead[] = [
  {
    id: "1",
    full_name: "Sarah Chen",
    email: "sarah@example.com",
    phone: "+1 (555) 123-4567",
    pipeline_stage: "new_lead",
    source: "Zillow",
    next_action: "Initial call",
    next_action_date: new Date().toISOString(),
    notes: "Interested in downtown condos",
    is_active: true,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    user_id: "demo",
  },
  {
    id: "2",
    full_name: "Marcus Johnson",
    email: "marcus@example.com",
    phone: "+1 (555) 234-5678",
    pipeline_stage: "contacted",
    source: "Referral",
    next_action: "Send listings",
    next_action_date: new Date().toISOString(),
    notes: "Looking for 3BR in suburbs",
    is_active: true,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    user_id: "demo",
  },
  {
    id: "3",
    full_name: "Emily Rodriguez",
    email: "emily@example.com",
    phone: "+1 (555) 345-6789",
    pipeline_stage: "contacted",
    source: "Realtor.com",
    next_action: "Schedule viewing",
    next_action_date: new Date(Date.now() - 1 * 86400000).toISOString(),
    notes: "Pre-approved for $450K",
    is_active: true,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    user_id: "demo",
  },
  {
    id: "4",
    full_name: "David Kim",
    email: "david@example.com",
    phone: "+1 (555) 456-7890",
    pipeline_stage: "showing",
    source: "Website",
    next_action: "Second showing",
    next_action_date: new Date(Date.now() + 1 * 86400000).toISOString(),
    notes: "Loved 123 Oak St, wants to negotiate",
    is_active: true,
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    user_id: "demo",
  },
  {
    id: "5",
    full_name: "Rachel Park",
    email: "rachel@example.com",
    phone: "+1 (555) 567-8901",
    pipeline_stage: "offer",
    source: "Zillow",
    next_action: "Follow up on counter",
    next_action_date: new Date().toISOString(),
    notes: "Offer submitted at $380K, awaiting response",
    is_active: true,
    created_at: new Date(Date.now() - 21 * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    user_id: "demo",
  },
  {
    id: "6",
    full_name: "James Wilson",
    email: "james@example.com",
    phone: "+1 (555) 678-9012",
    pipeline_stage: "new_lead",
    source: "Google Calendar",
    next_action: "Initial consultation",
    next_action_date: new Date(Date.now() + 2 * 86400000).toISOString(),
    notes: "First-time homebuyer",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: "demo",
  },
  {
    id: "7",
    full_name: "Lisa Thompson",
    email: "lisa@example.com",
    phone: "+1 (555) 789-0123",
    pipeline_stage: "closed_won",
    source: "Referral",
    next_action: null,
    next_action_date: null,
    notes: "Closed on 456 Pine Ave",
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    user_id: "demo",
  },
];

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", active: false },
  { icon: GitBranch, label: "Pipeline", active: true },
  { icon: Users, label: "Leads", active: false },
  { icon: CalendarClock, label: "Follow-ups", active: false },
  { icon: Settings, label: "Settings", active: false },
];

export default function DemoPage() {
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [updating, setUpdating] = useState<string | null>(null);

  const handleStageChange = useCallback((leadId: string, newStage: string) => {
    setUpdating(leadId);
    setTimeout(() => {
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId ? { ...l, pipeline_stage: newStage } : l
        )
      );
      setUpdating(null);
    }, 400);
  }, []);

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4 sm:p-8">
      {/* macOS window */}
      <div className="w-full max-w-[1200px] h-[680px] rounded-xl overflow-hidden shadow-2xl border border-surface-200 flex flex-col bg-white">
        {/* Title bar */}
        <div className="h-12 bg-surface-50 flex items-center px-4 gap-3 shrink-0 border-b border-surface-200">
          {/* Traffic lights */}
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
            <div className="w-3 h-3 rounded-full bg-[#28c840]" />
          </div>
          {/* Title */}
          <div className="flex-1 text-center">
            <span className="text-[13px] text-surface-400 font-medium">
              AgentFlow
            </span>
          </div>
          {/* Spacer for symmetry */}
          <div className="w-[52px]" />
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <div className="w-[220px] bg-surface-50 border-r border-surface-200 flex flex-col shrink-0">
            {/* Search */}
            <div className="px-3 pt-4 pb-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface-100 text-surface-400 text-[13px]">
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </div>
            </div>

            {/* Nav items */}
            <nav className="flex-1 px-2 py-2">
              {NAV_ITEMS.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-[13px] mb-0.5 ${
                    item.active
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-surface-500 hover:bg-surface-100"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
              ))}
            </nav>

            {/* Bottom user */}
            <div className="px-3 py-3 border-t border-surface-200">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-[11px] font-semibold">
                  A
                </div>
                <span className="text-[13px] text-surface-600 truncate">
                  Agent User
                </span>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col bg-white min-w-0">
            {/* Top bar */}
            <div className="h-12 flex items-center justify-between px-5 border-b border-surface-200 shrink-0">
              <h1 className="text-[15px] font-semibold text-surface-900">
                Pipeline
              </h1>
              <div className="flex items-center gap-3">
                <Bell className="w-4 h-4 text-surface-400" />
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-[11px] font-semibold">
                  A
                </div>
              </div>
            </div>

            {/* Pipeline board */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 min-h-0">
              <PipelineBoard
                leads={leads as never[]}
                updating={updating}
                onStageChange={handleStageChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
