const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";

const EMBEDDING_MODEL_BY_DIMENSION: Record<number, string> = {
  1536: "text-embedding-3-small",
  3072: "text-embedding-3-large",
};

export function resolveEmbeddingModel(dimension: number): string {
  const model = EMBEDDING_MODEL_BY_DIMENSION[dimension];
  if (!model) {
    throw new Error(
      `No embedding model configured for Pinecone index dimension ${dimension}.`,
    );
  }
  return model;
}

const EMBEDDING_BATCH_SIZE = 100;

export async function generateEmbeddings(
  texts: string[],
  model: string,
  apiKey: string,
): Promise<number[][]> {
  const vectors: number[][] = [];

  for (let i = 0; i < texts.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = texts.slice(i, i + EMBEDDING_BATCH_SIZE);

    const response = await fetch(OPENAI_EMBEDDINGS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, input: batch }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(
        `OpenAI embeddings request failed (${response.status}): ${errorBody.slice(0, 500)}`,
      );
    }

    const data: { data: { embedding: number[]; index: number }[] } =
      await response.json();

    const batchVectors = data.data
      .sort((a, b) => a.index - b.index)
      .map((item) => item.embedding);

    vectors.push(...batchVectors);
  }

  return vectors;
}
