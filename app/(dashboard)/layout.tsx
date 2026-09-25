import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth-session";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { ChatHeaderProvider } from "@/components/chat/chat-header-context";
import { ClearChatButton } from "@/components/chat/clear-chat-button";
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
    <SidebarProvider>
      <AppSidebar user={session.user} />
      <SidebarInset className="border shadow-none">
        <ChatHeaderProvider>
          <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
            <SidebarTrigger />
            <ClearChatButton />
          </header>
          {children}
        </ChatHeaderProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
