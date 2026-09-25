import { channel } from "inngest/realtime";
import { z } from "zod";

export const repositoryChannel = channel({
  name: (repositoryId: string) => `repository:${repositoryId}`,
  topics: {
    status: {
      schema: z.object({
        repositoryId: z.string(),
        stage: z.string(),
        status: z.enum(["INDEXING", "INDEXED", "FAILED"]),
        message: z.string().optional(),
        progress: z.number().min(0).max(100).optional(),
      }),
    },
  },
});
