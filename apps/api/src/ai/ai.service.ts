import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ExtractionResult {
  text: string;
  metadata: Record<string, unknown>;
}

interface ChunkResult {
  chunks: Array<{
    content: string;
    index: number;
    page_number?: number;
    section?: string;
    token_count: number;
    char_count: number;
  }>;
  total_chunks: number;
}

interface EmbeddingResult {
  embeddings: number[][];
  dimension: number;
}

interface SearchHit {
  id: string;
  score: number;
  text: string;
  document_id: string;
  chunk_index: number;
  page_number?: number;
  section?: string;
  metadata: Record<string, unknown>;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly baseUrl: string;

  constructor(private config: ConfigService) {
    this.baseUrl = this.config.get<string>('AI_SERVICE_URL', 'http://localhost:8000');
  }

  async extract(fileType: string, buffer: Buffer): Promise<ExtractionResult> {
    const blob = new Blob([buffer as BlobPart]);
    const formData = new FormData();
    formData.append('file', blob, `file.${fileType}`);

    const res = await fetch(`${this.baseUrl}/api/v1/extract/${fileType}`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Extraction failed (${res.status}): ${err}`);
    }
    return res.json();
  }

  async extractWebsite(url: string): Promise<ExtractionResult> {
    const res = await fetch(`${this.baseUrl}/api/v1/extract/website`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Website extraction failed (${res.status}): ${err}`);
    }
    return res.json();
  }

  async extractGitHub(
    owner: string,
    repo: string,
    path = '',
    branch = 'main',
    accessToken?: string,
  ): Promise<ExtractionResult> {
    const body: Record<string, string> = { owner, repo, path, branch };
    if (accessToken) body.access_token = accessToken;
    const res = await fetch(`${this.baseUrl}/api/v1/extract/github`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`GitHub extraction failed (${res.status}): ${err}`);
    }
    return res.json();
  }

  async extractYouTube(videoId: string, languages?: string[]): Promise<ExtractionResult> {
    const res = await fetch(`${this.baseUrl}/api/v1/extract/youtube`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_id: videoId, languages }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`YouTube extraction failed (${res.status}): ${err}`);
    }
    return res.json();
  }

  async normalize(text: string): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/v1/normalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Normalization failed (${res.status}): ${err}`);
    }
    const data = await res.json();
    return data.text;
  }

  async chunk(text: string, chunkSize = 500, chunkOverlap = 50): Promise<ChunkResult> {
    const res = await fetch(`${this.baseUrl}/api/v1/chunk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        config: { chunk_size: chunkSize, chunk_overlap: chunkOverlap },
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Chunking failed (${res.status}): ${err}`);
    }
    return res.json();
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResult> {
    const res = await fetch(`${this.baseUrl}/api/v1/embed-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ texts }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Embedding failed (${res.status}): ${err}`);
    }
    return res.json();
  }

  async upsertChunks(
    workspaceId: string,
    documentId: string,
    versionId: string,
    chunks: ChunkResult['chunks'],
    embeddings: number[][],
  ): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/v1/upsert-chunks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        workspace_id: workspaceId,
        document_id: documentId,
        version_id: versionId,
        chunks: chunks.map((c) => ({
          content: c.content,
          index: c.index,
          page_number: c.page_number ?? null,
          section: c.section ?? null,
          token_count: c.token_count,
          char_count: c.char_count,
        })),
        embeddings,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Upsert chunks failed (${res.status}): ${err}`);
    }
  }

  async deleteVectors(documentId: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/api/v1/delete-vectors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: documentId }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Delete vectors failed (${res.status}): ${err}`);
    }
  }

  async search(
    query: string,
    workspaceId: string,
    topK = 5,
    documentId?: string,
    collectionId?: string,
  ): Promise<SearchHit[]> {
    const res = await fetch(`${this.baseUrl}/api/v1/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        workspace_id: workspaceId,
        top_k: topK,
        document_id: documentId,
        collection_id: collectionId,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Search failed (${res.status}): ${err}`);
    }
    const data = await res.json();
    return data.hits;
  }

  async generateSummary(text: string, maxTokens = 300): Promise<string> {
    const res = await fetch(`${this.baseUrl}/api/v1/generate/summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.slice(0, 8000), max_tokens: maxTokens }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Summary generation failed (${res.status}): ${err}`);
    }
    const data = await res.json();
    return data.summary;
  }

  async generateTags(text: string): Promise<string[]> {
    const res = await fetch(`${this.baseUrl}/api/v1/generate/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.slice(0, 4000), max_tokens: 100 }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Tag generation failed (${res.status}): ${err}`);
    }
    const data = await res.json();
    return data.tags;
  }

  async generateKeywords(text: string): Promise<string[]> {
    const res = await fetch(`${this.baseUrl}/api/v1/generate/keywords`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.slice(0, 4000), max_tokens: 100 }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Keyword generation failed (${res.status}): ${err}`);
    }
    const data = await res.json();
    return data.keywords;
  }
}
