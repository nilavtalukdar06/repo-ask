import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
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

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });
    if (!profile) {
      return NextResponse.json(
        { message: "profile not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ profile }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "failed to get profile" },
      { status: 500 },
    );
  }
}
