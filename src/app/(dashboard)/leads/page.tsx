import { getLeadsForServer } from "@/hooks/useLeadsServer";
import { redirect } from "next/navigation";
import { LeadsClient } from "./leads-client";

export default async function LeadsPage() {
  const { data: leads, error } = await getLeadsForServer();

  if (error === "Not authenticated") {
    redirect("/login");
  }

  return <LeadsClient initialLeads={leads ?? []} />;
}
