"use server";

import { getClientSubscriptionToken } from "inngest/react";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { inngest } from "@/lib/inngest";
import { repositoryChannel } from "@/lib/inngest-channels";
import prisma from "@/lib/prisma";

export async function getRepositoryStatusToken(repositoryId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.session) {
    throw new Error("Unauthenticated.");
  }

  const repository = await prisma.repository.findUnique({
    where: { id: repositoryId },
  });
  if (!repository || repository.userId !== session.user.id) {
    throw new Error("Repository not found.");
  }

  return getClientSubscriptionToken(inngest, {
    channel: repositoryChannel(repositoryId),
    topics: ["status"],
  });
}
