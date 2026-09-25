import { channel } from "inngest/realtime";
import { z } from "zod";

// Per-repository channel: the indexing function publishes progress here as
// it moves through the pipeline, and the dashboard subscribes per repository
// while it's in the INDEXING state.
export const repositoryChannel = channel({
  name: (repositoryId: string) => `repository:${repositoryId}`,
  topics: {
    status: {
      schema: z.object({
        repositoryId: z.string(),
        stage: z.string(),
        status: z.enum(["INDEXING", "INDEXED", "FAILED"]),
        message: z.string().optional(),
      }),
    },
  },
});
