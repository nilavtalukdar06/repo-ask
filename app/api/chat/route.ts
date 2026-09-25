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

export const maxDuration = 30;

const CHAT_MODEL = "google/gemini-2.5-flash";

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

    const previousMessageRows = await prisma.message.findMany({
      where: { repositoryId },
      orderBy: { createdAt: "asc" },
    });

    const previousMessages: UIMessage[] = previousMessageRows.map((row) => ({
      id: row.id,
      role: row.role === "USER" ? "user" : "assistant",
      parts: row.parts as UIMessage["parts"],
    }));

    // Persist the user's message before calling the model, so it's never
    // lost even if the generation below fails.
    await prisma.message.create({
      data: {
        id: message.id,
        repositoryId,
        role: "USER",
        parts: message.parts as unknown as Prisma.InputJsonValue,
      },
    });

    const messages = [...previousMessages, message];
    const validatedMessages = await validateUIMessages({ messages });

    const gateway = createGateway({ apiKey });

    const result = streamText({
      model: gateway.chat(CHAT_MODEL),
      system: `You are a helpful assistant answering questions about the GitHub repository ${repository.owner}/${repository.name} (${repository.url}).`,
      messages: await convertToModelMessages(validatedMessages),
    });

    // Keep generating and persisting the response even if the client
    // disconnects mid-stream.
    result.consumeStream();

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      generateMessageId: createIdGenerator({ prefix: "msg", size: 16 }),
      onEnd: async ({ responseMessage, outcome }) => {
        // Only persist a completed turn — a failed/aborted generation has no
        // meaningful content and would otherwise leave an empty message.
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
