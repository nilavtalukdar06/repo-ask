import { auth } from "@/lib/auth";
import { getCachedApiKey, setCachedApiKey } from "@/lib/openai-key-cache";
import { secret } from "@/lib/secret";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
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

    const cachedApiKey = await getCachedApiKey(session.user.id);
    if (cachedApiKey) {
      return NextResponse.json({ apiKey: cachedApiKey }, { status: 200 });
    }

    await secret.auth().universalAuth.login({
      clientId: process.env.CLIENT_ID!,
      clientSecret: process.env.CLIENT_SECRET!,
    });
    const result = await secret.secrets().getSecret({
      environment: "dev",
      projectId: process.env.PROJECT_ID!,
      secretName: `API_KEY_${session.user.id}`,
    });

    await setCachedApiKey(session.user.id, result.secretValue);

    return NextResponse.json({ apiKey: result.secretValue }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "failed to retrieve the api key" },
      { status: 500 },
    );
  }
}
