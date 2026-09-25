import z from "zod";

import { parseGithubUrl } from "@/lib/parse-github-url";

export const addRepositorySchema = z.object({
  githubUrl: z
    .string()
    .min(1, "GitHub URL is required.")
    .refine((value) => parseGithubUrl(value) !== null, {
      message:
        "Enter a valid GitHub repository URL, e.g. https://github.com/owner/repo.",
    }),
});

export type AddRepositoryInput = z.infer<typeof addRepositorySchema>;
