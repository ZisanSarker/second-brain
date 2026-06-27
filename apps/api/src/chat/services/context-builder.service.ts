import { Injectable } from '@nestjs/common';
import { SearchService } from '../../search/search.service';
import { CitationInput } from './citation.service';

export interface ContextResult {
  context: string;
  citations: CitationInput[];
  totalTokens: number;
  chunkCount: number;
}

@Injectable()
export class ContextBuilderService {
  private readonly maxContextTokens = 3000;
  private readonly tokensPerChar = 0.25;

  constructor(private searchService: SearchService) {}

  async buildContext(
    workspaceId: string,
    userId: string,
    query: string,
    maxTokens = this.maxContextTokens,
  ): Promise<ContextResult> {
    const results = await this.searchService.search(workspaceId, userId, {
      query,
      mode: 'hybrid' as any,
      limit: 10,
    });

    if (!results.data || results.data.length === 0) {
      return { context: '', citations: [], totalTokens: 0, chunkCount: 0 };
    }

    const seen = new Set<string>();
    const chunks: { text: string; score: number; citation: CitationInput }[] = [];

    for (const hit of results.data) {
      const key = `${hit.documentId}-${hit.chunkIndex}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const text = hit.matchedContent || hit.description || '';
      if (!text.trim()) continue;

      void Math.ceil(text.length * this.tokensPerChar);
      chunks.push({
        text,
        score: hit.score,
        citation: {
          chunkId: `${hit.documentId}_${hit.chunkIndex ?? 0}`,
          relevanceScore: hit.score,
          documentId: hit.documentId,
          chunkIndex: hit.chunkIndex ?? 0,
          pageNumber: hit.pageNumber ?? null,
          section: hit.section ?? null,
          documentTitle: hit.title,
        },
      });
    }

    chunks.sort((a, b) => b.score - a.score);

    const selected: typeof chunks = [];
    let totalTokens = 0;
    const metadataLines: string[] = [];

    for (const chunk of chunks) {
      const estimatedTokens = Math.ceil(chunk.text.length * this.tokensPerChar);
      if (totalTokens + estimatedTokens > maxTokens) break;

      selected.push(chunk);
      totalTokens += estimatedTokens;
      metadataLines.push(
        `[Source: "${chunk.citation.documentTitle || 'Untitled'}"` +
          (chunk.citation.pageNumber ? `, Page ${chunk.citation.pageNumber}` : '') +
          (chunk.citation.section ? `, Section: ${chunk.citation.section}` : '') +
          `, Score: ${(chunk.score * 100).toFixed(0)}%]`,
      );
    }

    const contextParts = selected.map((c, i) => {
      return `---\nSource ${i + 1}: ${metadataLines[i]}\n${c.text}\n---`;
    });

    return {
      context: contextParts.join('\n\n'),
      citations: selected.map((c) => c.citation),
      totalTokens,
      chunkCount: selected.length,
    };
  }
}
