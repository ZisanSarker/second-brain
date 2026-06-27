import { Injectable } from '@nestjs/common';
import { BaseAgent, AgentResult } from './base-agent';

@Injectable()
export class ResearchAgent extends BaseAgent {
  readonly type = 'RESEARCH';
  readonly name = 'Research Agent';
  readonly description =
    'Deep research on topics using multiple documents and generating comprehensive analysis';
  readonly systemPrompt =
    'You are a research assistant that performs deep analysis across documents. Search broadly, read deeply, and synthesize findings into comprehensive research reports.';
  readonly defaultTools = ['search', 'document-reader', 'summarize', 'compare'];

  async execute(
    executionId: string,
    workspaceId: string,
    userId: string,
    input: any,
    _context?: Record<string, any>,
  ): Promise<AgentResult> {
    const topic = input.task || input || '';
    const searchResults = await this.toolRegistry.executeTool(workspaceId, userId, 'search', {
      query: topic,
      limit: 5,
    });
    const docs = searchResults?.results || [];

    let fullContent = '';
    for (const doc of docs.slice(0, 3)) {
      try {
        const docContent = await this.toolRegistry.executeTool(
          workspaceId,
          userId,
          'document-reader',
          { documentId: doc.id },
        );
        fullContent += `\n\n## ${doc.title}\n${docContent.content?.slice(0, 3000)}`;
      } catch {}
    }

    const response = await this.reasoner.reason(
      `${this.systemPrompt}\n\nProduce a well-structured research report with sections.`,
      [{ role: 'user', content: `Research topic: ${topic}\n\nSource material:${fullContent}` }],
    );

    return {
      output: { report: response.content, sources: docs },
      steps: 3,
      tokenUsage: { prompt: 0, completion: response.tokenCount, total: response.tokenCount },
    };
  }
}
