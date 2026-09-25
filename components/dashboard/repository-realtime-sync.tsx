"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtime } from "inngest/react";

import { getRepositoryStatusToken } from "@/server/repository-realtime";
import { repositoryChannel } from "@/lib/inngest-channels";
import { repositoriesQueryKey } from "@/lib/queries/repository";

export function RepositoryRealtimeSync({
  repositoryId,
  onProgress,
}: {
  repositoryId: string;
  onProgress?: (progress: number | undefined) => void;
}) {
  const queryClient = useQueryClient();

  const { messages } = useRealtime({
    channel: repositoryChannel(repositoryId),
    topics: ["status"] as const,
    token: () => getRepositoryStatusToken(repositoryId),
  });

  const latest = messages.last?.data as
    | { status?: "INDEXING" | "INDEXED" | "FAILED"; progress?: number }
    | undefined;
  const latestStatus = latest?.status;
  const latestProgress = latest?.progress;

  React.useEffect(() => {
    if (latestStatus === "INDEXED" || latestStatus === "FAILED") {
      queryClient.invalidateQueries({ queryKey: repositoriesQueryKey });
    }
  }, [latestStatus, queryClient]);

  React.useEffect(() => {
    onProgress?.(latestProgress);
  }, [latestProgress, onProgress]);

  return null;
}
