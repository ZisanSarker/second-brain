import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { ChatMessage } from '../providers/llm-provider.interface';
import { ContextResult } from './context-builder.service';

const DEFAULT_SYSTEM_PROMPT = `You are Second Brain, an AI assistant that answers questions based on the user's knowledge base.

Guidelines:
1. Answer using the provided context. If the context doesn't contain relevant information, say so.
2. Always cite your sources by referring to them by name, page number, or section.
3. Use markdown formatting for clarity (headings, lists, code blocks).
4. Be concise but thorough.
5. If asked about something outside the knowledge base, explain what you can and cannot answer.
6. Do not make up information or sources.`;

const MAX_HISTORY_TOKENS = 2000;
const TOKENS_PER_CHAR = 0.25;

@Injectable()
export class PromptBuilderService {
  constructor(private prisma: PrismaService) {}

  async buildChatPrompt(params: {
    workspaceId: string;
    question: string;
    context: ContextResult;
    conversationId?: string;
    systemPromptId?: string;
  }): Promise<ChatMessage[]> {
    const systemContent = await this.getSystemPrompt(params.workspaceId, params.systemPromptId);
    const history = params.conversationId
      ? await this.getHistory(params.conversationId, params.context.totalTokens)
      : [];

    const messages: ChatMessage[] = [{ role: 'system', content: systemContent }];

    if (params.context.context) {
      messages.push({
        role: 'system',
        content: `Here is the relevant knowledge base context to answer the question:\n\n${params.context.context}`,
      });
    }

    messages.push(...history);

    messages.push({
      role: 'user',
      content: params.question,
    });

    return messages;
  }

  private async getSystemPrompt(workspaceId: string, systemPromptId?: string): Promise<string> {
    if (systemPromptId) {
      const prompt = await this.prisma.systemPrompt.findFirst({
        where: { id: systemPromptId, workspaceId },
      });
      if (prompt) return prompt.content;
    }

    const defaultPrompt = await this.prisma.systemPrompt.findFirst({
      where: { workspaceId, isDefault: true },
    });
    if (defaultPrompt) return defaultPrompt.content;

    const wsSettings = await this.prisma.workspaceSettings.findUnique({
      where: { workspaceId },
    });

    if (
      wsSettings?.preferences &&
      (wsSettings.preferences as Record<string, unknown>)?.systemPrompt
    ) {
      return (wsSettings.preferences as Record<string, unknown>).systemPrompt as string;
    }

    return DEFAULT_SYSTEM_PROMPT;
  }

  private async getHistory(conversationId: string, contextTokens: number): Promise<ChatMessage[]> {
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    messages.reverse();

    const history: ChatMessage[] = [];
    let tokens = 0;

    for (const msg of messages) {
      const estimatedTokens = Math.ceil(msg.content.length * TOKENS_PER_CHAR) + 4;
      if (tokens + estimatedTokens > MAX_HISTORY_TOKENS) break;
      tokens += estimatedTokens;
      history.push({ role: msg.role as 'user' | 'assistant', content: msg.content });
    }

    return history;
  }
}
