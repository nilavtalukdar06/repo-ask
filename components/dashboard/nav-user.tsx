"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ChevronsUpDownIcon,
  LogOutIcon,
  MonitorIcon,
  MoonIcon,
  SunIcon,
  SunMoonIcon,
  UserIcon,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { SIDEBAR_GLASS_CLASSNAME } from "@/components/dashboard/glass";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

type NavUserProps = {
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
};

function getInitials(name: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "?";
}

function UserSummary({ user }: NavUserProps) {
  return (
    <>
      <Avatar className="size-8">
        {user.image ? <AvatarImage src={user.image} alt={user.name} /> : null}
        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
      </Avatar>
      <span className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{user.name}</span>
        <span className="truncate text-xs text-muted-foreground">
          {user.email}
        </span>
      </span>
    </>
  );
}

export function NavUser({ user }: NavUserProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/signin");
    router.refresh();
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="relative hover:bg-transparent! hover:text-sidebar-foreground! active:bg-transparent! active:text-sidebar-foreground! data-open:bg-transparent! data-open:text-sidebar-foreground! data-open:hover:bg-transparent! data-open:hover:text-sidebar-foreground!"
              />
            }
          >
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-0 rounded-md",
                SIDEBAR_GLASS_CLASSNAME,
              )}
            />
            <span className="relative z-10 flex w-full items-center gap-2">
              <UserSummary user={user} />
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="end"
            sideOffset={4}
            className="w-64 min-w-56"
          >
            <div className="flex items-center gap-2 px-1.5 py-1.5">
              <UserSummary user={user} />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/profile" />}>
              <UserIcon />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <SunMoonIcon />
                Theme
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                  <DropdownMenuRadioItem value="light">
                    <SunIcon />
                    Light
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark">
                    <MoonIcon />
                    Dark
                  </DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="system">
                    <MonitorIcon />
                    System
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:focus:bg-red-950/40 dark:focus:text-red-300 [&_svg]:text-red-600 dark:[&_svg]:text-red-400"
            >
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
