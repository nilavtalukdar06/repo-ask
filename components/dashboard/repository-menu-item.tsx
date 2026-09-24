"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format-relative-time";
import type { Repository } from "@/lib/fake-repositories";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { SIDEBAR_GLASS_CLASSNAME } from "@/components/dashboard/glass";

export function RepositoryMenuItem({ repository }: { repository: Repository }) {
  const pathname = usePathname();

  const href = `/chat/${repository.id}`;
  const isActive = pathname === href;
  const isIndexing = repository.status === "indexing";

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        className={cn(
          "h-auto py-2 border",
          isActive && SIDEBAR_GLASS_CLASSNAME,
          isActive ? "border/60!" : "border-transparent",
        )}
        render={<Link href={href} />}
      >
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="truncate font-medium">{repository.name}</span>
          {isIndexing ? (
            <span className="flex flex-col gap-1 animate-pulse">
              <span className="text-xs text-amber-600 dark:text-amber-500 flex justify-start gap-2 items-center">
                Indexing...
              </span>
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              <span className="text-emerald-600 dark:text-emerald-500">
                Indexed
              </span>{" "}
              · {formatRelativeTime(repository.indexedAt)}
            </span>
          )}
        </span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
