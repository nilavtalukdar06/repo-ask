import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@/app/generated/prisma/client";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  REPOSITORIES_PAGE_SIZE,
  REPOSITORY_SEARCH_MAX_LENGTH,
  loadRepositoriesSearchParams,
} from "@/lib/search-params/repositories";

export async function GET(request: NextRequest) {
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

    const params = loadRepositoriesSearchParams(request);
    const page = Math.max(1, params.page);
    const search = params.q.trim().slice(0, REPOSITORY_SEARCH_MAX_LENGTH);

    const where: Prisma.RepositoryWhereInput = {
      userId: session.user.id,
      ...(search && { name: { contains: search, mode: "insensitive" } }),
    };

    const [total, repositories] = await prisma.$transaction([
      prisma.repository.count({ where }),
      prisma.repository.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip: (page - 1) * REPOSITORIES_PAGE_SIZE,
        take: REPOSITORIES_PAGE_SIZE,
      }),
    ]);

    return NextResponse.json(
      {
        repositories,
        total,
        page,
        pageSize: REPOSITORIES_PAGE_SIZE,
        totalPages: Math.ceil(total / REPOSITORIES_PAGE_SIZE),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "failed to get repositories" },
      { status: 500 },
    );
  }
}
