import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../shared/services/prisma.service';
import { StorageService } from '../shared/services/storage.service';
import { AiService } from '../ai/ai.service';
import { QueueService } from './queue.service';

interface ProcessDocumentJob {
  documentId: string;
  workspaceId: string;
  versionId: string;
}

@Processor('documents')
export class DocumentProcessingProcessor extends WorkerHost {
  private readonly logger = new Logger(DocumentProcessingProcessor.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private ai: AiService,
    private queue: QueueService,
  ) {
    super();
  }

  async process(job: Job<ProcessDocumentJob>): Promise<void> {
    const { documentId, workspaceId, versionId } = job.data;
    this.logger.log(`Processing document ${documentId} (job ${job.id})`);

    await this.prisma.document.update({
      where: { id: documentId },
      data: { processingStatus: 'PROCESSING' },
    });

    await this.upsertBackgroundJob(workspaceId, 'document.process', 'ACTIVE');

    try {
      const doc = await this.prisma.document.findUniqueOrThrow({
        where: { id: documentId },
        include: { tags: { select: { name: true } } },
      });
      const version = await this.prisma.documentVersion.findUniqueOrThrow({
        where: { id: versionId },
      });

      // Step 1: Extract text
      await this.prisma.document.update({
        where: { id: documentId },
        data: { parsingStatus: 'PROCESSING' },
      });

      const fileBuffer = await this.storage.getObject(version.storageKey);
      const fileType = doc.fileType || 'txt';
      const { text: extractedText } = await this.ai.extract(fileType, fileBuffer);

      // Step 2: Normalize
      const normalizedText = await this.ai.normalize(extractedText);

      // Step 3: Chunk
      const { chunks } = await this.ai.chunk(normalizedText);
      this.logger.log(`Document ${documentId}: ${chunks.length} chunks created`);

      // Step 4: Save chunks to database
      for (const chunk of chunks) {
        await this.prisma.documentChunk.create({
          data: {
            versionId,
            chunkIndex: chunk.index,
            pageNumber: chunk.page_number ?? null,
            content: chunk.content,
            charStart: 0,
            charEnd: chunk.content.length,
            metadata: {},
          },
        });
      }

      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          parsingStatus: 'COMPLETED',
          wordCount: extractedText.split(/\s+/).length,
          pageCount: doc.pageCount ?? chunks.length,
        },
      });

      // Step 5: Embed
      await this.prisma.document.update({
        where: { id: documentId },
        data: { embeddingStatus: 'PROCESSING' },
      });

      const texts = chunks.map((c) => c.content);
      const { embeddings } = await this.ai.embedBatch(texts);

      // Step 6: Upsert to Qdrant
      const tagNames = doc.tags?.map((t: any) => t.name) ?? [];
      await this.ai.upsertChunks(
        workspaceId,
        documentId,
        versionId,
        chunks,
        embeddings,
        tagNames,
        doc.language ?? undefined,
      );

      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          embeddingStatus: 'COMPLETED',
          indexStatus: 'COMPLETED',
          processingStatus: 'COMPLETED',
          status: 'READY',
        },
      });

      await this.upsertBackgroundJob(workspaceId, 'document.process', 'COMPLETED', undefined);

      // Step 7: Enqueue metadata generation
      await this.queue.enqueueGenerateSummary(documentId, extractedText);
      await this.queue.enqueueGenerateTags(documentId, extractedText);
      await this.queue.enqueueGenerateKeywords(documentId, extractedText);

      this.logger.log(`Document ${documentId} processed successfully`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to process document ${documentId}: ${message}`);

      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          processingStatus: 'FAILED',
          parsingStatus: 'FAILED',
          embeddingStatus: 'FAILED',
          indexStatus: 'FAILED',
        },
      });

      await this.upsertBackgroundJob(workspaceId, 'document.process', 'FAILED', message);
      throw error;
    }
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<ProcessDocumentJob>, error: Error) {
    this.logger.error(`Job ${job.id} for document ${job.data.documentId} failed: ${error.message}`);
  }

  private async upsertBackgroundJob(
    workspaceId: string,
    jobType: string,
    status: string,
    errorMessage?: string,
  ) {
    try {
      const existing = await this.prisma.backgroundJob.findFirst({
        where: { workspaceId, jobType },
        orderBy: { createdAt: 'desc' },
      });

      if (existing && existing.status === 'ACTIVE') {
        await this.prisma.backgroundJob.update({
          where: { id: existing.id },
          data: {
            status: status as any,
            errorMessage,
            meta: { updatedAt: new Date().toISOString() },
          },
        });
      } else {
        await this.prisma.backgroundJob.create({
          data: {
            workspaceId,
            jobType,
            status: status as any,
            errorMessage,
            meta: {},
          },
        });
      }
    } catch (e) {
      this.logger.warn(`Failed to upsert background job record: ${e}`);
    }
  }
}
