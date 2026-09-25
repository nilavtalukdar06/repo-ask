import { auth } from "@/lib/auth";
import { getApiKeyForUser } from "@/lib/openai-key-cache";
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

    const apiKey = await getApiKeyForUser(session.user.id);

    return NextResponse.json({ apiKey }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "failed to retrieve the api key" },
      { status: 500 },
    );
  }
}
