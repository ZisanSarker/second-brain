import { Injectable } from '@nestjs/common';
import { BaseAgent, AgentResult } from './base-agent';
import { OpenRouterProvider } from '../../chat/providers/openrouter.provider';
import { ToolRegistry } from '../tools/tool-registry';
import { ExecutionService } from '../execution.service';
import { MemoryService } from '../memory.service';
import { LlmReasonerService } from '../llm-reasoner.service';

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
      output: { explanation: response.content },
      steps: 1,
      tokenUsage: { prompt: 0, completion: response.tokenCount, total: response.tokenCount },
    };
  }
}
