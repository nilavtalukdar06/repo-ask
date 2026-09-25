import { auth } from "@/lib/auth";
import { deleteCachedApiKey } from "@/lib/ai-gateway-key-cache";
import prisma from "@/lib/prisma";
import { secret } from "@/lib/secret";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function DELETE() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.session) {
      return NextResponse.json(
        { error: "the user is not authenticated" },
        { status: 401 },
      );
    }
    await secret.auth().universalAuth.login({
      clientId: process.env.CLIENT_ID!,
      clientSecret: process.env.CLIENT_SECRET!,
    });
    try {
      await secret
        .secrets()
        .deleteSecret(`AI_GATEWAY_API_KEY_${session.user.id}`, {
          environment: "dev",
          projectId: process.env.PROJECT_ID!,
          secretPath: "/",
        });
    } catch (error) {
      // Already gone (e.g. never created, or removed previously) — the end
      // state we want is "no key stored," which still holds, so continue.
      console.error("Infisical secret delete failed:", error);
    }
    await deleteCachedApiKey(session.user.id);
    const existingProfile = await prisma.profile.findUnique({
      where: {
        userId: session.user.id,
      },
    });
    if (!existingProfile) {
      return NextResponse.json(
        { error: "profile doesn't exist" },
        { status: 404 },
      );
    }
    await prisma.profile.update({
      where: {
        userId: session.user.id,
      },
      data: {
        apiKeyPrefix: "",
      },
    });
    return NextResponse.json(
      { message: "api key removed successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "failed to delete the secret" },
      { status: 500 },
    );
  }
}
