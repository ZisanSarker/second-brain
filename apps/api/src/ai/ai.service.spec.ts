import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';

describe('AiService', () => {
  let service: AiService;

  const mockConfig = { get: jest.fn() };

  beforeEach(async () => {
    mockConfig.get.mockImplementation((key: string, defaultValue?: string) => {
      if (key === 'AI_SERVICE_URL') return 'http://test-ai:8000';
      return defaultValue;
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [AiService, { provide: ConfigService, useValue: mockConfig }],
    }).compile();

    service = module.get<AiService>(AiService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('extract', () => {
    it('should call the extract endpoint with form data', async () => {
      const mockResponse = { text: 'extracted text', metadata: { page_count: 1 } };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as any);

      const result = await service.extract('pdf', Buffer.from('fake-pdf'));
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-ai:8000/api/v1/extract/pdf',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    it('should throw on failure', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 422,
        text: () => Promise.resolve('Invalid file'),
      } as any);

      await expect(service.extract('pdf', Buffer.from('bad'))).rejects.toThrow(
        'Extraction failed (422): Invalid file',
      );
    });
  });

  describe('extractWebsite', () => {
    it('should call the website endpoint', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ text: 'web content', metadata: { title: 'Test' } }),
      } as any);

      const result = await service.extractWebsite('https://example.com');
      expect(result.text).toBe('web content');
      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-ai:8000/api/v1/extract/website',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ url: 'https://example.com' }),
        }),
      );
    });
  });

  describe('extractGitHub', () => {
    it('should call the github endpoint', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ text: 'repo content', metadata: { file_count: 3 } }),
      } as any);

      const result = await service.extractGitHub('owner', 'repo', 'src', 'main');
      expect(result.metadata.file_count).toBe(3);
    });
  });

  describe('extractYouTube', () => {
    it('should call the youtube endpoint', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ text: 'transcript', metadata: { language_code: 'en' } }),
      } as any);

      const result = await service.extractYouTube('video123', ['en']);
      expect(result.text).toBe('transcript');
    });
  });

  describe('normalize', () => {
    it('should call normalize and return text', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ text: 'normalized', original_length: 20, normalized_length: 10 }),
      } as any);

      const result = await service.normalize('  messy  text  ');
      expect(result).toBe('normalized');
    });
  });

  describe('chunk', () => {
    it('should call chunk and return chunks', async () => {
      const mockChunks = {
        chunks: [{ content: 'chunk 1', index: 0, token_count: 5, char_count: 20 }],
        total_chunks: 1,
      };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockChunks),
      } as any);

      const result = await service.chunk('some text', 100, 10);
      expect(result.total_chunks).toBe(1);
      expect(result.chunks[0].content).toBe('chunk 1');
    });
  });

  describe('embedBatch', () => {
    it('should call embed-batch and return embeddings', async () => {
      const mockEmbeds = { embeddings: [[0.1, 0.2, 0.3]], dimension: 3 };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockEmbeds),
      } as any);

      const result = await service.embedBatch(['text1', 'text2']);
      expect(result.embeddings).toHaveLength(1);
      expect(result.dimension).toBe(3);
    });
  });

  describe('upsertChunks', () => {
    it('should call upsert-chunks endpoint', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'ok' }),
      } as any);

      await expect(service.upsertChunks('ws-1', 'doc-1', 'ver-1', [], [])).resolves.toBeUndefined();
      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-ai:8000/api/v1/upsert-chunks',
        expect.any(Object),
      );
    });

    it('should throw on failure', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal error'),
      } as any);

      await expect(service.upsertChunks('ws-1', 'doc-1', 'ver-1', [], [[0.1]])).rejects.toThrow(
        'Upsert chunks failed (500): Internal error',
      );
    });
  });

  describe('deleteVectors', () => {
    it('should call delete-vectors endpoint', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ status: 'ok' }),
      } as any);

      await expect(service.deleteVectors('doc-1')).resolves.toBeUndefined();
    });
  });

  describe('search', () => {
    it('should call search and return hits', async () => {
      const mockHits = {
        hits: [
          {
            id: 'hit-1',
            score: 0.95,
            text: 'found',
            document_id: 'doc-1',
            chunk_index: 0,
            metadata: {},
          },
        ],
        total: 1,
      };
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockHits),
      } as any);

      const result = await service.search('query', 'ws-1', 5, 'doc-1');
      expect(result).toHaveLength(1);
      expect(result[0].score).toBe(0.95);
    });
  });

  describe('generateSummary', () => {
    it('should call generate/summary endpoint', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ summary: 'This is a summary.', model: 'gpt-4o' }),
      } as any);

      const result = await service.generateSummary('long text here');
      expect(result).toBe('This is a summary.');
    });
  });

  describe('generateTags', () => {
    it('should call generate/tags endpoint', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ tags: ['tag1', 'tag2'], model: 'gpt-4o' }),
      } as any);

      const result = await service.generateTags('some text');
      expect(result).toEqual(['tag1', 'tag2']);
    });
  });

  describe('generateKeywords', () => {
    it('should call generate/keywords endpoint', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ keywords: ['kw1', 'kw2'], model: 'gpt-4o' }),
      } as any);

      const result = await service.generateKeywords('some text');
      expect(result).toEqual(['kw1', 'kw2']);
    });
  });
});
