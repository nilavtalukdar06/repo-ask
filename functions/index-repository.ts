import { Sandbox } from "e2b";
import { inngest } from "@/lib/inngest";
import { repositoryChannel } from "@/lib/inngest-channels";
import pinecone from "@/lib/pinecone";
import prisma from "@/lib/prisma";
import { batchFiles } from "@/lib/repository-indexing/batch-files";
import { generateChunkId } from "@/lib/repository-indexing/chunk-id";
import { chunkFileContent } from "@/lib/repository-indexing/chunking";
import {
  MAX_BATCH_BYTES,
  MAX_FILES_PER_BATCH,
  MAX_FILES_TO_INDEX,
  MAX_FILE_SIZE_BYTES,
  getFileRule,
  isIgnoredPath,
} from "@/lib/repository-indexing/file-rules";

const SANDBOX_TIMEOUT_MS = 15 * 60 * 1000;
const REPO_PATH = "/home/user/repository";
const PINECONE_INDEX_NAME = process.env.PINEC0NE_INDEX_NAME!;
const MAX_RECORDS_PER_UPSERT = 96;

type IndexRepositoryEventData = {
  repositoryId: string;
  userId: string;
  githubUrl: string;
};

async function destroySandbox(sandboxId: string) {
  try {
    const sandbox = await Sandbox.connect(sandboxId);
    await sandbox.kill();
  } catch (error) {
    console.error(`Failed to destroy sandbox ${sandboxId}:`, error);
  }
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export const indexRepository = inngest.createFunction(
  {
    id: "index-repository",
    triggers: [{ event: "repository/index.requested" }],
    retries: 1,
    onFailure: async ({ event, step }) => {
      const { repositoryId } = event.data.event
        .data as IndexRepositoryEventData;
      const errorMessage = event.data.error.message ?? "Indexing failed.";

      const repository = await step.run("load-repository-for-cleanup", () => {
        return prisma.repository.findUnique({ where: { id: repositoryId } });
      });

      await step.run("mark-repository-failed", async () => {
        await prisma.repository.update({
          where: { id: repositoryId },
          data: { status: "FAILED", errorMessage, sandboxId: null },
        });
      });

      if (repository?.sandboxId) {
        await step.run("destroy-sandbox-after-failure", () =>
          destroySandbox(repository.sandboxId!),
        );
      }

      await step.run("publish-failed-status", async () => {
        await inngest.realtime.publish(repositoryChannel(repositoryId).status, {
          repositoryId,
          stage: "failed",
          status: "FAILED",
          message: errorMessage,
        });
      });
    },
  },
  async ({ event, step }) => {
    const { repositoryId, githubUrl } = event.data;

    const emit = async (
      id: string,
      stage: string,
      message?: string,
      progress?: number,
    ) => {
      await step.realtime.publish(id, repositoryChannel(repositoryId).status, {
        repositoryId,
        stage,
        status: "INDEXING" as const,
        message,
        progress,
      });
    };

    // Pre-batch pipeline stages don't map to a chunk count, so they're given
    // fixed progress checkpoints. Batch progress is then scaled across the
    // remaining range up to 100.
    const PRE_BATCH_PROGRESS = 15;

    const sandboxId = await step.run("create-sandbox", async () => {
      const sandbox = await Sandbox.create({ timeoutMs: SANDBOX_TIMEOUT_MS });
      await prisma.repository.update({
        where: { id: repositoryId },
        data: { sandboxId: sandbox.sandboxId },
      });
      return sandbox.sandboxId;
    });

    await emit("emit-sandbox-created", "Sandbox created", undefined, 5);

    await step.run("clone-repository", async () => {
      const sandbox = await Sandbox.connect(sandboxId);
      await sandbox.commands.run(
        `git clone --depth 1 ${JSON.stringify(githubUrl)} ${REPO_PATH}`,
        { timeoutMs: 120_000 },
      );
    });

    await emit("emit-repository-cloned", "Repository cloned", undefined, 10);

    const filesToIndex = await step.run(
      "discover-and-filter-files",
      async () => {
        const sandbox = await Sandbox.connect(sandboxId);
        const result = await sandbox.commands.run(
          `find ${REPO_PATH} -type f -printf '%s\t%p\n'`,
          { timeoutMs: 60_000 },
        );

        const accepted: { relativePath: string; size: number }[] = [];

        for (const line of result.stdout.split("\n")) {
          if (!line.trim()) continue;

          const [sizeText, absolutePath] = line.split("\t");
          const size = Number(sizeText);
          const relativePath = absolutePath.startsWith(`${REPO_PATH}/`)
            ? absolutePath.slice(REPO_PATH.length + 1)
            : absolutePath;

          if (isIgnoredPath(relativePath)) continue;
          if (!getFileRule(relativePath)) continue;
          if (!Number.isFinite(size) || size > MAX_FILE_SIZE_BYTES) continue;

          accepted.push({ relativePath, size });
          if (accepted.length >= MAX_FILES_TO_INDEX) break;
        }

        return accepted;
      },
    );

    await emit(
      "emit-files-discovered",
      `Discovered ${filesToIndex.length} files to index`,
      undefined,
      PRE_BATCH_PROGRESS,
    );

    const batches = batchFiles(
      filesToIndex,
      MAX_BATCH_BYTES,
      MAX_FILES_PER_BATCH,
    );

    let totalChunks = 0;

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];

      const chunkCount = await step.run(
        `index-batch-${batchIndex}`,
        async () => {
          const sandbox = await Sandbox.connect(sandboxId);

          type ChunkRecord = {
            filePath: string;
            language: string;
            fileType: string;
            startLine: number;
            endLine: number;
            chunkIndex: number;
            content: string;
          };

          const chunkRecords: ChunkRecord[] = [];

          for (const file of batch) {
            const rule = getFileRule(file.relativePath);
            if (!rule) continue;

            const content = await sandbox.files.read(
              `${REPO_PATH}/${file.relativePath}`,
            );
            const fileChunks = chunkFileContent(rule.fileType, content).filter(
              (chunk) => chunk.content.trim().length > 0,
            );

            fileChunks.forEach((chunk, chunkIndex) => {
              chunkRecords.push({
                filePath: file.relativePath,
                language: rule.language,
                fileType: rule.fileType,
                startLine: chunk.startLine,
                endLine: chunk.endLine,
                chunkIndex,
                content: chunk.content,
              });
            });
          }

          if (chunkRecords.length === 0) {
            return 0;
          }

          // Pinecone's hosted embedding model turns `text` into a vector
          // server-side — no separate embeddings call needed.
          const index = pinecone
            .index({ name: PINECONE_INDEX_NAME })
            .namespace(repositoryId);

          for (const recordsChunk of chunkArray(
            chunkRecords,
            MAX_RECORDS_PER_UPSERT,
          )) {
            await index.upsertRecords({
              records: recordsChunk.map((record) => ({
                _id: generateChunkId(
                  repositoryId,
                  record.filePath,
                  record.chunkIndex,
                ),
                text: record.content,
                repositoryId,
                filePath: record.filePath,
                language: record.language,
                fileType: record.fileType,
                startLine: record.startLine,
                endLine: record.endLine,
                chunkIndex: record.chunkIndex,
              })),
            });
          }

          return chunkRecords.length;
        },
      );

      totalChunks += chunkCount;

      const batchProgress =
        PRE_BATCH_PROGRESS +
        Math.round(
          ((batchIndex + 1) / batches.length) * (100 - PRE_BATCH_PROGRESS),
        );

      await emit(
        `emit-batch-progress-${batchIndex}`,
        `Indexed batch ${batchIndex + 1} of ${batches.length}`,
        undefined,
        batchProgress,
      );
    }

    await step.run("mark-repository-indexed", async () => {
      await prisma.repository.update({
        where: { id: repositoryId },
        data: {
          status: "INDEXED",
          lastIndexedAt: new Date(),
          errorMessage: null,
          sandboxId: null,
        },
      });
    });

    await step.run("destroy-sandbox", () => destroySandbox(sandboxId));

    await step.realtime.publish(
      "emit-indexed-status",
      repositoryChannel(repositoryId).status,
      {
        repositoryId,
        stage: "indexed",
        status: "INDEXED" as const,
        message: `Indexed ${totalChunks} chunks across ${filesToIndex.length} files.`,
        progress: 100,
      },
    );

    return { repositoryId, totalChunks, totalFiles: filesToIndex.length };
  },
);
