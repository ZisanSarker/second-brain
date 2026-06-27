/*
  Warnings:

  - Added the required column `updatedAt` to the `Tag` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "author" TEXT,
ADD COLUMN     "customMetadata" JSONB,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "docCreatedAt" TIMESTAMP(3),
ADD COLUMN     "docModifiedAt" TIMESTAMP(3),
ADD COLUMN     "embeddingStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "fileSize" BIGINT,
ADD COLUMN     "fileType" TEXT,
ADD COLUMN     "importedFrom" TEXT,
ADD COLUMN     "indexStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "language" TEXT,
ADD COLUMN     "lastAccessedAt" TIMESTAMP(3),
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "originalName" TEXT,
ADD COLUMN     "ownerId" TEXT,
ADD COLUMN     "pageCount" INTEGER,
ADD COLUMN     "parsingStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "processingStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "readingTime" INTEGER,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "uploadStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "versionNumber" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "wordCount" INTEGER;

-- AlterTable
ALTER TABLE "DocumentVersion" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "Tag" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecentDocument" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecentDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Favorite_userId_idx" ON "Favorite"("userId");

-- CreateIndex
CREATE INDEX "Favorite_entityId_entityType_idx" ON "Favorite"("entityId", "entityType");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_entityId_entityType_key" ON "Favorite"("userId", "entityId", "entityType");

-- CreateIndex
CREATE INDEX "RecentDocument_userId_lastAccessedAt_idx" ON "RecentDocument"("userId", "lastAccessedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "RecentDocument_userId_documentId_key" ON "RecentDocument"("userId", "documentId");

-- CreateIndex
CREATE INDEX "Document_folderId_idx" ON "Document"("folderId");

-- CreateIndex
CREATE INDEX "Document_ownerId_idx" ON "Document"("ownerId");

-- CreateIndex
CREATE INDEX "Document_fileType_idx" ON "Document"("fileType");

-- CreateIndex
CREATE INDEX "Document_createdAt_idx" ON "Document"("createdAt");

-- CreateIndex
CREATE INDEX "Document_deletedAt_idx" ON "Document"("deletedAt");

-- CreateIndex
CREATE INDEX "Tag_workspaceId_idx" ON "Tag"("workspaceId");

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecentDocument" ADD CONSTRAINT "RecentDocument_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecentDocument" ADD CONSTRAINT "RecentDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;
