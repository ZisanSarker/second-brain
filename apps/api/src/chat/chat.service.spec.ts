import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../shared/services/prisma.service';
import { AiService } from '../ai/ai.service';
import { SearchService } from '../search/search.service';
import { ConversationService } from './services/conversation.service';
import { MessageService } from './services/message.service';
import { CitationService } from './services/citation.service';
import { ContextBuilderService } from './services/context-builder.service';
import { PromptBuilderService } from './services/prompt-builder.service';
import { QueryOptimizerService } from './services/query-optimizer.service';
import { StreamingService } from './services/streaming.service';
import { OpenRouterProvider } from './providers/openrouter.provider';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

describe('Chat Module', () => {
  let conversationService: ConversationService;
  let messageService: MessageService;
  let citationService: CitationService;
  let contextBuilder: ContextBuilderService;
  let promptBuilder: PromptBuilderService;
  let queryOptimizer: QueryOptimizerService;
  let streamingService: StreamingService;
  let openRouter: OpenRouterProvider;

  const mockPrisma = {
    conversation: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    message: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      createMany: jest.fn(),
    },
    citation: {
      createMany: jest.fn(),
      findMany: jest.fn(),
    },
    systemPrompt: {
      findFirst: jest.fn(),
    },
    workspaceSettings: {
      findUnique: jest.fn(),
    },
    workspaceMember: {
      findUnique: jest.fn(),
    },
  };

  const mockSearchService = {
    search: jest.fn(),
    requireMember: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationService,
        MessageService,
        CitationService,
        ContextBuilderService,
        PromptBuilderService,
        QueryOptimizerService,
        StreamingService,
        OpenRouterProvider,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: SearchService, useValue: mockSearchService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              if (key === 'OPENROUTER_API_KEY') return 'test-key';
              if (key === 'OPENROUTER_BASE_URL') return 'https://openrouter.ai/api/v1';
              if (key === 'OPENROUTER_MODEL') return 'openai/gpt-4o';
              return defaultValue;
            }),
          },
        },
      ],
    }).compile();

    conversationService = module.get<ConversationService>(ConversationService);
    messageService = module.get<MessageService>(MessageService);
    citationService = module.get<CitationService>(CitationService);
    contextBuilder = module.get<ContextBuilderService>(ContextBuilderService);
    promptBuilder = module.get<PromptBuilderService>(PromptBuilderService);
    queryOptimizer = module.get<QueryOptimizerService>(QueryOptimizerService);
    streamingService = module.get<StreamingService>(StreamingService);
    openRouter = module.get<OpenRouterProvider>(OpenRouterProvider);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.workspaceMember.findUnique.mockResolvedValue({ id: 'member-1', role: 'OWNER' });
  });

  describe('QueryOptimizerService', () => {
    it('should detect a follow-up question', () => {
      const result = queryOptimizer.optimize('Tell me more about that', 'Some previous answer');
      expect(result.isFollowUp).toBe(true);
    });

    it('should not detect follow-up on first question', () => {
      const result = queryOptimizer.optimize('What is AI?');
      expect(result.isFollowUp).toBe(false);
    });

    it('should detect English language', () => {
      const result = queryOptimizer.optimize('Hello world');
      expect(result.language).toBe('en');
    });
  });

  describe('StreamingService', () => {
    it('should create and retrieve a stream', () => {
      const subject = streamingService.createStream('conv-1');
      expect(subject).toBeDefined();
      expect(streamingService.getStream('conv-1')).toBe(subject);
    });

    it('should stop and cleanup a stream', () => {
      streamingService.createStream('conv-2');
      const stopped = streamingService.stopStream('conv-2');
      expect(stopped).toBe(true);
      expect(streamingService.getStream('conv-2')).toBeUndefined();
    });

    it('should return false for unknown stream', () => {
      const stopped = streamingService.stopStream('nonexistent');
      expect(stopped).toBe(false);
    });
  });

  describe('ConversationService', () => {
    it('should create a conversation', async () => {
      mockPrisma.conversation.create.mockResolvedValue({
        id: 'conv-1',
        workspaceId: 'ws-1',
        creatorId: 'user-1',
        title: 'New Chat',
      });
      const conv = await conversationService.create('ws-1', 'user-1');
      expect(conv.id).toBe('conv-1');
      expect(mockPrisma.workspaceMember.findUnique).toHaveBeenCalled();
    });

    it('should throw on unauthorized access', async () => {
      mockPrisma.workspaceMember.findUnique.mockResolvedValue(null);
      await expect(conversationService.findById('ws-1', 'user-1', 'conv-1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw on non-existent conversation', async () => {
      mockPrisma.conversation.findFirst.mockResolvedValue(null);
      await expect(conversationService.findById('ws-1', 'user-1', 'conv-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should list conversations ordered by pinned and updated', async () => {
      mockPrisma.conversation.findMany.mockResolvedValue([
        { id: 'conv-1', title: 'Chat 1', pinnedAt: new Date(), _count: { messages: 5 } },
        { id: 'conv-2', title: 'Chat 2', pinnedAt: null, _count: { messages: 3 } },
      ]);
      const list = await conversationService.list('ws-1', 'user-1');
      expect(list).toHaveLength(2);
      expect(mockPrisma.conversation.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ pinnedAt: { sort: 'desc', nulls: 'last' } }, { updatedAt: 'desc' }],
        }),
      );
    });

    it('should soft delete a conversation', async () => {
      mockPrisma.conversation.findFirst.mockResolvedValue({ id: 'conv-1', workspaceId: 'ws-1' });
      mockPrisma.conversation.update.mockResolvedValue({ id: 'conv-1', deletedAt: new Date() });
      await conversationService.softDelete('ws-1', 'user-1', 'conv-1');
      expect(mockPrisma.conversation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'conv-1' },
          data: { deletedAt: expect.any(Date) },
        }),
      );
    });
  });

  describe('MessageService', () => {
    it('should add a message', async () => {
      mockPrisma.conversation.findFirst.mockResolvedValue({ id: 'conv-1', workspaceId: 'ws-1' });
      mockPrisma.message.create.mockResolvedValue({
        id: 'msg-1',
        conversationId: 'conv-1',
        role: 'user',
        content: 'Hello',
      });
      const msg = await messageService.addMessage('ws-1', 'user-1', 'conv-1', 'user', 'Hello');
      expect(msg.role).toBe('user');
    });
  });

  describe('ContextBuilderService', () => {
    it('should return empty context when no results', async () => {
      mockSearchService.search.mockResolvedValue({ data: [] });
      const result = await contextBuilder.buildContext('ws-1', 'user-1', 'test query');
      expect(result.context).toBe('');
      expect(result.citations).toHaveLength(0);
    });

    it('should build context from search results', async () => {
      mockSearchService.search.mockResolvedValue({
        data: [
          {
            documentId: 'doc-1',
            chunkIndex: 0,
            matchedContent: 'Relevant content about AI',
            score: 0.95,
            title: 'AI Document',
            pageNumber: 5,
            section: 'Introduction',
            description: 'A document about AI',
          },
          {
            documentId: 'doc-2',
            chunkIndex: 1,
            matchedContent: 'More content about ML',
            score: 0.8,
            title: 'ML Document',
            pageNumber: null,
            section: null,
            description: null,
          },
        ],
      });
      const result = await contextBuilder.buildContext('ws-1', 'user-1', 'AI', 500);
      expect(result.context).toContain('Relevant content about AI');
      expect(result.context).toContain('More content about ML');
      expect(result.citations).toHaveLength(2);
      expect(result.chunkCount).toBe(2);
    });
  });

  describe('OpenRouterProvider', () => {
    it('should build correct headers', () => {
      const headers = (openRouter as any).headers();
      expect(headers.Authorization).toBe('Bearer test-key');
      expect(headers['HTTP-Referer']).toBe('https://secondbrain.app');
      expect(headers['X-Title']).toBe('Second Brain');
    });
  });
});
