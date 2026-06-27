import { Injectable } from '@nestjs/common';
import { BaseAgent, AgentResult } from './base-agent';
import { OpenRouterProvider } from '../../chat/providers/openrouter.provider';
import { ToolRegistry } from '../tools/tool-registry';
import { ExecutionService } from '../execution.service';
import { MemoryService } from '../memory.service';
import { LlmReasonerService } from '../llm-reasoner.service';

@Injectable()
export class WritingAgent extends BaseAgent {
  readonly type = 'WRITING';
  readonly name = 'Writing Assistant';
  readonly description = 'Helps write, edit, and improve text content using workspace knowledge';
  readonly systemPrompt =
    "You are a writing assistant. Help users write, edit, and improve content. Adapt your tone and style to the user's needs.";
  readonly defaultTools = ['search', 'document-reader'];

  async execute(
    executionId: string,
    workspaceId: string,
    userId: string,
    input: any,
    context?: Record<string, any>,
  ): Promise<AgentResult> {
    const task = input.task || input || '';
    const response = await this.reasoner.reason(this.systemPrompt, [
      { role: 'user', content: task },
    ]);
    return {
      output: { content: response.content },
      steps: 1,
      tokenUsage: { prompt: 0, completion: response.tokenCount, total: response.tokenCount },
    };
  }
}
