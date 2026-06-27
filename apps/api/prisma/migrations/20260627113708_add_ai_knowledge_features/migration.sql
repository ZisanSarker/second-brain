/*
  Warnings:

  - Added the required column `updatedAt` to the `GeneratedContent` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AiTaskStatus" AS ENUM ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "GeneratedContentType" ADD VALUE 'COMPARISON';
ALTER TYPE "GeneratedContentType" ADD VALUE 'TRANSLATION';
ALTER TYPE "GeneratedContentType" ADD VALUE 'ELI5';
ALTER TYPE "GeneratedContentType" ADD VALUE 'TAKEAWAYS';
ALTER TYPE "GeneratedContentType" ADD VALUE 'ACTION_ITEMS';
ALTER TYPE "GeneratedContentType" ADD VALUE 'TIMELINE';
ALTER TYPE "GeneratedContentType" ADD VALUE 'GLOSSARY';
ALTER TYPE "GeneratedContentType" ADD VALUE 'FAQ';
ALTER TYPE "GeneratedContentType" ADD VALUE 'STUDY_PLAN';
ALTER TYPE "GeneratedContentType" ADD VALUE 'INTERVIEW_QUESTIONS';

-- AlterTable
ALTER TABLE "GeneratedContent" ADD COLUMN     "collectionId" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "title" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "workspaceId" TEXT,
ALTER COLUMN "documentId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "AiTemplate" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "userPrompt" TEXT,
    "outputSchema" JSONB,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiTask" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "parentTaskId" TEXT,
    "documentId" TEXT,
    "collectionId" TEXT,
    "type" TEXT NOT NULL,
    "status" "AiTaskStatus" NOT NULL DEFAULT 'QUEUED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "resultId" TEXT,
    "errorMessage" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiTemplate_workspaceId_type_idx" ON "AiTemplate"("workspaceId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "AiTemplate_workspaceId_name_key" ON "AiTemplate"("workspaceId", "name");

-- CreateIndex
CREATE INDEX "AiTask_workspaceId_status_idx" ON "AiTask"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "AiTask_workspaceId_createdAt_idx" ON "AiTask"("workspaceId", "createdAt");

-- CreateIndex
CREATE INDEX "GeneratedContent_workspaceId_type_idx" ON "GeneratedContent"("workspaceId", "type");

-- CreateIndex
CREATE INDEX "GeneratedContent_collectionId_type_idx" ON "GeneratedContent"("collectionId", "type");

-- AddForeignKey
ALTER TABLE "GeneratedContent" ADD CONSTRAINT "GeneratedContent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedContent" ADD CONSTRAINT "GeneratedContent_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiTemplate" ADD CONSTRAINT "AiTemplate_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiTask" ADD CONSTRAINT "AiTask_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiTask" ADD CONSTRAINT "AiTask_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "AiTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;
