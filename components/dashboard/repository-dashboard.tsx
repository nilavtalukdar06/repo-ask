"use client";

import Link from "next/link";
import {
  GitForkIcon,
  MessageSquareIcon,
  PlusIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/format-relative-time";
import {
  useDeleteRepositoryMutation,
  useRepositoriesQuery,
  type RepositoryRecord,
} from "@/lib/queries/repository";

import { AddRepositoryDialog } from "@/components/dashboard/add-repository-dialog";
import { GLASS_CLASSNAME } from "@/components/dashboard/glass";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

function RepositoryStatus({
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

function DeleteRepositoryButton({
  repository,
}: {
  repository: RepositoryRecord;
}) {
  const deleteMutation = useDeleteRepositoryMutation();

  function handleDelete() {
    deleteMutation.mutate(repository.id, {
      onSuccess: () => {
        toast.success("Repository removed.");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      onClick={handleDelete}
      disabled={deleteMutation.isPending}
      aria-label={`Delete ${repository.owner}/${repository.name}`}
    >
      {deleteMutation.isPending ? <Spinner /> : <Trash2Icon />}
    </Button>
  );
}

function AddRepositoryButton() {
  return (
    <AddRepositoryDialog renderTrigger={<Button size="sm" className="gap-2" />}>
      <PlusIcon />
      Add repository
    </AddRepositoryDialog>
  );
}

export function RepositoryDashboard({
  userName,
}: {
  userName?: string | null;
}) {
  const {
    data: repositories,
    isLoading,
    isError,
    error,
  } = useRepositoriesQuery();

  if (isLoading) {
    return (
      <div className="grid flex-1 auto-rows-min grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-32" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Couldn&apos;t load repositories</EmptyTitle>
            <EmptyDescription>
              {error instanceof Error ? error.message : "Something went wrong."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  if (!repositories || repositories.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-4">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <GitForkIcon />
            </EmptyMedia>
            <EmptyTitle>No repositories yet</EmptyTitle>
            <EmptyDescription>
              {userName ? `Welcome, ${userName}. ` : null}
              Add a GitHub repository to start asking questions about its code.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <AddRepositoryButton />
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-heading text-lg font-medium">Repositories</h1>
        <AddRepositoryButton />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {repositories.map((repository) => (
          <Card key={repository.id} className={cn(GLASS_CLASSNAME)}>
            <CardHeader>
              <CardTitle className="truncate">
                {repository.owner}/{repository.name}
              </CardTitle>
              {repository.description && (
                <CardDescription className="line-clamp-2">
                  {repository.description}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {repository.language && <span>{repository.language}</span>}
                {repository.stars !== null && (
                  <span className="inline-flex items-center gap-1">
                    <StarIcon className="size-3" />
                    {repository.stars.toLocaleString()}
                  </span>
                )}
              </div>
              <RepositoryStatus
                status={repository.status}
                lastIndexedAt={repository.lastIndexedAt}
              />
            </CardContent>
            <CardFooter className="justify-between gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                nativeButton={false}
                render={<Link href={`/chat/${repository.id}`} />}
              >
                <MessageSquareIcon />
                Open
              </Button>
              <DeleteRepositoryButton repository={repository} />
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
