"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  GitForkIcon,
  MessageSquareIcon,
  PlusIcon,
  SearchIcon,
  StarIcon,
  Trash2Icon,
} from "lucide-react";
import { debounce, useQueryStates } from "nuqs";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import {
  REPOSITORY_SEARCH_MAX_LENGTH,
  repositoriesSearchParams,
} from "@/lib/search-params/repositories";
import {
  useDeleteRepositoryMutation,
  useRepositoriesQuery,
  type RepositoryRecord,
} from "@/lib/queries/repository";

import { AddRepositoryDialog } from "@/components/dashboard/add-repository-dialog";
import { GLASS_CLASSNAME } from "@/components/dashboard/glass";
import { RepositoryRealtimeSync } from "@/components/dashboard/repository-realtime-sync";
import { RepositoryStatus } from "@/components/dashboard/repository-status";
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

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
      className="text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:focus:bg-red-950/40 dark:focus:text-red-300 [&_svg]:text-red-600 dark:[&_svg]:text-red-400"
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
    <AddRepositoryDialog renderTrigger={<Button className="gap-2" />}>
      <PlusIcon />
      Add repository
    </AddRepositoryDialog>
  );
}

const SEARCH_DEBOUNCE_MS = 300;

// Page changes apply right away; search edits (and the page reset they cause) wait for the debounce,
// so typing produces a single fetch instead of flashing unfiltered results first.
function useSettledListParams(page: number, search: string) {
  const [settled, setSettled] = React.useState({ page, search });

  React.useEffect(() => {
    if (search === settled.search) {
      if (page !== settled.page) {
        setSettled({ page, search });
      }
      return;
    }
    const timeout = setTimeout(
      () => setSettled({ page, search }),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timeout);
  }, [page, search, settled]);

  return settled;
}

function RepositoryPagination({
  page,
  totalPages,
  total,
  pageSize,
  disabled,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  disabled: boolean;
  onPageChange: (page: number) => void;
}) {
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <nav
      aria-label="Repositories pagination"
      className="flex flex-col items-center justify-between gap-3 sm:flex-row"
    >
      <p className="text-sm text-muted-foreground">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={disabled || page <= 1}
        >
          <ChevronLeftIcon />
          Previous
        </Button>
        <span className="min-w-20 text-center text-sm tabular-nums">
          Page {page} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={disabled || page >= totalPages}
        >
          Next
          <ChevronRightIcon />
        </Button>
      </div>
    </nav>
  );
}

export function RepositoryDashboard({
  userName,
}: {
  userName?: string | null;
}) {
  const [{ page: rawPage, q }, setParams] = useQueryStates(
    repositoriesSearchParams,
  );
  const { page, search } = useSettledListParams(Math.max(1, rawPage), q.trim());

  const { data, isPending, isError, error, isFetching, isPlaceholderData } =
    useRepositoriesQuery({ page, search });

  const totalPages = data?.totalPages ?? 0;

  // A page can disappear after a delete or a narrower search; snap back to the last one.
  React.useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setParams({ page: totalPages });
    }
  }, [page, totalPages, setParams]);

  function handleSearchChange(value: string) {
    setParams(
      { q: value.slice(0, REPOSITORY_SEARCH_MAX_LENGTH), page: null },
      { limitUrlUpdates: value ? debounce(SEARCH_DEBOUNCE_MS) : undefined },
    );
  }

  function handlePageChange(nextPage: number) {
    setParams({ page: nextPage });
  }

  if (isPending) {
    return (
      <div className="grid flex-1 auto-rows-min grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-40" />
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

  const { repositories, total, pageSize } = data;

  if (total === 0 && !search && !q) {
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

  const isChangingResults = isFetching && isPlaceholderData;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-heading text-lg font-medium">Repositories</h1>
        <AddRepositoryButton />
      </div>
      <InputGroup className="w-full sm:max-w-sm">
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          type="search"
          placeholder="Search repositories by name..."
          aria-label="Search repositories by name"
          value={q}
          onChange={(event) => handleSearchChange(event.target.value)}
          maxLength={REPOSITORY_SEARCH_MAX_LENGTH}
        />
        {isChangingResults && (
          <InputGroupAddon align="inline-end">
            <Spinner />
          </InputGroupAddon>
        )}
      </InputGroup>
      {repositories.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchIcon />
            </EmptyMedia>
            <EmptyTitle>No repositories found</EmptyTitle>
            <EmptyDescription>
              No repository names match &ldquo;{search || q}&rdquo;. Try a
              different search.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSearchChange("")}
            >
              Clear search
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div
          className={cn(
            "grid grid-cols-1 gap-4 transition-opacity sm:grid-cols-2 xl:grid-cols-3",
            isChangingResults && "opacity-60",
          )}
          aria-busy={isChangingResults}
        >
          {repositories.map((repository) => (
            <Card key={repository.id} className={cn(GLASS_CLASSNAME, "h-full")}>
              {repository.status === "INDEXING" && (
                <RepositoryRealtimeSync repositoryId={repository.id} />
              )}
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
              <CardContent className="flex flex-col h-full gap-2">
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
              <CardFooter className="justify-between h-fit gap-2">
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
      )}
      {totalPages > 1 && page <= totalPages && (
        <RepositoryPagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          disabled={isChangingResults}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
