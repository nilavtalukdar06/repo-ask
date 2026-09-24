import { profileSchema } from "@/app/api/profile/schema";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

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
    const body = await request.json();
    const parsedBody = profileSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { message: "failed to parse the request body" },
        { status: 400 },
      );
    }
    const result = await prisma.profile.create({
      data: {
        name: parsedBody.data.name,
        githubUrl: parsedBody.data.githubUrl,
        apiKeyPrefix: parsedBody.data?.apiKeyPrefix ?? "",
        userId: session.user.id,
      },
    });
    return NextResponse.json(
      { message: "user created successfully", userId: result.userId },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "failed to create profile" },
      { status: 500 },
    );
  }
}
