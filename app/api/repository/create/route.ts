import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { addRepositorySchema } from "@/app/api/repository/schema";
import { Prisma } from "@/app/generated/prisma/client";
import { auth } from "@/lib/auth";
import { parseGithubUrl } from "@/lib/parse-github-url";
import prisma from "@/lib/prisma";

type GithubRepoResponse = {
  name: string;
  html_url: string;
  description: string | null;
  private: boolean;
  default_branch: string;
  language: string | null;
  stargazers_count: number;
  owner: { login: string };
};

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
    const parsedBody = addRepositorySchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        {
          message:
            parsedBody.error.issues[0]?.message ??
            "failed to parse the request body",
        },
        { status: 400 },
      );
    }
    const parsedUrl = parseGithubUrl(parsedBody.data.githubUrl);
    if (!parsedUrl) {
      return NextResponse.json(
        { message: "Enter a valid GitHub repository URL." },
        { status: 400 },
      );
    }
    const githubResponse = await fetch(
      `https://api.github.com/repos/${parsedUrl.owner}/${parsedUrl.name}`,
      { headers: { Accept: "application/vnd.github+json" } },
    );
    if (githubResponse.status === 404) {
      return NextResponse.json(
        { message: "Repository not found on GitHub." },
        { status: 404 },
      );
    }
    if (!githubResponse.ok) {
      return NextResponse.json(
        { message: "Failed to reach GitHub. Please try again." },
        { status: 502 },
      );
    }
    const githubRepo: GithubRepoResponse = await githubResponse.json();
    if (githubRepo.private) {
      return NextResponse.json(
        { message: "Private repositories are not supported yet." },
        { status: 400 },
      );
    }
    let repository;
    try {
      repository = await prisma.repository.create({
        data: {
          name: githubRepo.name,
          owner: githubRepo.owner.login,
          url: githubRepo.html_url,
          description: githubRepo.description,
          defaultBranch: githubRepo.default_branch,
          language: githubRepo.language,
          stars: githubRepo.stargazers_count,
          status: "INDEXING",
          userId: session.user.id,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return NextResponse.json(
          { message: "You have already added this repository." },
          { status: 409 },
        );
      }
      throw error;
    }
    console.log("[repository.index] would trigger inngest workflow with:", {
      repositoryId: repository.id,
      owner: repository.owner,
      name: repository.name,
      url: repository.url,
      defaultBranch: repository.defaultBranch,
      userId: repository.userId,
    });

    return NextResponse.json({ repository }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Failed to add repository." },
      { status: 500 },
    );
  }
}
