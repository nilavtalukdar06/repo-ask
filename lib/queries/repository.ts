"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import type { AddRepositoryInput } from "@/app/api/repository/schema";
import type { RepositoryStatus } from "@/app/generated/prisma/client";

export type RepositoryRecord = {
  id: string;
  name: string;
  owner: string;
  url: string;
  description: string | null;
  defaultBranch: string | null;
  language: string | null;
  stars: number | null;
  status: RepositoryStatus;
  lastIndexedAt: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export const repositoriesQueryKey = ["repositories"] as const;

async function parseJson(response: Response) {
  return response.json().catch(() => ({}));
}

export type RepositoriesPage = {
  repositories: RepositoryRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function useRepositoriesQuery({
  page,
  search,
}: {
  page: number;
  search: string;
}) {
  return useQuery({
    queryKey: [...repositoriesQueryKey, { page, search }],
    queryFn: async (): Promise<RepositoriesPage> => {
      const params = new URLSearchParams({ page: String(page) });
      if (search) {
        params.set("q", search);
      }

      const response = await fetch(`/api/repository/get?${params}`);
      const data = await parseJson(response);

      if (!response.ok) {
        throw new Error(data.message ?? "Failed to load repositories.");
      }

      return data as RepositoriesPage;
    },
    placeholderData: keepPreviousData,
  });
}

export function useCreateRepositoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddRepositoryInput) => {
      const response = await fetch("/api/repository/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      const data = await parseJson(response);

      if (!response.ok) {
        throw new Error(data.message ?? "Failed to add repository.");
      }

      return data.repository as RepositoryRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repositoriesQueryKey });
    },
  });
}

export function useDeleteRepositoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/repository/delete/${id}`, {
        method: "DELETE",
      });
      const data = await parseJson(response);
      if (!response.ok) {
        throw new Error(data.message ?? "Failed to delete repository.");
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: repositoriesQueryKey });
    },
  });
}
