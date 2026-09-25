import type { Metadata } from "next";

import { getServerSession } from "@/lib/auth-session";
import { RepositoryDashboard } from "@/components/dashboard/repository-dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await getServerSession();

  return <RepositoryDashboard userName={session?.user.name} />;
}
