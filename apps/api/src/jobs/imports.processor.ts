import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../shared/services/prisma.service';
import { AiService } from '../ai/ai.service';
import { QueueService } from './queue.service';

interface WebsiteImportJob {
  workspaceId: string;
  userId: string;
  url: string;
  collectionId?: string;
  folderId?: string;
}

interface GitHubImportJob {
  workspaceId: string;
  userId: string;
  repository: string;
  branch: string;
  accessToken?: string;
  collectionId?: string;
  folderId?: string;
}

interface YouTubeImportJob {
  workspaceId: string;
  userId: string;
  videoId: string;
  languages?: string[];
  collectionId?: string;
  folderId?: string;
}

@Processor('imports')
export class ImportsProcessor extends WorkerHost {
  private readonly logger = new Logger(ImportsProcessor.name);

  constructor(
    private prisma: PrismaService,
    private ai: AiService,
    private queue: QueueService,
  ) {
    super();
  }

  async process(job: Job<WebsiteImportJob | GitHubImportJob | YouTubeImportJob>): Promise<void> {
    switch (job.name) {
      case 'import.website':
        return this.processWebsite(job as Job<WebsiteImportJob>);
      case 'import.github':
        return this.processGitHub(job as Job<GitHubImportJob>);
      case 'import.youtube':
        return this.processYouTube(job as Job<YouTubeImportJob>);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async processWebsite(job: Job<WebsiteImportJob>) {
    const { workspaceId, userId, url, collectionId, folderId } = job.data;
    this.logger.log(`Importing website: ${url}`);

    try {
      const { text, metadata } = await this.ai.extractWebsite(url);
      const title = (metadata.title as string) || new URL(url).hostname;

      const doc = await this.prisma.document.create({
        data: {
          workspaceId,
          ownerId: userId,
          title,
          originalName: title,
          fileType: 'markdown',
          mimeType: 'text/markdown',
          fileSize: BigInt(text.length),
          uploadStatus: 'IMPORTED',
          versionNumber: 1,
          sourceType: 'FILE' as any,
          status: 'PROCESSING',
          processingStatus: 'PENDING',
          source: url,
          importedFrom: 'website',
          collectionId,
          folderId,
          versions: {
            create: {
              versionNumber: 1,
              storageKey: '',
              fileName: title,
              fileSize: BigInt(text.length),
              mimeType: 'text/markdown',
              checksum: '',
              metadata: { sourceUrl: url, importedFrom: 'website' },
            },
          },
        },
      });

      await this.queue.enqueueProcessDocument(doc.id, workspaceId, doc.versionNumber.toString());
      this.logger.log(`Website import created document ${doc.id}`);
    } catch (error) {
      this.logger.error(
        `Website import failed for ${url}: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  private async processGitHub(job: Job<GitHubImportJob>) {
    const { workspaceId, userId, repository, branch, accessToken, collectionId, folderId } =
      job.data;
    this.logger.log(`Importing GitHub repo: ${repository}`);

    try {
      const [owner, repo] = repository.replace('https://github.com/', '').split('/');
      const { text, metadata } = await this.ai.extractGitHub(owner, repo, '', branch, accessToken);
      const title = `${owner}/${repo}`;
      const fileCount = (metadata.file_count as number) || 1;

      const doc = await this.prisma.document.create({
        data: {
          workspaceId,
          ownerId: userId,
          title,
          originalName: title,
          fileType: 'markdown',
          mimeType: 'text/markdown',
          fileSize: BigInt(text.length),
          uploadStatus: 'IMPORTED',
          versionNumber: 1,
          sourceType: 'FILE' as any,
          status: 'PROCESSING',
          processingStatus: 'PENDING',
          source: repository,
          importedFrom: 'github',
          collectionId,
          folderId,
          pageCount: fileCount,
          versions: {
            create: {
              versionNumber: 1,
              storageKey: '',
              fileName: title,
              fileSize: BigInt(text.length),
              mimeType: 'text/markdown',
              checksum: '',
              metadata: { repository, branch, fileCount, importedFrom: 'github' },
            },
          },
        },
      });

      await this.queue.enqueueProcessDocument(doc.id, workspaceId, doc.versionNumber.toString());
      this.logger.log(`GitHub import created document ${doc.id}`);
    } catch (error) {
      this.logger.error(
        `GitHub import failed for ${repository}: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  private async processYouTube(job: Job<YouTubeImportJob>) {
    const { workspaceId, userId, videoId, languages, collectionId, folderId } = job.data;
    this.logger.log(`Importing YouTube video: ${videoId}`);

    try {
      const { text, metadata } = await this.ai.extractYouTube(videoId, languages);
      const title = `YouTube - ${videoId}`;
      const language = (metadata.language_code as string) || 'en';

      const doc = await this.prisma.document.create({
        data: {
          workspaceId,
          ownerId: userId,
          title,
          originalName: title,
          fileType: 'txt',
          mimeType: 'text/plain',
          fileSize: BigInt(text.length),
          uploadStatus: 'IMPORTED',
          versionNumber: 1,
          sourceType: 'FILE' as any,
          status: 'PROCESSING',
          processingStatus: 'PENDING',
          source: `https://youtube.com/watch?v=${videoId}`,
          importedFrom: 'youtube',
          language,
          collectionId,
          folderId,
          versions: {
            create: {
              versionNumber: 1,
              storageKey: '',
              fileName: title,
              fileSize: BigInt(text.length),
              mimeType: 'text/plain',
              checksum: '',
              metadata: { videoId, language, importedFrom: 'youtube' },
            },
          },
        },
      });

      await this.queue.enqueueProcessDocument(doc.id, workspaceId, doc.versionNumber.toString());
      this.logger.log(`YouTube import created document ${doc.id}`);
    } catch (error) {
      this.logger.error(
        `YouTube import failed for ${videoId}: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, error: Error) {
    this.logger.error(`Import job ${job.id} failed: ${error.message}`);
  }
}
