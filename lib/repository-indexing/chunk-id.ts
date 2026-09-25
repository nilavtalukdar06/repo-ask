import { createHash } from "node:crypto";

export function generateChunkId(
  repositoryId: string,
  filePath: string,
  chunkIndex: number,
): string {
  return createHash("sha256")
    .update(`${repositoryId}:${filePath}:${chunkIndex}`)
    .digest("hex");
}
