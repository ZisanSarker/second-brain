import { Observable } from 'rxjs';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatStreamOptions {
  messages: ChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
}

export interface ChatResponse {
  content: string;
  model: string;
  tokenCount: number;
}

export interface LlmProvider {
  generateChatStream(options: ChatStreamOptions): Observable<string>;
  generateChat(options: ChatStreamOptions): Promise<ChatResponse>;
}
