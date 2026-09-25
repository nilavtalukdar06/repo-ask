import pinecone from "@/lib/pinecone";
import type { RetrievedChunk } from "@/lib/retrieval/types";

const PINECONE_INDEX_NAME = process.env.PINEC0NE_INDEX_NAME!;
const RERANK_MODEL = "bge-reranker-v2-m3";

const RECORD_FIELDS = [
  "text",
  "filePath",
  "language",
  "fileType",
  "startLine",
  "endLine",
  "chunkIndex",
];

export async function searchNamespace(
  repositoryId: string,
  queryText: string,
  topK: number,
): Promise<RetrievedChunk[]> {
  const index = pinecone
    .index({ name: PINECONE_INDEX_NAME })
    .namespace(repositoryId);

  const { result } = await index.searchRecords({
    query: { topK, inputs: { text: queryText } },
    fields: RECORD_FIELDS,
  });

  return result.hits.map((hit) => {
    const fields = hit.fields as Record<string, unknown>;
    return {
      id: hit._id,
      score: hit._score,
      text: String(fields.text ?? ""),
      filePath: String(fields.filePath ?? ""),
      language: String(fields.language ?? ""),
      fileType: String(fields.fileType ?? ""),
      startLine: Number(fields.startLine ?? 0),
      endLine: Number(fields.endLine ?? 0),
      chunkIndex: Number(fields.chunkIndex ?? 0),
    };
  });
}

// Keeps the highest-scoring occurrence of each chunk retrieved across
// multiple subqueries/HyDE documents.
export function dedupeChunks(chunks: RetrievedChunk[]): RetrievedChunk[] {
  const byId = new Map<string, RetrievedChunk>();
  for (const chunk of chunks) {
    const existing = byId.get(chunk.id);
    if (!existing || chunk.score > existing.score) {
      byId.set(chunk.id, chunk);
    }
  }
  return [...byId.values()];
}

export async function rerankChunks(
  query: string,
  chunks: RetrievedChunk[],
  topN: number,
): Promise<RetrievedChunk[]> {
  if (chunks.length === 0) {
    return [];
  }

  const { data } = await pinecone.inference.rerank({
    model: RERANK_MODEL,
    query,
    documents: chunks.map((chunk) => ({ text: chunk.text })),
    topN: Math.min(topN, chunks.length),
    rankFields: ["text"],
    // bge-reranker-v2-m3 caps each query+document pair at 1024 tokens; code
    // chunks can exceed that combined with the query, so truncate from the
    // end rather than erroring the whole rerank call.
    parameters: { truncate: "END" },
  });

  return data.map((ranked) => chunks[ranked.index]);
}
