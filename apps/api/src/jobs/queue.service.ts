import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('documents') private documentsQueue: Queue,
    @InjectQueue('imports') private importsQueue: Queue,
    @InjectQueue('ai-generation') private aiGenerationQueue: Queue,
  ) {}

  // ── Document Processing ──────────────────────────────────────────────

  async enqueueProcessDocument(
    documentId: string,
    workspaceId: string,
    versionId: string,
  ): Promise<string> {
    const job = await this.documentsQueue.add(
      'document.process',
      {
        documentId,
        workspaceId,
        versionId,
      },
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 30000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );
    this.logger.log(`Enqueued document.process job ${job.id} for document ${documentId}`);
    return job.id ?? '';
  }

  async enqueueReprocessDocument(documentId: string, workspaceId: string): Promise<string> {
    const job = await this.documentsQueue.add(
      'document.reprocess',
      {
        documentId,
        workspaceId,
      },
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 30000 },
      },
    );
    this.logger.log(`Enqueued document.reprocess job ${job.id} for document ${documentId}`);
    return job.id ?? '';
  }

  async enqueueDeleteVectors(documentId: string): Promise<string> {
    const job = await this.documentsQueue.add(
      'document.delete-vectors',
      {
        documentId,
      },
      { attempts: 3, backoff: { type: 'fixed', delay: 5000 } },
    );
    return job.id ?? '';
  }

  // ── Imports ──────────────────────────────────────────────────────────

  async enqueueWebsiteImport(
    workspaceId: string,
    userId: string,
    url: string,
    collectionId?: string,
    folderId?: string,
  ): Promise<string> {
    const job = await this.importsQueue.add(
      'import.website',
      {
        workspaceId,
        userId,
        url,
        collectionId,
        folderId,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 10000 },
      },
    );
    this.logger.log(`Enqueued import.website job ${job.id} for ${url}`);
    return job.id ?? '';
  }

  async enqueueGitHubImport(
    workspaceId: string,
    userId: string,
    repository: string,
    branch = 'main',
    accessToken?: string,
    collectionId?: string,
    folderId?: string,
  ): Promise<string> {
    const job = await this.importsQueue.add(
      'import.github',
      {
        workspaceId,
        userId,
        repository,
        branch,
        accessToken,
        collectionId,
        folderId,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 10000 },
      },
    );
    this.logger.log(`Enqueued import.github job ${job.id} for ${repository}`);
    return job.id ?? '';
  }

  async enqueueYouTubeImport(
    workspaceId: string,
    userId: string,
    videoId: string,
    languages?: string[],
    collectionId?: string,
    folderId?: string,
  ): Promise<string> {
    const job = await this.importsQueue.add(
      'import.youtube',
      {
        workspaceId,
        userId,
        videoId,
        languages,
        collectionId,
        folderId,
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 10000 },
      },
    );
    this.logger.log(`Enqueued import.youtube job ${job.id} for video ${videoId}`);
    return job.id ?? '';
  }

  // ── AI Generation ────────────────────────────────────────────────────

  async enqueueGenerateSummary(documentId: string, text: string): Promise<string> {
    const job = await this.aiGenerationQueue.add(
      'generate.summary',
      {
        documentId,
        text: text.slice(0, 8000),
      },
      {
        attempts: 2,
        backoff: { type: 'fixed', delay: 10000 },
      },
    );
    return job.id ?? '';
  }

  async enqueueGenerateTags(documentId: string, text: string): Promise<string> {
    const job = await this.aiGenerationQueue.add(
      'generate.tags',
      {
        documentId,
        text: text.slice(0, 4000),
      },
      { attempts: 2, backoff: { type: 'fixed', delay: 10000 } },
    );
    return job.id ?? '';
  }

  async enqueueGenerateKeywords(documentId: string, text: string): Promise<string> {
    const job = await this.aiGenerationQueue.add(
      'generate.keywords',
      {
        documentId,
        text: text.slice(0, 4000),
      },
      { attempts: 2, backoff: { type: 'fixed', delay: 10000 } },
    );
    return job.id ?? '';
  }
}
