import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../shared/services/prisma.service';
import { AiService } from '../ai/ai.service';
import { SearchService } from './search.service';
import { SearchMode } from './dto/search-query.dto';

describe('SearchService', () => {
  let service: SearchService;
  let prisma: any;
  let ai: any;

  const mockPrisma = {
    $queryRawUnsafe: jest.fn(),
    document: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    tag: { findMany: jest.fn() },
    collection: { findMany: jest.fn() },
    searchHistory: { create: jest.fn() },
    workspaceMember: { findUnique: jest.fn() },
  };

  const mockAi = {
    hybridSearch: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AiService, useValue: mockAi },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    prisma = module.get(PrismaService);
    ai = module.get(AiService);
    jest.clearAllMocks();
  });

  describe('search', () => {
    it('should throw ForbiddenException if user is not a workspace member', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);

      await expect(service.search('ws-1', 'user-1', { query: 'test' })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return keyword results for empty query', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
      const now = new Date();
      mockPrisma.document.findMany.mockResolvedValue([
        { id: 'doc-1', title: 'Test Doc', updatedAt: now, tags: [], collection: null },
      ]);
      mockPrisma.document.count.mockResolvedValue(1);

      const result = await service.search('ws-1', 'user-1', {
        query: '',
        mode: SearchMode.KEYWORD,
      });

      expect(result.query).toBe('');
      expect(result.data).toBeDefined();
      expect(result.mode).toBe(SearchMode.KEYWORD);
    });

    it('should search by keyword mode', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
      mockPrisma.$queryRawUnsafe.mockResolvedValue([
        {
          id: 'doc-1',
          title: 'Keyword Match',
          chunkId: 'chunk-1',
          content: 'matching content',
          score: 0.8,
          collectionId: null,
          sourceType: 'FILE',
        },
      ]);

      const result = await service.search('ws-1', 'user-1', {
        query: 'keyword',
        mode: SearchMode.KEYWORD,
      });

      expect(result.data).toBeDefined();
      expect(result.mode).toBe(SearchMode.KEYWORD);
    });

    it('should filter by collectionId', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({ role: 'MEMBER' });
      const now = new Date();
      mockPrisma.document.findMany.mockResolvedValue([
        {
          id: 'doc-1',
          title: 'Filtered Doc',
          updatedAt: now,
          collectionId: 'col-1',
          collection: { id: 'col-1', name: 'Test' },
          tags: [],
        },
      ]);
      mockPrisma.document.count.mockResolvedValue(1);

      const result = await service.search('ws-1', 'user-1', {
        query: '',
        collectionId: 'col-1',
        mode: SearchMode.KEYWORD,
      });

      expect(result.data).toBeDefined();
    });
  });

  describe('suggestions', () => {
    beforeEach(() => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue([]);
    });

    it('should return suggestions array', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue({ role: 'MEMBER' });

      const result = await service.suggestions('ws-1', 'user-1', 'test');

      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array for empty prefix', async () => {
      const result = await service.suggestions('ws-1', 'user-1', '');

      expect(result).toEqual([]);
    });
  });
});
