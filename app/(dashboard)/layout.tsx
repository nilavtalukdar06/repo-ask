import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth-session";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();

  if (!session) {
    redirect("/signin");
  }

  return (
    <SidebarProvider className="h-svh">
      <AppSidebar user={session.user} />
      <SidebarInset className="min-h-0 border shadow-none">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
          <SidebarTrigger />
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
