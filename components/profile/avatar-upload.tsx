"use client";

import * as React from "react";
import { upload } from "@imagekit/next";
import { CameraIcon } from "lucide-react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

function getInitials(name: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "?";
}

export function AvatarUpload() {
  const { data: session, isPending } = authClient.useSession();
  const [isUploading, setIsUploading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const user = session?.user;

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !user) {
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Please upload a JPG or PNG image.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Image must be 2MB or smaller.");
      return;
    }

    setIsUploading(true);

    try {
      const authResponse = await fetch("/api/upload-auth");
      const authParams = await authResponse.json();

      if (!authResponse.ok) {
        throw new Error(
          authParams.error ?? "Failed to get upload credentials.",
        );
      }

      const extension = file.name.split(".").pop() ?? "jpg";

      const result = await upload({
        file,
        fileName: `avatar-${user.id}.${extension}`,
        publicKey: authParams.publicKey,
        signature: authParams.signature,
        expire: authParams.expire,
        token: authParams.token,
        folder: "/repoask/avatars",
        useUniqueFileName: false,
      });

      if (!result.url) {
        throw new Error("Upload did not return an image URL.");
      }

      const { error } = await authClient.updateUser({ image: result.url });

      if (error) {
        throw new Error(error.message ?? "Failed to update profile photo.");
      }

      toast.success("Profile photo updated.");
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0">
        <Avatar className="size-16!">
          {isPending ? null : user?.image ? (
            <AvatarImage src={user.image} alt={user.name} />
          ) : null}
          <AvatarFallback className="text-lg">
            {user ? getInitials(user.name) : null}
          </AvatarFallback>
        </Avatar>

        {isUploading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
            <Spinner className="size-5 text-white" />
          </div>
        )}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading || !user}
          className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full border bg-background text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          aria-label="Change profile photo"
        >
          <CameraIcon className="size-3.5" />
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      <div>
        <p className="text-sm font-medium">Profile photo</p>
        <p className="text-xs text-muted-foreground">JPG or PNG, up to 2MB.</p>
      </div>
    </div>
  );
}
