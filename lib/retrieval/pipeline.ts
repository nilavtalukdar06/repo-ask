import { generateText, type LanguageModel } from "ai";

import {
  dedupeChunks,
  rerankChunks,
  searchNamespace,
} from "@/lib/retrieval/search";
import type { RetrievedChunk } from "@/lib/retrieval/types";

const MAX_SUBQUERIES = 3;
const MATCHES_PER_SUBQUERY = 8;
const MAX_CONTEXT_CHUNKS = 8;

type RetrievalPlanStep = {
  subquery: string;
  hyde: string;
};

const PLAN_SYSTEM_PROMPT = `For the user's question about a codebase, produce up to ${MAX_SUBQUERIES} focused sub-questions that together cover what's needed to fully answer it. If the question is already narrow, produce just one block for the original question, unchanged.

For EACH sub-question, also write a short hypothetical passage (2-4 sentences) that would appear in the codebase's source code, comments, or documentation and would directly answer it. Write the passage as real code/docs content, not as an explanation addressed to the user, and don't mention that it's hypothetical.

Reply with ONLY blocks in exactly this format, separated by a blank line, no other commentary:
Q: <sub-question>
A: <hypothetical passage>`;

function parsePlan(text: string, max: number): RetrievalPlanStep[] {
  const steps: RetrievalPlanStep[] = [];
  for (const block of text.split(/\n\s*\n/)) {
    const question = block.match(/Q:\s*([\s\S]*?)(?=\nA:)/)?.[1]?.trim();
    const hyde = block.match(/A:\s*([\s\S]*)/)?.[1]?.trim();
    if (question && hyde) {
      steps.push({ subquery: question, hyde });
    }
  }
  return steps.slice(0, max);
}

// Query decomposition and HyDE (Hypothetical Document Embeddings — retrieving
// with an embedded hypothetical *answer* instead of the bare question, since
// answers land closer in embedding space to the real passages that answer
// them) are combined into a single call: free-tier gateway models are
// rate-limited tightly enough (verified against this project's models) that
// a call per subquery would exhaust the budget within one chat turn.
async function planRetrieval(
  model: LanguageModel,
  query: string,
): Promise<RetrievalPlanStep[]> {
  try {
    const { text } = await generateText({
      model,
      system: PLAN_SYSTEM_PROMPT,
      prompt: query,
    });
    const steps = parsePlan(text, MAX_SUBQUERIES);
    return steps.length > 0 ? steps : [{ subquery: query, hyde: query }];
  } catch (error) {
    console.error(
      "Retrieval planning failed, falling back to a direct search on the original query",
      error,
    );
    return [{ subquery: query, hyde: query }];
  }
}

export async function retrieveContext(
  model: LanguageModel,
  repositoryId: string,
  query: string,
): Promise<RetrievedChunk[]> {
  const plan = await planRetrieval(model, query);

  const perStepResults = await Promise.all(
    plan.map(async (step) => {
      try {
        return await searchNamespace(
          repositoryId,
          step.hyde,
          MATCHES_PER_SUBQUERY,
        );
      } catch (error) {
        console.error(
          `Retrieval failed for subquery "${step.subquery}"`,
          error,
        );
        return [];
      }
    }),
  );

  const merged = dedupeChunks(perStepResults.flat());

  try {
    return await rerankChunks(query, merged, MAX_CONTEXT_CHUNKS);
  } catch (error) {
    console.error(
      "Reranking failed, falling back to vector-score order",
      error,
    );
    return merged
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_CONTEXT_CHUNKS);
  }
}

export function formatContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return "No relevant code was found in the indexed repository for this question.";
  }

  return chunks
    .map(
      (chunk) =>
        `### ${chunk.filePath} (lines ${chunk.startLine}-${chunk.endLine})\n` +
        `\`\`\`${chunk.language}\n${chunk.text}\n\`\`\``,
    )
    .join("\n\n");
}
