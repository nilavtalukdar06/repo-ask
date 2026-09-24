import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function DELETE() {
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

    const existing = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json(
        { message: "profile not found" },
        { status: 404 },
      );
    }

    await prisma.profile.delete({
      where: { userId: session.user.id },
    });

    return NextResponse.json(
      { message: "profile deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "failed to delete profile" },
      { status: 500 },
    );
  }
}
