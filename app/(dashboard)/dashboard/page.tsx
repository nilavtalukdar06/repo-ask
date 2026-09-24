import type { Metadata } from "next";
import { GitForkIcon, PlusIcon } from "lucide-react";

import { getServerSession } from "@/lib/auth-session";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await getServerSession();

  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <GitForkIcon />
          </EmptyMedia>
          <EmptyTitle>No repositories yet</EmptyTitle>
          <EmptyDescription>
            {session ? `Welcome, ${session.user.name}. ` : null}
            Add a GitHub repository to start asking questions about its code.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="sm" className="gap-2">
            <PlusIcon />
            Add repository
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  );
}
