import type { Metadata } from "next";

import { getServerSession } from "@/lib/auth-session";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const session = await getServerSession();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <h1 className="text-lg font-medium">Profile</h1>
        <p className="text-sm text-muted-foreground">
          {session?.user.name} · {session?.user.email}
        </p>
      </div>
    </div>
  );
}
