import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../shared/services/prisma.service';
import { AiService } from '../ai/ai.service';
import { SummaryService } from '../ai/services/summary.service';
import { FlashcardService } from '../ai/services/flashcard.service';
import { QuizService } from '../ai/services/quiz.service';
import { NotesService } from '../ai/services/notes.service';
import { TaskService } from '../ai/services/task.service';

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

interface GenerateContentJob {
  documentId: string;
  collectionId?: string;
  type: string;
  workspaceId: string;
  taskId: string;
  language?: string;
}

interface BatchGenerateJob {
  documentId: string;
  types: string[];
  workspaceId: string;
  parentTaskId: string;
}

@Processor('ai-generation')
export class AiGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(AiGenerationProcessor.name);

  constructor(
    private prisma: PrismaService,
    private ai: AiService,
    private summaryService: SummaryService,
    private flashcardService: FlashcardService,
    private quizService: QuizService,
    private notesService: NotesService,
    private taskService: TaskService,
  ) {
    super();
  }

  async process(
    job: Job<
      | GenerateSummaryJob
      | GenerateTagsJob
      | GenerateKeywordsJob
      | GenerateContentJob
      | BatchGenerateJob
    >,
  ): Promise<void> {
    switch (job.name) {
      case 'generate.summary':
        return this.generateSummary(job as Job<GenerateSummaryJob>);
      case 'generate.tags':
        return this.generateTags(job as Job<GenerateTagsJob>);
      case 'generate.keywords':
        return this.generateKeywords(job as Job<GenerateKeywordsJob>);
      case 'generate.content':
        return this.generateContent(job as Job<GenerateContentJob>);
      case 'generate.batch':
        return this.generateBatch(job as Job<BatchGenerateJob>);
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
        data: { documentId, type: 'SUMMARY', content: summary },
      });
      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          description: (summary as any).text?.slice(0, 500) || String(summary).slice(0, 500),
        },
      });
      this.logger.log(`Summary generated for document ${documentId}`);
    } catch (error) {
      this.handleError('summary', documentId, error);
    }
  }

  private async generateTags(job: Job<GenerateTagsJob>) {
    const { documentId, text } = job.data;
    this.logger.log(`Generating tags for document ${documentId}`);
    try {
      const tags = await this.ai.generateTags(text);
      await this.prisma.generatedContent.create({
        data: { documentId, type: 'TAGS', content: tags },
      });
      this.logger.log(`Tags generated for document ${documentId}`);
    } catch (error) {
      this.handleError('tags', documentId, error);
    }
  }

  private async generateKeywords(job: Job<GenerateKeywordsJob>) {
    const { documentId, text } = job.data;
    this.logger.log(`Generating keywords for document ${documentId}`);
    try {
      const keywords = await this.ai.generateKeywords(text);
      await this.prisma.generatedContent.create({
        data: { documentId, type: 'KEYWORDS', content: keywords },
      });
      this.logger.log(`Keywords generated for document ${documentId}`);
    } catch (error) {
      this.handleError('keywords', documentId, error);
    }
  }

  private async generateContent(job: Job<GenerateContentJob>) {
    await this.generateContentFromData(job.data);
  }

  private async generateContentFromData(data: GenerateContentJob) {
    const { documentId, collectionId, type, taskId, language } = data;
    this.logger.log(`Generating ${type} for document ${documentId || collectionId}`);

    await this.taskService.updateStatus(taskId, 'RUNNING');

    try {
      let result: any;
      switch (type) {
        case 'SUMMARY':
          result = await this.summaryService.generate(documentId, collectionId, undefined, {
            language,
          });
          break;
        case 'FLASHCARD':
          result = await this.flashcardService.generate(documentId, collectionId, undefined, {
            language,
          });
          break;
        case 'QUIZ':
          result = await this.quizService.generate(documentId, collectionId, undefined, {
            language,
          });
          break;
        case 'NOTES':
          result = await this.notesService.generate(documentId, collectionId, undefined, {
            language,
          });
          break;
        default:
          throw new Error(`Unsupported content type: ${type}`);
      }

      await this.taskService.setResult(taskId, result.id);
      this.logger.log(`${type} generated: ${result.id}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      await this.taskService.updateStatus(taskId, 'FAILED', msg);
      this.handleError(type, documentId || collectionId || '', error);
    }
  }

  private async generateBatch(job: Job<BatchGenerateJob>) {
    const { documentId, types, workspaceId, parentTaskId } = job.data;
    this.logger.log(`Batch generating ${types.join(', ')} for document ${documentId}`);

    for (const type of types) {
      const task = await this.taskService.create({
        workspaceId,
        type,
        documentId,
        parentTaskId,
      });
      await this.generateContentFromData({
        documentId,
        type,
        workspaceId,
        taskId: task.id,
      });
    }
  }

  private handleError(type: string, id: string, error: unknown) {
    const msg = error instanceof Error ? error.message : error;
    this.logger.error(`${type} generation failed for ${id}: ${msg}`);
    throw error;
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, error: Error) {
    this.logger.error(`AI generation job ${job.id} failed: ${error.message}`);
  }
}
