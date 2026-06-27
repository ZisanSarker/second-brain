import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../shared/services/prisma.service';
import { ActivityService } from './activity.service';

describe('ActivityService', () => {
  let service: ActivityService;
  let prisma: any;

  const mockPrisma = {
    activity: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    presence: { count: jest.fn() },
    comment: { count: jest.fn() },
    generatedContent: { count: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ActivityService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<ActivityService>(ActivityService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  const activityFixture = {
    id: 'a-1',
    workspaceId: 'ws-1',
    userId: 'user-1',
    type: 'DOCUMENT_CREATED',
    entityType: 'DOCUMENT',
    entityId: 'doc-1',
    metadata: {},
    createdAt: new Date(),
    user: { id: 'user-1', name: 'Alice' },
  };

  describe('create', () => {
    it('should create an activity record', async () => {
      mockPrisma.activity.create.mockResolvedValue(activityFixture);

      const result = await service.create({
        workspaceId: 'ws-1',
        userId: 'user-1',
        type: 'DOCUMENT_CREATED',
        entityType: 'DOCUMENT',
        entityId: 'doc-1',
      });

      expect(mockPrisma.activity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            type: 'DOCUMENT_CREATED',
            entityType: 'DOCUMENT',
          }),
        }),
      );
      expect(result.id).toBe('a-1');
    });
  });

  describe('list', () => {
    it('should return paginated activity items', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([activityFixture]);
      mockPrisma.activity.count.mockResolvedValue(1);

      const result = await service.list('ws-1', {});

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by type', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      await service.list('ws-1', { type: 'DOCUMENT_CREATED' });

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ type: 'DOCUMENT_CREATED' }) }),
      );
    });

    it('should filter by entityType and entityId', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      await service.list('ws-1', { entityType: 'DOCUMENT', entityId: 'doc-1' });

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ entityType: 'DOCUMENT', entityId: 'doc-1' }),
        }),
      );
    });

    it('should respect pagination', async () => {
      mockPrisma.activity.findMany.mockResolvedValue([]);
      mockPrisma.activity.count.mockResolvedValue(0);

      await service.list('ws-1', { limit: 10, offset: 20 });

      expect(mockPrisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10, skip: 20 }),
      );
    });
  });

  describe('workspaceSummary', () => {
    it('should return aggregated summary counts', async () => {
      mockPrisma.presence.count.mockResolvedValue(5);
      mockPrisma.activity.count.mockResolvedValue(20);
      mockPrisma.comment.count.mockResolvedValue(15);
      mockPrisma.generatedContent.count.mockResolvedValue(10);

      const result = await service.workspaceSummary('ws-1');

      expect(result).toEqual({
        activeMembers: 5,
        recentActivity: 20,
        recentComments: 15,
        recentAiContent: 10,
      });
    });
  });
});
