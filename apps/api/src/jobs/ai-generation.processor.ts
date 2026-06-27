import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../shared/services/prisma.service';
import { AiService } from '../ai/ai.service';

interface GenerateSummaryJob {
  documentId: string;
  text: string;
}

interface GenerateTagsJob {
  documentId: string;
  text: string;
}

interface GenerateKeywordsJob {
  documentId: string;
  text: string;
}

@Processor('ai-generation')
export class AiGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(AiGenerationProcessor.name);

  constructor(
    private prisma: PrismaService,
    private ai: AiService,
  ) {
    super();
  }

  async process(
    job: Job<GenerateSummaryJob | GenerateTagsJob | GenerateKeywordsJob>,
  ): Promise<void> {
    switch (job.name) {
      case 'generate.summary':
        return this.generateSummary(job as Job<GenerateSummaryJob>);
      case 'generate.tags':
        return this.generateTags(job as Job<GenerateTagsJob>);
      case 'generate.keywords':
        return this.generateKeywords(job as Job<GenerateKeywordsJob>);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async generateSummary(job: Job<GenerateSummaryJob>) {
    const { documentId, text } = job.data;
    this.logger.log(`Generating summary for document ${documentId}`);

    try {
      const summary = await this.ai.generateSummary(text);

      await this.prisma.generatedContent.create({
        data: {
          documentId,
          type: 'SUMMARY',
          content: summary,
        },
      });

      await this.prisma.document.update({
        where: { id: documentId },
        data: { description: summary.slice(0, 500) },
      });

      this.logger.log(`Summary generated for document ${documentId}`);
    } catch (error) {
      this.logger.error(
        `Summary generation failed for ${documentId}: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  private async generateTags(job: Job<GenerateTagsJob>) {
    const { documentId, text } = job.data;
    this.logger.log(`Generating tags for document ${documentId}`);

    try {
      const tags = await this.ai.generateTags(text);

      await this.prisma.generatedContent.create({
        data: {
          documentId,
          type: 'TAGS',
          content: tags,
        },
      });

      this.logger.log(`Tags generated for document ${documentId}: ${tags.join(', ')}`);
    } catch (error) {
      this.logger.error(
        `Tag generation failed for ${documentId}: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  private async generateKeywords(job: Job<GenerateKeywordsJob>) {
    const { documentId, text } = job.data;
    this.logger.log(`Generating keywords for document ${documentId}`);

    try {
      const keywords = await this.ai.generateKeywords(text);

      await this.prisma.generatedContent.create({
        data: {
          documentId,
          type: 'KEYWORDS',
          content: keywords,
        },
      });

      this.logger.log(`Keywords generated for document ${documentId}: ${keywords.join(', ')}`);
    } catch (error) {
      this.logger.error(
        `Keyword generation failed for ${documentId}: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, error: Error) {
    this.logger.error(`AI generation job ${job.id} failed: ${error.message}`);
  }
}
