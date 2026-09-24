import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/auth-session";
import { SignOutButton } from "@/components/signout-button";

export default async function Page() {
  const session = await getServerSession();

  if (!session) {
    redirect("/signin");
  }

  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">Welcome, {session.user.name}.</h1>
          <p>You&apos;re signed in as {session.user.email}.</p>
        </div>
        <SignOutButton />
      </div>
    </div>
  );
}
