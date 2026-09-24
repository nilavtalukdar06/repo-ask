"use client";

import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProfileForm } from "@/components/profile/profile-form";
import { ApiKeySection } from "@/components/profile/api-key-section";
import { DangerZone } from "@/components/profile/danger-zone";

export function ProfileScreen() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon-sm"
          nativeButton={false}
          render={<Link href="/dashboard" aria-label="Back to dashboard" />}
        >
          <ArrowLeftIcon />
        </Button>
        <h1 className="text-lg font-semibold">Profile & settings</h1>
      </div>

      <ProfileForm />
      <ApiKeySection />
      <DangerZone />
    </div>
  );
}
