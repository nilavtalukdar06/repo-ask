import {
  convertToModelMessages,
  createGateway,
  createIdGenerator,
  streamText,
  validateUIMessages,
  type UIMessage,
} from "ai";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import type { Prisma } from "@/app/generated/prisma/client";
import { auth } from "@/lib/auth";
import { getApiKeyForUser } from "@/lib/ai-gateway-key-cache";
import prisma from "@/lib/prisma";
import { formatContext, retrieveContext } from "@/lib/retrieval/pipeline";

export const maxDuration = 60;

const CHAT_MODEL = "inclusionai/ling-3.0-flash-fin-free";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.session) {
      return NextResponse.json(
        { message: "the user is not authenticated" },
        { status: 401 },
      );
    }

    const { message, id: repositoryId } = (await request.json()) as {
      message: UIMessage;
      id: string;
    };

    const repository = await prisma.repository.findFirst({
      where: { id: repositoryId, userId: session.user.id },
    });

    if (!repository) {
      return NextResponse.json(
        { message: "Repository not found." },
        { status: 404 },
      );
    }

    if (repository.status !== "INDEXED") {
      return NextResponse.json(
        { message: "This repository isn't indexed yet." },
        { status: 409 },
      );
    }

    let apiKey: string;
    try {
      apiKey = await getApiKeyForUser(session.user.id);
    } catch (error) {
      console.error(error);
      return NextResponse.json(
        {
          message:
            "Add your AI Gateway API key in your profile before chatting.",
        },
        { status: 400 },
      );
    }
    const userMessageRow = await prisma.message.upsert({
      where: { id: message.id },
      update: {},
      create: {
        id: message.id,
        repositoryId,
        role: "USER",
        parts: message.parts as unknown as Prisma.InputJsonValue,
      },
    });
    await prisma.message.deleteMany({
      where: {
        repositoryId,
        createdAt: { gt: userMessageRow.createdAt },
      },
    });

    const messageRows = await prisma.message.findMany({
      where: { repositoryId },
      orderBy: { createdAt: "asc" },
    });

    const messages: UIMessage[] = messageRows.map((row) => ({
      id: row.id,
      role: row.role === "USER" ? "user" : "assistant",
      parts: row.parts as UIMessage["parts"],
    }));

    const validatedMessages = await validateUIMessages({ messages });

    const gateway = createGateway({ apiKey });
    const chatModel = gateway.chat(CHAT_MODEL);

    const queryText = message.parts
      .filter((part) => part.type === "text")
      .map((part) => part.text)
      .join("\n")
      .trim();

    const retrievedChunks = queryText
      ? await retrieveContext(chatModel, repositoryId, queryText)
      : [];

    const result = streamText({
      model: chatModel,
      system: `You are a helpful assistant answering questions about the GitHub repository ${repository.owner}/${repository.name} (${repository.url}).

Answer using only the retrieved code context below. If it doesn't contain enough information to answer, say so instead of guessing. Cite file paths (and line numbers, when relevant) for anything you reference.

${formatContext(retrievedChunks)}`,
      messages: await convertToModelMessages(validatedMessages),
    });

    result.consumeStream();

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      generateMessageId: createIdGenerator({ prefix: "msg", size: 16 }),
      onEnd: async ({ responseMessage, outcome }) => {
        if (outcome.status !== "completed") return;

        await prisma.message.create({
          data: {
            id: responseMessage.id,
            repositoryId,
            role: "ASSISTANT",
            parts: responseMessage.parts as unknown as Prisma.InputJsonValue,
          },
        });
      },
      onError: (error) => {
        console.error(error);
        return "Something went wrong while generating a response.";
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to process chat message." },
      { status: 500 },
    );
  }
}
