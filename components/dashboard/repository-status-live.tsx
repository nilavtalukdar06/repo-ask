"use client";

import * as React from "react";

import type { RepositoryRecord } from "@/lib/queries/repository";
import { RepositoryRealtimeSync } from "@/components/dashboard/repository-realtime-sync";
import { RepositoryStatus } from "@/components/dashboard/repository-status";

export function RepositoryStatusLive({
  repository,
}: {
  repository: RepositoryRecord;
}) {
  const [progress, setProgress] = React.useState<number | undefined>(undefined);

  return (
    <>
      {repository.status === "INDEXING" && (
        <RepositoryRealtimeSync
          repositoryId={repository.id}
          onProgress={setProgress}
        />
      )}
      <RepositoryStatus
        status={repository.status}
        lastIndexedAt={repository.lastIndexedAt}
        progress={progress}
      />
    </>
  );
}
