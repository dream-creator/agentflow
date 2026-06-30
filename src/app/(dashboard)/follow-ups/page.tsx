import { getLeadsForServer } from "@/hooks/useLeadsServer";
import { redirect } from "next/navigation";
import { FollowUpsClient } from "./follow-ups-client";

export default async function FollowUpsPage() {
  const { data: leads, error } = await getLeadsForServer();

  if (error === "Not authenticated") {
    redirect("/login");
  }

  return <FollowUpsClient initialLeads={leads ?? []} />;
}
