import { Sandbox } from "e2b";
import { inngest } from "@/lib/inngest";
import { repositoryChannel } from "@/lib/inngest-channels";
import { getApiKeyForUser } from "@/lib/openai-key-cache";
import pinecone from "@/lib/pinecone";
import prisma from "@/lib/prisma";
import { batchFiles } from "@/lib/repository-indexing/batch-files";
import { generateChunkId } from "@/lib/repository-indexing/chunk-id";
import { chunkFileContent } from "@/lib/repository-indexing/chunking";
import {
  generateEmbeddings,
  resolveEmbeddingModel,
} from "@/lib/repository-indexing/embeddings";
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
    const { repositoryId, userId, githubUrl } = event.data;

    const emit = async (id: string, stage: string, message?: string) => {
      await step.realtime.publish(id, repositoryChannel(repositoryId).status, {
        repositoryId,
        stage,
        status: "INDEXING" as const,
        message,
      });
    };

    const sandboxId = await step.run("create-sandbox", async () => {
      const sandbox = await Sandbox.create({ timeoutMs: SANDBOX_TIMEOUT_MS });
      await prisma.repository.update({
        where: { id: repositoryId },
        data: { sandboxId: sandbox.sandboxId },
      });
      return sandbox.sandboxId;
    });

    await emit("emit-sandbox-created", "Sandbox created");

    await step.run("clone-repository", async () => {
      const sandbox = await Sandbox.connect(sandboxId);
      const result = await sandbox.commands.run(
        `git clone --depth 1 ${JSON.stringify(githubUrl)} ${REPO_PATH}`,
        { timeoutMs: 120_000 },
      );
      console.log("Clone stdout:", result.stdout);
      console.log("Clone stderr:", result.stderr);
    });

    await emit("emit-repository-cloned", "Repository cloned");

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
    );

    const embeddingDimension = await step.run(
      "resolve-pinecone-index",
      async () => {
        const model = await pinecone.indexes.describe(PINECONE_INDEX_NAME);
        return model.dimension;
      },
    );

    if (!embeddingDimension) {
      throw new Error(
        `Pinecone index "${PINECONE_INDEX_NAME}" has no configured dimension.`,
      );
    }

    const embeddingModel = resolveEmbeddingModel(embeddingDimension);

    const apiKey = await step.run("get-openai-api-key", () => {
      return getApiKeyForUser(userId);
    });

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
            const fileChunks = chunkFileContent(rule.fileType, content);

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

          const vectors = await generateEmbeddings(
            chunkRecords.map((record) => record.content),
            embeddingModel,
            apiKey,
          );

          const index = pinecone.index({
            name: PINECONE_INDEX_NAME,
            namespace: repositoryId,
          });

          await index.upsert({
            records: chunkRecords.map((record, i) => ({
              id: generateChunkId(
                repositoryId,
                record.filePath,
                record.chunkIndex,
              ),
              values: vectors[i],
              metadata: {
                repositoryId,
                filePath: record.filePath,
                language: record.language,
                fileType: record.fileType,
                startLine: record.startLine,
                endLine: record.endLine,
                chunkIndex: record.chunkIndex,
                content: record.content,
              },
            })),
          });

          return chunkRecords.length;
        },
      );

      totalChunks += chunkCount;

      await emit(
        `emit-batch-progress-${batchIndex}`,
        `Embedded batch ${batchIndex + 1} of ${batches.length}`,
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
      },
    );

    return { repositoryId, totalChunks, totalFiles: filesToIndex.length };
  },
);
