"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

// The theme's --destructive token is calibrated for light mode only (it's
// nearly as dark as the page background in dark mode), so the destructive
// button variant is illegible there. Override with the plain Tailwind red
// palette, which is unaffected by the theme token.
const DESTRUCTIVE_DARK_MODE_FIX =
  "dark:!bg-red-950/40 dark:!text-red-400 dark:hover:!bg-red-950/60 dark:focus-visible:!border-red-400/40 dark:focus-visible:!ring-red-400/20";

export function DangerZone() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setPassword("");
    }
  }

  async function handleDelete() {
    if (!password) {
      toast.error("Enter your password to confirm.");
      return;
    }

    setIsDeleting(true);
    const { error } = await authClient.deleteUser({ password });
    setIsDeleting(false);

    if (error) {
      toast.error(error.message ?? "Failed to delete account.");
      return;
    }

    setOpen(false);
    toast.success("Your account has been deleted.");
    router.push("/signin");
    router.refresh();
  }

  return (
    <Card className="border-red-600/30 dark:border-red-400/30">
      <CardHeader>
        <CardTitle className="text-red-600 dark:text-red-400">
          Danger zone
        </CardTitle>
        <CardDescription>
          Permanently delete your account, repositories and API key. This
          can&apos;t be undone.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger
            render={
              <Button
                variant="destructive"
                className={DESTRUCTIVE_DARK_MODE_FIX}
              />
            }
          >
            Delete account
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete your account?</DialogTitle>
              <DialogDescription>
                This permanently deletes your account, profile, repositories,
                and API key. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <Field>
              <FieldLabel htmlFor="delete-account-password">
                Password
              </FieldLabel>
              <Input
                id="delete-account-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="Confirm your password"
              />
            </Field>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                Cancel
              </DialogClose>
              <Button
                type="button"
                variant="destructive"
                className={DESTRUCTIVE_DARK_MODE_FIX}
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting && <Spinner />}
                Delete account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
