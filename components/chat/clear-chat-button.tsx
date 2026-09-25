"use client";

import { useState } from "react";
import { Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Spinner } from "@/components/ui/spinner";
import { useChatHeaderContext } from "@/components/chat/chat-header-context";

// The theme's --destructive token is calibrated for light mode only (it's
// nearly as dark as the page background in dark mode), so the destructive
// button variant is illegible there. Override with the plain Tailwind red
// palette, which is unaffected by the theme token.
const DESTRUCTIVE_DARK_MODE_FIX =
  "dark:!bg-red-950/40 dark:!text-red-400 dark:hover:!bg-red-950/60 dark:focus-visible:!border-red-400/40 dark:focus-visible:!ring-red-400/20";

export function ClearChatButton() {
  const { isChatActive, clearChat } = useChatHeaderContext();
  const [open, setOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  if (!isChatActive) {
    return null;
  }

  const handleConfirm = async () => {
    setIsClearing(true);
    try {
      await clearChat();
      setOpen(false);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="ghost" size="sm" className="ml-auto" />}
      >
        <Trash2Icon />
        Clear chat
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Clear this chat?</DialogTitle>
          <DialogDescription>
            This permanently deletes every message in this conversation. This
            can&apos;t be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            className={DESTRUCTIVE_DARK_MODE_FIX}
            onClick={handleConfirm}
            disabled={isClearing}
          >
            {isClearing && <Spinner />}
            Clear chat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
