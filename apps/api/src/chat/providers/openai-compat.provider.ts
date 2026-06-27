import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, Subscriber } from 'rxjs';
import {
  LlmProvider,
  ChatStreamOptions,
  ChatResponse,
  ChatMessage,
} from './llm-provider.interface';

interface LlmChunk {
  choices?: Array<{
    delta?: { content?: string };
    finish_reason?: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
  error?: { message: string };
}

@Injectable()
export class OpenAiCompatProvider implements LlmProvider {
  private readonly logger = new Logger(OpenAiCompatProvider.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly defaultModel: string;

  constructor(private config: ConfigService) {
    this.baseUrl = this.config.get<string>('LLM_BASE_URL', 'https://openrouter.ai/api/v1');
    this.apiKey = this.config.get<string>('LLM_API_KEY', '');
    this.defaultModel = this.config.get<string>('LLM_MODEL', 'google/gemma-4-31b-it:free');
  }

  generateChatStream(options: ChatStreamOptions): Observable<string> {
    return new Observable<string>((subscriber: Subscriber<string>) => {
      const controller = new AbortController();
      const signal = options.signal;

      if (signal) {
        signal.addEventListener('abort', () => controller.abort());
      }

      const model = options.model || this.defaultModel;

      this.fetchStream(subscriber, controller.signal, model, options).catch((err) => {
        if (err.name === 'AbortError') {
          subscriber.complete();
        } else {
          this.logger.error(`Stream error: ${err.message}`, err.stack);
          subscriber.error(err);
        }
      });

      return () => {
        controller.abort();
      };
    });
  }

  async generateChat(options: ChatStreamOptions): Promise<ChatResponse> {
    const model = options.model || this.defaultModel;
    const messages = this.buildMessages(options);

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
        stream: false,
      }),
      signal: options.signal,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`LLM request failed (${res.status}): ${err}`);
    }

    const data = await res.json();
    return {
      content: data.choices?.[0]?.message?.content?.trim() || '',
      model: data.model || model,
      tokenCount: data.usage?.completion_tokens || 0,
    };
  }

  private async fetchStream(
    subscriber: Subscriber<string>,
    signal: AbortSignal,
    model: string,
    options: ChatStreamOptions,
  ): Promise<void> {
    const messages = this.buildMessages(options);

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
        stream: true,
      }),
      signal,
    });

    if (!res.ok) {
      const err = await res.text();
      subscriber.error(new Error(`LLM stream failed (${res.status}): ${err}`));
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      subscriber.error(new Error('No response body'));
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const jsonStr = trimmed.slice(6);
          if (jsonStr === '[DONE]') {
            subscriber.complete();
            return;
          }

          try {
            const chunk: LlmChunk = JSON.parse(jsonStr);
            if (chunk.error) {
              subscriber.error(new Error(chunk.error.message));
              return;
            }
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) {
              subscriber.next(content);
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }
      subscriber.complete();
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        subscriber.error(err);
      } else {
        subscriber.complete();
      }
    }
  }

  private buildMessages(options: ChatStreamOptions): ChatMessage[] {
    return options.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
  }
}
