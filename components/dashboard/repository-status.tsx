import { formatRelativeTime } from "@/lib/format-relative-time";
import type { RepositoryRecord } from "@/lib/queries/repository";

export function RepositoryStatus({
  status,
  lastIndexedAt,
  progress,
}: {
  status: RepositoryRecord["status"];
  lastIndexedAt: string | null;
  progress?: number;
}) {
  if (status === "INDEXING") {
    return (
      <div className="flex flex-col gap-1">
        <span className="animate-pulse text-xs font-medium text-amber-600 dark:text-amber-500">
          Indexing{progress !== undefined ? ` · ${progress}%` : "..."}
        </span>
        <div className="h-1 w-full overflow-hidden rounded-full bg-amber-100 dark:bg-amber-950">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-500 ease-out"
            style={{ width: `${progress ?? 0}%` }}
          />
        </div>
      </div>
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
