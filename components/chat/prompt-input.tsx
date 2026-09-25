"use client";

import { useCallback, type KeyboardEvent } from "react";
import type { ChatStatus } from "ai";
import { ArrowUpIcon } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "cn";

export type PromptInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  status: ChatStatus;
  placeholder?: string;
  className?: string;
};

export function PromptInput({
  value,
  onChange,
  onSubmit,
  status,
  placeholder = "Ask about this repository...",
  className,
}: PromptInputProps) {
  const isBusy = status === "streaming" || status === "submitted";
  const canSubmit = value.trim().length > 0 && !isBusy;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        if (canSubmit) {
          onSubmit();
        }
      }
    },
    [canSubmit, onSubmit],
  );

  return (
    <InputGroup className={cn("rounded-lg bg-background px-1", className)}>
      <InputGroupTextarea
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isBusy}
        rows={1}
        className="min-h-8 max-h-48 resize-none self-center py-1.5 leading-normal"
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-sm"
          variant="default"
          className="rounded-full"
          onClick={onSubmit}
          disabled={!canSubmit}
        >
          {isBusy ? <Spinner /> : <ArrowUpIcon />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
