import { notFound } from "next/navigation";
import type { UIMessage } from "ai";

import { getServerSession } from "@/lib/auth-session";
import prisma from "@/lib/prisma";
import { ChatView } from "@/components/chat/chat-view";

type ChatPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;
  const session = await getServerSession();

  if (!session) {
    notFound();
  }

  const repository = await prisma.repository.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!repository) {
    notFound();
  }

  const messageRows = await prisma.message.findMany({
    where: { repositoryId: id },
    orderBy: { createdAt: "asc" },
  });

  const initialMessages: UIMessage[] = messageRows.map((row) => ({
    id: row.id,
    role: row.role === "USER" ? "user" : "assistant",
    parts: row.parts as UIMessage["parts"],
  }));

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {repository.status === "INDEXED" ? (
        <ChatView repository={repository} initialMessages={initialMessages} />
      ) : (
        <div className="flex flex-1 items-center justify-center p-4 text-sm text-muted-foreground">
          {repository.status === "INDEXING"
            ? "This repository is still indexing. Chat will be available once it's ready."
            : "This repository failed to index, so it can't be chatted with yet."}
        </div>
      )}
    </div>
  );
}
