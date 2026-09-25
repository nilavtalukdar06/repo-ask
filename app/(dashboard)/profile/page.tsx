import type { Metadata } from "next";

import { ProfileScreen } from "@/components/profile/profile-screen";

export const metadata: Metadata = {
  title: "Profile",
};

export default function ProfilePage() {
  return (
    <div className="min-h-0 h-full overflow-auto">
      <ProfileScreen />
    </div>
  );
}
