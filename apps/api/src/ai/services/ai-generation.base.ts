import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenRouterProvider } from '../../chat/providers/openrouter.provider';
import { PrismaService } from '../../shared/services/prisma.service';
import { ContentService } from './content.service';
import { AiPromptBuilderService } from './ai-prompt-builder.service';
import { TaskService } from './task.service';
import { GeneratedContentType } from '@prisma/client';
import { ChatMessage } from '../../chat/providers/llm-provider.interface';

@Injectable()
export abstract class AiGenerationBaseService {
  constructor(
    protected readonly llmProvider: OpenRouterProvider,
    protected readonly prisma: PrismaService,
    protected readonly contentService: ContentService,
    protected readonly promptBuilder: AiPromptBuilderService,
    protected readonly taskService: TaskService,
    protected readonly config: ConfigService,
  ) {}

  protected getDefaultModel(): string {
    return this.config.get<string>('OPENROUTER_MODEL', 'google/gemma-4-31b-it:free');
  }

  abstract readonly type: GeneratedContentType;

  async generate(
    documentId?: string,
    collectionId?: string,
    customPrompt?: string,
    options?: { language?: string; model?: string },
  ): Promise<any> {
    const workspaceId = await this.resolveWorkspaceId(documentId, collectionId);
    const content = documentId
      ? await this.contentService.getDocumentContent(documentId)
      : collectionId
        ? await this.contentService.getCollectionContent(collectionId)
        : '';
    if (!content) throw new Error('No content to process');

    const { systemPrompt, userPrompt } = await this.promptBuilder.buildPrompt(
      workspaceId,
      this.type,
      content,
      options?.language,
    );
    const finalUserPrompt = customPrompt || userPrompt;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: finalUserPrompt },
    ];

    const model = options?.model || this.getDefaultModel();

    const result = await this.llmProvider.generateChat({
      messages,
      model,
    });

    const parsed = this.tryParseJson(result.content);

    return this.prisma.generatedContent.create({
      data: {
        workspaceId,
        documentId: documentId || null,
        collectionId: collectionId || null,
        type: this.type,
        content: parsed,
        model,
        tags: [],
      },
    });
  }

  protected async resolveWorkspaceId(documentId?: string, collectionId?: string): Promise<string> {
    if (documentId) {
      const doc = await this.prisma.document.findUnique({
        where: { id: documentId },
        select: { workspaceId: true },
      });
      if (!doc) throw new Error('Document not found');
      return doc.workspaceId;
    }
    if (collectionId) {
      const coll = await this.prisma.collection.findUnique({
        where: { id: collectionId },
        select: { workspaceId: true },
      });
      if (!coll) throw new Error('Collection not found');
      return coll.workspaceId;
    }
    throw new Error('Either documentId or collectionId is required');
  }

  private tryParseJson(str: string): any {
    try {
      return JSON.parse(str);
    } catch {
      return { text: str };
    }
  }

  async list(documentId?: string, collectionId?: string, workspaceId?: string) {
    const where: any = { type: this.type };
    if (documentId) where.documentId = documentId;
    if (collectionId) where.collectionId = collectionId;
    if (workspaceId) where.workspaceId = workspaceId;
    return this.prisma.generatedContent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getById(id: string) {
    return this.prisma.generatedContent.findUnique({ where: { id } });
  }

  async delete(id: string) {
    await this.prisma.generatedContent.delete({ where: { id } });
  }
}
