"use client";

import { BottomNav } from "./bottom-nav";
import { Sidebar } from "./sidebar";
import { ToastContainer } from "@/components/ui/toast";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-dvh bg-primary-50">
      <Sidebar />
      <div className="md:pl-64">
        <main className="pb-20 md:pb-0">
          {children}
        </main>
      </div>
      <BottomNav />
      <ToastContainer />
    </div>
  );
}
