import { Injectable } from '@nestjs/common';
import { BaseAgent, AgentResult } from './base-agent';

@Injectable()
export class DocumentationAgent extends BaseAgent {
  readonly type = 'DOCUMENTATION';
  readonly name = 'Documentation Agent';
  readonly description =
    'Generates documentation, guides, and technical writing from code and content';
  readonly systemPrompt =
    'You are a documentation specialist. Create clear, well-structured documentation from source material. Use Markdown formatting and organize content logically.';
  readonly defaultTools = ['document-reader', 'search', 'summarize'];

  async execute(
    executionId: string,
    workspaceId: string,
    userId: string,
    input: any,
    context?: Record<string, any>,
  ): Promise<AgentResult> {
    const task = input.task || input || '';
    let sourceContent = '';

    if (context?.documentId) {
      const doc = await this.toolRegistry.executeTool(workspaceId, userId, 'document-reader', {
        documentId: context.documentId,
      });
      sourceContent = doc.content || '';
    }

    const response = await this.reasoner.reason(this.systemPrompt, [
      {
        role: 'user',
        content: `Create documentation for: ${task}\n\nSource material: ${sourceContent || 'No specific document provided'}`,
      },
    ]);

    return {
      output: { documentation: response.content },
      steps: 1,
      tokenUsage: { prompt: 0, completion: response.tokenCount, total: response.tokenCount },
    };
  }
}
