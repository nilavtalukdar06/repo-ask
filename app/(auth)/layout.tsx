import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth-session";
import { GitHubIcon } from "@/components/icons/github";

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <GitHubIcon className="size-4.5" />
        </div>
        <span className="text-lg font-semibold">RepoAsk</span>
      </div>
      {children}
    </div>
  );
}
