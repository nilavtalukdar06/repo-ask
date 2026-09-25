"use client";

import { useState } from "react";
import { Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useChatHeaderContext } from "@/components/chat/chat-header-context";

export function ClearChatButton() {
  const { isChatActive, clearChat } = useChatHeaderContext();
  const [isClearing, setIsClearing] = useState(false);

  if (!isChatActive) {
    return null;
  }

  const handleClick = async () => {
    if (!window.confirm("Clear this chat? This can't be undone.")) {
      return;
    }
    setIsClearing(true);
    try {
      await clearChat();
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="ml-auto"
      onClick={handleClick}
      disabled={isClearing}
    >
      {isClearing ? <Spinner /> : <Trash2Icon />}
      Clear chat
    </Button>
  );
}
