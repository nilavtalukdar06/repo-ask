-- CreateEnum
CREATE TYPE "RepositoryStatus" AS ENUM ('INDEXING', 'INDEXED', 'FAILED');

-- CreateTable
CREATE TABLE "Repository" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "defaultBranch" TEXT,
    "language" TEXT,
    "stars" INTEGER,
    "status" "RepositoryStatus" NOT NULL DEFAULT 'INDEXING',
    "lastIndexedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Repository_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Repository_userId_idx" ON "Repository"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Repository_userId_owner_name_key" ON "Repository"("userId", "owner", "name");

-- AddForeignKey
ALTER TABLE "Repository" ADD CONSTRAINT "Repository_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
