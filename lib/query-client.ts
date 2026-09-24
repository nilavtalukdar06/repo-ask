import { QueryClient } from "@tanstack/react-query";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Avoid immediate refetch after hydration; server data stays fresh for 60s.
        staleTime: 60 * 1000,
      },
    },
  });
}

export { makeQueryClient };
