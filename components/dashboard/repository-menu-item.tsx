"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import type { RepositoryRecord } from "@/lib/queries/repository";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { GLASS_CLASSNAME } from "@/components/dashboard/glass";
import { RepositoryStatusLive } from "@/components/dashboard/repository-status-live";

export function RepositoryMenuItem({
  repository,
}: {
  repository: RepositoryRecord;
}) {
  const pathname = usePathname();

  const href = `/chat/${repository.id}`;
  const isActive = pathname === href;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        className={cn(
          "h-auto py-2 border",
          isActive && GLASS_CLASSNAME,
          isActive ? "border/60!" : "border-transparent",
        )}
        render={<Link href={href} />}
      >
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="truncate font-medium">
            {repository.owner}/{repository.name}
          </span>
          <RepositoryStatusLive repository={repository} />
        </span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
