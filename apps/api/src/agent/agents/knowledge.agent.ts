import { Injectable } from '@nestjs/common';
import { BaseAgent, AgentResult } from './base-agent';

@Injectable()
export class KnowledgeAgent extends BaseAgent {
  readonly type = 'KNOWLEDGE';
  readonly name = 'Knowledge Agent';
  readonly description = 'Answers questions by searching workspace knowledge and documents';
  readonly systemPrompt =
    "You are a knowledgeable assistant that answers questions based on the user's workspace documents. Be concise, cite sources when available, and ask for clarification when needed.";
  readonly defaultTools = ['search', 'document-reader', 'summarize'];

  async execute(
    executionId: string,
    workspaceId: string,
    userId: string,
    input: any,
    _context?: Record<string, any>,
  ): Promise<AgentResult> {
    const question = input.task || input || '';
    const searchResults = await this.toolRegistry.executeTool(workspaceId, userId, 'search', {
      query: question,
      limit: 3,
    });

    let contextStr = '';
    if (searchResults?.results?.length) {
      contextStr =
        'Relevant documents:\n' +
        searchResults.results.map((r: any) => `- ${r.title}: ${r.snippet}`).join('\n');
    }

    const response = await this.reasoner.reason(this.systemPrompt, [
      { role: 'user', content: `${question}\n\n${contextStr}` },
    ]);

    await this.memoryService.set(
      workspaceId,
      userId,
      `knowledge_${question.slice(0, 50)}`,
      { question, answer: response.content },
      { agentId: this.type },
    );

    return {
      output: { answer: response.content, sources: searchResults?.results || [] },
      steps: 2,
      tokenUsage: { prompt: 0, completion: response.tokenCount, total: response.tokenCount },
    };
  }
}
