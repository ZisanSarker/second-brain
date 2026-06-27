import { Injectable } from '@nestjs/common';

export interface OptimizedQuery {
  original: string;
  optimized: string;
  language?: string;
  isFollowUp: boolean;
}

@Injectable()
export class QueryOptimizerService {
  optimize(query: string, lastAssistantMessage?: string): OptimizedQuery {
    const trimmed = query.trim();
    if (!trimmed) {
      return { original: '', optimized: '', isFollowUp: false };
    }

    const isFollowUp = this.detectFollowUp(trimmed, lastAssistantMessage);

    return {
      original: trimmed,
      optimized: trimmed,
      language: this.detectLanguage(trimmed),
      isFollowUp,
    };
  }

  private detectFollowUp(query: string, lastAssistantMessage?: string): boolean {
    if (!lastAssistantMessage) return false;
    const followUpIndicators = [
      /^(and|but|so|then|also|what about|how about|tell me more|explain|why|how|when|where)\b/i,
      /^\b(it|this|that|they|them|those|these)\b/i,
      /^\b(can you|could you|would you|will you)\b/i,
    ];
    return followUpIndicators.some((re) => re.test(query));
  }

  private detectLanguage(text: string): string | undefined {
    const nonLatin = /[^\x00-\x7F]/;
    if (nonLatin.test(text)) {
      const cjk = /[\u4e00-\u9fff\u3400-\u4dbf]/;
      if (cjk.test(text)) return 'zh';
      const cyrillic = /[\u0400-\u04FF]/;
      if (cyrillic.test(text)) return 'ru';
      return undefined;
    }
    return 'en';
  }
}
