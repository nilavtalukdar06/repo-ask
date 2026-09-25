import { formatRelativeTime } from "@/lib/format-relative-time";
import type { RepositoryRecord } from "@/lib/queries/repository";

export function RepositoryStatus({
  status,
  lastIndexedAt,
}: {
  status: RepositoryRecord["status"];
  lastIndexedAt: string | null;
}) {
  if (status === "INDEXING") {
    return (
      <span className="animate-pulse text-xs font-medium text-amber-600 dark:text-amber-500">
        Indexing...
      </span>
    );
  }

  if (status === "FAILED") {
    return (
      <span className="text-xs font-medium text-red-600 dark:text-red-500">
        Failed to index
      </span>
    );
  }

  return (
    <span className="text-xs text-muted-foreground">
      <span className="font-medium text-emerald-600 dark:text-emerald-500">
        Indexed
      </span>
      {lastIndexedAt
        ? ` · ${formatRelativeTime(new Date(lastIndexedAt))}`
        : null}
    </span>
  );
}
