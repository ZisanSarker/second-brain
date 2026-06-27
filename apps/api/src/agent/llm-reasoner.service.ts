import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenRouterProvider } from '../chat/providers/openrouter.provider';
import { MemoryService } from './memory.service';
import { ChatMessage } from '../chat/providers/llm-provider.interface';

@Injectable()
export class LlmReasonerService {
  constructor(
    private llmProvider: OpenRouterProvider,
    private memoryService: MemoryService,
    private config: ConfigService,
  ) {}

  async reason(
    systemPrompt: string,
    messages: { role: string; content: string }[],
    options?: { model?: string; temperature?: number; maxTokens?: number },
  ): Promise<{ content: string; tokenCount: number }> {
    const chatMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    ];

    const result = await this.llmProvider.generateChat({
      messages: chatMessages,
      model:
        options?.model || this.config.get<string>('OPENROUTER_MODEL', 'google/gemma-4-31b-it:free'),
      temperature: options?.temperature ?? 0.7,
      maxTokens: options?.maxTokens ?? 4096,
    });

    return { content: result.content, tokenCount: result.tokenCount };
  }

  async reasonWithContext(
    workspaceId: string,
    userId: string,
    systemPrompt: string,
    userMessage: string,
    agentId?: string,
  ): Promise<{ content: string; tokenCount: number }> {
    const memories = await this.memoryService.getRelevant(
      workspaceId,
      userId,
      agentId,
      userMessage,
    );
    const contextStr =
      memories.length > 0
        ? `\n\nRelevant context from memory:\n${memories.map((m) => `- ${m.key}: ${JSON.stringify(m.value)}`).join('\n')}`
        : '';

    return this.reason(systemPrompt, [{ role: 'user', content: userMessage + contextStr }]);
  }
}
