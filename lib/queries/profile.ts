"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type ProfileRecord = {
  id: string;
  name: string;
  githubUrl: string;
  apiKeyPrefix: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export const profileQueryKey = ["profile"] as const;

async function parseJson(response: Response) {
  return response.json().catch(() => ({}));
}

export function useProfileQuery() {
  return useQuery({
    queryKey: profileQueryKey,
    queryFn: async (): Promise<ProfileRecord | null> => {
      const response = await fetch("/api/profile/get");

      if (response.status === 404) {
        return null;
      }

      const data = await parseJson(response);

      if (!response.ok) {
        throw new Error(data.message ?? "Failed to load profile.");
      }

      return data.profile as ProfileRecord;
    },
    retry: false,
  });
}

export function useSaveProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      githubUrl: string;
      hasProfile: boolean;
    }) => {
      const { hasProfile, name, githubUrl } = input;

      const response = await fetch(
        hasProfile ? "/api/profile/update" : "/api/profile/create",
        {
          method: hasProfile ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, githubUrl }),
        },
      );

      const data = await parseJson(response);

      if (!response.ok) {
        throw new Error(data.message ?? "Failed to save profile.");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileQueryKey });
    },
  });
}

export function useCreateApiKeyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (apiKey: string) => {
      const response = await fetch("/api/ai-gateway/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey }),
      });

      const data = await parseJson(response);

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save API key.");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileQueryKey });
    },
  });
}

export function useRemoveApiKeyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ai-gateway/delete", {
        method: "DELETE",
      });

      const data = await parseJson(response);

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to remove API key.");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileQueryKey });
    },
  });
}
