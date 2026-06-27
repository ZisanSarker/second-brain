import { Injectable } from '@nestjs/common';
import { AiGenerationBaseService } from './ai-generation.base';

@Injectable()
export class InsightsService extends AiGenerationBaseService {
  readonly type = 'SUMMARY' as const;

  async generateCrossDocumentInsights(documentIds: string[]) {
    const contents = await Promise.all(
      documentIds.map((id) => this.contentService.getDocumentContent(id)),
    );
    const combined = contents.join('\n\n---\n\n');
    const doc = await this.contentService.getDocumentMetadata(documentIds[0]);
    if (!doc) throw new Error('No documents found');

    const ws = (await this.prisma.document.findUnique({
      where: { id: documentIds[0] },
      select: { workspaceId: true },
    }))!.workspaceId;

    const { systemPrompt, userPrompt } = await this.promptBuilder.buildPrompt(
      ws,
      'SUMMARY',
      combined,
    );
    const insightPrompt = `${systemPrompt}\n\nFocus on:\n1. Common themes across documents\n2. Contradictions or different perspectives\n3. Key insights that emerge from synthesizing multiple sources\n4. Gaps in coverage`;

    const result = await this.llmProvider.generateChat({
      messages: [
        { role: 'system', content: insightPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    return this.prisma.generatedContent.create({
      data: {
        workspaceId: ws,
        type: 'SUMMARY',
        content: { text: result.content, type: 'cross_document_insights', documentIds },
        model: this.getDefaultModel(),
        tags: ['cross-document', 'insights'],
      },
    });
  }

  async generateWorkspaceTrends(workspaceId: string) {
    const recentDocs = await this.prisma.document.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { title: true, tags: true, createdAt: true },
    });

    const titles = recentDocs.map((d) => d.title).join('\n');
    const { systemPrompt, userPrompt } = await this.promptBuilder.buildPrompt(
      workspaceId,
      'SUMMARY',
      titles,
    );
    const trendPrompt = `${systemPrompt}\n\nAnalyze the following document titles and their topics. Identify:\n1. Main topics the user is focusing on\n2. Patterns in their research/knowledge gathering\n3. Suggestions for related topics they might explore\n4. Any notable shifts in focus over time`;

    const result = await this.llmProvider.generateChat({
      messages: [
        { role: 'system', content: trendPrompt },
        { role: 'user', content: userPrompt },
      ],
    });

    return this.prisma.generatedContent.create({
      data: {
        workspaceId,
        type: 'SUMMARY',
        content: { text: result.content, type: 'workspace_trends' },
        model: this.getDefaultModel(),
        tags: ['trends', 'workspace-analysis'],
      },
    });
  }
}
