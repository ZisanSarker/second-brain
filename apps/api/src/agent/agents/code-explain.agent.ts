import { Injectable } from '@nestjs/common';
import { BaseAgent, AgentResult } from './base-agent';

@Injectable()
export class CodeExplainAgent extends BaseAgent {
  readonly type = 'CODE';
  readonly name = 'Code Explanation Agent';
  readonly description =
    'Explains code snippets and programming concepts using workspace knowledge';
  readonly systemPrompt =
    'You are a code explanation expert. Explain code clearly, highlight key concepts, and provide examples. Assume the user wants to learn.';
  readonly defaultTools = ['search', 'document-reader'];

  async execute(
    _executionId: string,
    workspaceId: string,
    userId: string,
    input: any,
    _context?: Record<string, any>,
  ): Promise<AgentResult> {
    const task = input.task || input || '';
    const response = await this.reasoner.reason(this.systemPrompt, [
      { role: 'user', content: task },
    ]);
    return {
      output: { explanation: response.content },
      steps: 1,
      tokenUsage: { prompt: 0, completion: response.tokenCount, total: response.tokenCount },
    };
  }
}
