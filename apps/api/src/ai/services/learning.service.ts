import { Injectable } from '@nestjs/common';
import { AiGenerationBaseService } from './ai-generation.base';

@Injectable()
export class LearningService extends AiGenerationBaseService {
  readonly type = 'STUDY_PLAN' as const;

  private async generateByType(
    documentId: string | undefined,
    collectionId: string | undefined,
    type: string,
  ) {
    const ws = await this.resolveWorkspaceId(documentId, collectionId);
    const content = documentId
      ? await this.contentService.getDocumentContent(documentId)
      : collectionId
        ? await this.contentService.getCollectionContent(collectionId)
        : '';

    const { systemPrompt, userPrompt } = await this.promptBuilder.buildPrompt(ws, type, content);
    const result = await this.llmProvider.generateChat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    });
    return this.prisma.generatedContent.create({
      data: {
        workspaceId: ws,
        documentId: documentId || null,
        collectionId: collectionId || null,
        type: type as any,
        content: result.content,
        model: this.getDefaultModel(),
        tags: [],
      },
    });
  }

  async generateTakeaways(documentId?: string, collectionId?: string) {
    return this.generateByType(documentId, collectionId, 'TAKEAWAYS');
  }

  async generateGlossary(documentId?: string, collectionId?: string) {
    return this.generateByType(documentId, collectionId, 'GLOSSARY');
  }

  async generateFAQ(documentId?: string, collectionId?: string) {
    return this.generateByType(documentId, collectionId, 'FAQ');
  }

  async generateStudyPlan(documentId?: string, collectionId?: string) {
    return this.generateByType(documentId, collectionId, 'STUDY_PLAN');
  }

  async generateInterviewQuestions(documentId?: string, collectionId?: string) {
    return this.generateByType(documentId, collectionId, 'INTERVIEW_QUESTIONS');
  }

  async generateTimeline(documentId?: string, collectionId?: string) {
    return this.generateByType(documentId, collectionId, 'TIMELINE');
  }
}
