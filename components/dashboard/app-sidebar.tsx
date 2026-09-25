"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboardIcon, PlusIcon } from "lucide-react";
import { fakeRepositories } from "@/lib/fake-repositories";
import { GitHubIcon } from "@/components/icons/github";
import { AddRepositoryDialog } from "@/components/dashboard/add-repository-dialog";
import { RepositoryMenuItem } from "@/components/dashboard/repository-menu-item";
import { NavUser } from "@/components/dashboard/nav-user";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "cn";

type AppSidebarProps = {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
};

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GitHubIcon className="size-4" />
          </div>
          <span className="text-base font-semibold">RepoAsk</span>
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              isActive={pathname === "/dashboard"}
              render={<Link href="/dashboard" />}
              className={cn(pathname === "/dashboard" && "border")}
            >
              <LayoutDashboardIcon />
              <span>Dashboard</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <AddRepositoryDialog
          renderTrigger={
            <Button className="w-full justify-start items-center gap-2" />
          }
        >
          <PlusIcon />
          Add repository
        </AddRepositoryDialog>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Repositories</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {fakeRepositories.map((repository) => (
                <RepositoryMenuItem
                  key={repository.id}
                  repository={repository}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
