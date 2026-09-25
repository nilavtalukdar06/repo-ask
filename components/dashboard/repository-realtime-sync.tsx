"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRealtime } from "inngest/react";

import { getRepositoryStatusToken } from "@/server/repository-realtime";
import { repositoryChannel } from "@/lib/inngest-channels";
import { repositoriesQueryKey } from "@/lib/queries/repository";

// Mounted only while a repository's status is INDEXING. Subscribes to its
// realtime channel and refetches the repositories list once the pipeline
// reaches a terminal status, so the card/menu item picks up INDEXED/FAILED
// without polling.
export function RepositoryRealtimeSync({
  repositoryId,
}: {
  repositoryId: string;
}) {
  const queryClient = useQueryClient();

  const { messages } = useRealtime({
    channel: repositoryChannel(repositoryId),
    topics: ["status"] as const,
    token: () => getRepositoryStatusToken(repositoryId),
  });

  // The library's generic inference for a parametric channel + topics tuple
  // doesn't flow `data` to the schema type, so it comes back as `unknown`.
  // The shape is guaranteed at runtime by the zod schema on the channel
  // (server-side publish validates against it), so a targeted cast is safe
  // here.
  const latestStatus = (
    messages.last?.data as { status?: "INDEXING" | "INDEXED" | "FAILED" }
  )?.status;

  React.useEffect(() => {
    if (latestStatus === "INDEXED" || latestStatus === "FAILED") {
      queryClient.invalidateQueries({ queryKey: repositoriesQueryKey });
    }
  }, [latestStatus, queryClient]);

  return null;
}
