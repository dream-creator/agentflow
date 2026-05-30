"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, UserPlus, Phone, Settings } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Today", icon: LayoutDashboard },
  { href: "/pipeline", label: "Pipeline", icon: Users },
  { href: "/leads/new", label: "Add Lead", icon: UserPlus },
  { href: "/follow-ups", label: "Follow-ups", icon: Phone },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [userName, setUserName] = useState("User");
  const [userPlan, setUserPlan] = useState("Free Plan");
  const supabase = createClient();

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, plan")
          .eq("id", user.id)
          .single();
        if (profile) {
          setUserName(profile.full_name || "User");
          setUserPlan(profile.plan === "pro" ? "Pro Plan" : "Free Plan");
        }
      }
    }
    fetchProfile();
  }, [supabase]);

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-surface border-r border-surface-200">
      <div className="flex items-center h-16 px-6 border-b border-surface-200">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white font-bold text-sm">AF</span>
          </div>
          <span className="font-heading text-lg font-bold text-surface-900">AgentFlow</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-touch",
                isActive
                  ? "bg-primary-50 text-primary"
                  : "text-surface-600 hover:bg-surface-50 hover:text-surface-900"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-surface-200">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-primary-700 font-medium text-sm">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-surface-900 truncate">{userName}</p>
            <p className="text-xs text-surface-400 truncate">{userPlan}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
