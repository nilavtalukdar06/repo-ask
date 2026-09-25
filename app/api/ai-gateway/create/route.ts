import { auth } from "@/lib/auth";
import { setCachedApiKey } from "@/lib/ai-gateway-key-cache";
import prisma from "@/lib/prisma";
import { secret } from "@/lib/secret";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const requestSchema = z.object({
  apiKey: z.string().min(1, "api key is required"),
});

export async function POST(request: NextRequest) {
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
    const body = await request.json();
    const parsedBody = requestSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "failed to parse the request body" },
        { status: 400 },
      );
    }
    await secret.auth().universalAuth.login({
      clientId: process.env.CLIENT_ID!,
      clientSecret: process.env.CLIENT_SECRET!,
    });
    await secret
      .secrets()
      .createSecret(`AI_GATEWAY_API_KEY_${session.user.id}`, {
        environment: "dev",
        projectId: process.env.PROJECT_ID!,
        secretValue: parsedBody.data.apiKey,
      });
    await setCachedApiKey(session.user.id, parsedBody.data.apiKey);
    const existingProfile = await prisma.profile.findUnique({
      where: {
        userId: session.user.id,
      },
    });
    if (!existingProfile) {
      return NextResponse.json(
        { error: "the profile doesn't exist" },
        { status: 400 },
      );
    }
    await prisma.profile.update({
      where: {
        userId: session.user.id,
      },
      data: {
        apiKeyPrefix: parsedBody.data.apiKey.slice(0, 8),
      },
    });

    return NextResponse.json(
      { message: "api key saved successfully" },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "failed to save ai gateway api key" },
      { status: 500 },
    );
  }
}
