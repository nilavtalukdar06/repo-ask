import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

    const { id } = await params;

    const repository = await prisma.repository.findUnique({
      where: { id },
    });
    if (!repository || repository.userId !== session.user.id) {
      return NextResponse.json(
        { message: "Repository not found." },
        { status: 404 },
      );
    }

    await prisma.repository.delete({ where: { id } });

    return NextResponse.json(
      { message: "repository deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "failed to delete repository" },
      { status: 500 },
    );
  }
}
