import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../shared/services/prisma.service';
import { MemoryService } from './memory.service';

describe('MemoryService', () => {
  let service: MemoryService;
  let prisma: any;

  const mockPrisma = {
    agentMemory: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const memoryFixture = {
    workspaceId: 'ws-1',
    userId: 'user-1',
    key: 'preferences',
    value: { theme: 'dark' },
    agentId: null,
    type: 'TASK',
    ttl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MemoryService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<MemoryService>(MemoryService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  describe('set', () => {
    it('should upsert memory record', async () => {
      mockPrisma.agentMemory.upsert.mockResolvedValue(memoryFixture);

      const result = await service.set('ws-1', 'user-1', 'preferences', { theme: 'dark' });

      expect(mockPrisma.agentMemory.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            workspaceId_userId_key: { workspaceId: 'ws-1', userId: 'user-1', key: 'preferences' },
          },
          create: expect.objectContaining({
            workspaceId: 'ws-1',
            userId: 'user-1',
            key: 'preferences',
            value: { theme: 'dark' },
            type: 'TASK',
          }),
          update: expect.objectContaining({
            value: { theme: 'dark' },
          }),
        }),
      );
      expect(result.key).toBe('preferences');
    });

    it('should accept optional agentId and type', async () => {
      mockPrisma.agentMemory.upsert.mockResolvedValue({
        ...memoryFixture,
        agentId: 'agent-1',
        type: 'SESSION',
      });

      await service.set(
        'ws-1',
        'user-1',
        'session',
        { data: 'xyz' },
        { agentId: 'agent-1', type: 'SESSION' },
      );

      expect(mockPrisma.agentMemory.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ agentId: 'agent-1', type: 'SESSION' }),
        }),
      );
    });
  });

  describe('get', () => {
    it('should return memory by key', async () => {
      mockPrisma.agentMemory.findUnique.mockResolvedValue(memoryFixture);

      const result = await service.get('ws-1', 'user-1', 'preferences');

      expect(mockPrisma.agentMemory.findUnique).toHaveBeenCalledWith({
        where: {
          workspaceId_userId_key: { workspaceId: 'ws-1', userId: 'user-1', key: 'preferences' },
        },
      });
      expect(result).toEqual(memoryFixture);
    });

    it('should return null when key does not exist', async () => {
      mockPrisma.agentMemory.findUnique.mockResolvedValue(null);

      const result = await service.get('ws-1', 'user-1', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getRelevant', () => {
    it('should filter memories by text match in value', async () => {
      const memories = [
        { ...memoryFixture, value: { note: 'meeting about project x' } },
        { ...memoryFixture, key: 'other', value: { note: 'random thought' } },
      ];
      mockPrisma.agentMemory.findMany.mockResolvedValue(memories);

      const result = await service.getRelevant('ws-1', 'user-1', undefined, 'project');

      expect(result).toHaveLength(1);
      expect((result[0].value as any).note).toBe('meeting about project x');
    });

    it('should limit query to 20 characters', async () => {
      mockPrisma.agentMemory.findMany.mockResolvedValue([]);

      await service.getRelevant(
        'ws-1',
        'user-1',
        undefined,
        'a very long query string that should be truncated',
      );

      const filterFn = mockPrisma.agentMemory.findMany.mock.calls[0][0];
      expect(filterFn).toBeDefined();
    });

    it('should filter by agentId when provided', async () => {
      mockPrisma.agentMemory.findMany.mockResolvedValue([]);

      await service.getRelevant('ws-1', 'user-1', 'agent-1', 'test');

      expect(mockPrisma.agentMemory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ agentId: 'agent-1' }),
        }),
      );
    });

    it('should return empty array when no matches', async () => {
      mockPrisma.agentMemory.findMany.mockResolvedValue([memoryFixture]);

      const result = await service.getRelevant('ws-1', 'user-1', undefined, 'nonexistent');

      expect(result).toHaveLength(0);
    });
  });

  describe('delete', () => {
    it('should remove memory by composite key', async () => {
      mockPrisma.agentMemory.delete.mockResolvedValue(memoryFixture);

      await service.delete('ws-1', 'user-1', 'preferences');

      expect(mockPrisma.agentMemory.delete).toHaveBeenCalledWith({
        where: {
          workspaceId_userId_key: { workspaceId: 'ws-1', userId: 'user-1', key: 'preferences' },
        },
      });
    });
  });

  describe('clear', () => {
    it('should delete all memories for user', async () => {
      mockPrisma.agentMemory.deleteMany.mockResolvedValue({ count: 3 });

      await service.clear('ws-1', 'user-1');

      expect(mockPrisma.agentMemory.deleteMany).toHaveBeenCalledWith({
        where: { workspaceId: 'ws-1', userId: 'user-1' },
      });
    });

    it('should filter by type when provided', async () => {
      mockPrisma.agentMemory.deleteMany.mockResolvedValue({ count: 1 });

      await service.clear('ws-1', 'user-1', 'TASK');

      expect(mockPrisma.agentMemory.deleteMany).toHaveBeenCalledWith({
        where: { workspaceId: 'ws-1', userId: 'user-1', type: 'TASK' },
      });
    });
  });
});
