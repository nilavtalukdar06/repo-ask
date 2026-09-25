"use client";

import { Fragment, useEffect, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { AlertTriangleIcon, CopyIcon, RefreshCcwIcon } from "lucide-react";
import { toast } from "sonner";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { useChatHeaderContext } from "@/components/chat/chat-header-context";
import { PromptInput } from "@/components/chat/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Suggestion } from "@/components/ai-elements/suggestion";
import { Button } from "@/components/ui/button";
import { GLASS_CLASSNAME } from "../dashboard/glass";
import { cn } from "cn";

const SUGGESTED_PROMPTS = [
  "What does this repository do?",
  "Where is the main entry point?",
  "How is the project structured?",
];

type ChatRepository = {
  id: string;
  owner: string;
  name: string;
  description: string | null;
};

export function ChatView({
  repository,
  initialMessages,
}: {
  repository: ChatRepository;
  initialMessages: UIMessage[];
}) {
  const [input, setInput] = useState("");
  const { registerClearHandler } = useChatHeaderContext();

  const {
    messages,
    sendMessage,
    status,
    error,
    regenerate,
    clearError,
    setMessages,
  } = useChat({
    id: repository.id,
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest({ messages, id }) {
        return { body: { message: messages[messages.length - 1], id } };
      },
    }),
  });

  const handleSubmit = () => {
    if (!input.trim()) return;
    sendMessage({ text: input });
    setInput("");
  };

  const handleRetry = () => {
    clearError();
    regenerate();
  };

  useEffect(() => {
    return registerClearHandler(async () => {
      const response = await fetch(`/api/chat/clear/${repository.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        toast.error("Failed to clear chat.");
        return;
      }
      clearError();
      setMessages([]);
    });
  }, [registerClearHandler, repository.id, clearError, setMessages]);

  const isThinking = status === "submitted";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Conversation>
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState>
              <p className="text-muted-foreground font-medium text-base">
                Try asking
              </p>
              <div className="flex w-full max-w-md flex-col gap-3">
                {SUGGESTED_PROMPTS.map((suggestion) => (
                  <Suggestion
                    key={suggestion}
                    suggestion={suggestion}
                    onClick={(text) => sendMessage({ text })}
                    variant="outline"
                    className={cn(
                      GLASS_CLASSNAME,
                      "rounded-lg py-4 px-3 flex justify-start",
                    )}
                  />
                ))}
              </div>
            </ConversationEmptyState>
          ) : (
            messages
              .filter(
                (message) =>
                  message.role !== "assistant" ||
                  message.parts.some(
                    (part) => part.type === "text" && part.text.trim(),
                  ),
              )
              .map((message, index, filteredMessages) => {
                const isLastMessage = index === filteredMessages.length - 1;
                const canAct =
                  message.role === "assistant" &&
                  isLastMessage &&
                  status === "ready";

                return (
                  <Fragment key={message.id}>
                    <Message from={message.role}>
                      <MessageContent>
                        {message.parts.map((part, i) => {
                          if (part.type === "text") {
                            return (
                              <MessageResponse key={`${message.id}-${i}`}>
                                {part.text}
                              </MessageResponse>
                            );
                          }
                          return null;
                        })}
                      </MessageContent>
                    </Message>
                    {canAct && (
                      <MessageActions>
                        <MessageAction
                          label="Retry"
                          onClick={() => regenerate()}
                        >
                          <RefreshCcwIcon className="size-3" />
                        </MessageAction>
                        <MessageAction
                          label="Copy"
                          onClick={() => {
                            const text = message.parts
                              .filter((part) => part.type === "text")
                              .map((part) => part.text)
                              .join("");
                            navigator.clipboard.writeText(text);
                          }}
                        >
                          <CopyIcon className="size-3" />
                        </MessageAction>
                      </MessageActions>
                    )}
                  </Fragment>
                );
              })
          )}
          {isThinking && (
            <Message from="assistant">
              <MessageContent>
                <Shimmer>Thinking...</Shimmer>
              </MessageContent>
            </Message>
          )}
          {error && (
            <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <span className="flex items-center gap-2">
                <AlertTriangleIcon className="size-4 shrink-0" />
                {error.message || "Something went wrong. Please try again."}
              </span>
              <Button size="sm" variant="outline" onClick={handleRetry}>
                Retry
              </Button>
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="shrink-0 p-4">
        <PromptInput
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          status={status}
        />
      </div>
    </div>
  );
}
