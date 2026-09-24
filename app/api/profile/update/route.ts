import { profileUpdateSchema } from "@/app/api/profile/schema";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(request: NextRequest) {
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
    const parsedBody = profileUpdateSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { message: "failed to parse the request body" },
        { status: 400 },
      );
    }

    const existing = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json(
        { message: "profile not found" },
        { status: 404 },
      );
    }

    const result = await prisma.profile.update({
      where: { userId: session.user.id },
      data: parsedBody.data,
    });

    return NextResponse.json(
      { message: "profile updated successfully", userId: result.userId },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "failed to update profile" },
      { status: 500 },
    );
  }
}
