import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../shared/services/prisma.service';
import { PresenceService } from './presence.service';

describe('PresenceService', () => {
  let service: PresenceService;
  let prisma: any;

  const mockPrisma = {
    presence: {
      upsert: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PresenceService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<PresenceService>(PresenceService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  const presenceFixture = {
    id: 'p-1',
    workspaceId: 'ws-1',
    userId: 'user-1',
    status: 'ACTIVE',
    currentDocumentId: 'doc-1',
    lastSeenAt: new Date(),
  };

  describe('heartbeat', () => {
    it('should upsert presence record', async () => {
      mockPrisma.presence.upsert.mockResolvedValue(presenceFixture);

      const result = await service.heartbeat({
        workspaceId: 'ws-1',
        userId: 'user-1',
        status: 'ACTIVE',
        currentDocumentId: 'doc-1',
      });

      expect(mockPrisma.presence.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { workspaceId_userId: { workspaceId: 'ws-1', userId: 'user-1' } },
          create: expect.objectContaining({ status: 'ACTIVE' }),
          update: expect.objectContaining({ status: 'ACTIVE', lastSeenAt: expect.any(Date) }),
        }),
      );
      expect(result.status).toBe('ACTIVE');
    });

    it('should work without currentDocumentId', async () => {
      mockPrisma.presence.upsert.mockResolvedValue({ ...presenceFixture, currentDocumentId: null });

      await service.heartbeat({
        workspaceId: 'ws-1',
        userId: 'user-1',
        status: 'AWAY',
      });

      expect(mockPrisma.presence.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ status: 'AWAY' }),
        }),
      );
    });
  });

  describe('getActiveUsers', () => {
    it('should return users active within 5 minutes', async () => {
      const activeUsers = [{ ...presenceFixture, user: { id: 'user-1', name: 'Alice' } }];
      mockPrisma.presence.findMany.mockResolvedValue(activeUsers);

      const result = await service.getActiveUsers('ws-1');

      expect(mockPrisma.presence.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { workspaceId: 'ws-1', lastSeenAt: { gte: expect.any(Date) } },
        }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('markOffline', () => {
    it('should update status to OFFLINE', async () => {
      mockPrisma.presence.update.mockResolvedValue({ ...presenceFixture, status: 'OFFLINE' });

      const result = await service.markOffline('ws-1', 'user-1');

      expect(mockPrisma.presence.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { workspaceId_userId: { workspaceId: 'ws-1', userId: 'user-1' } },
          data: { status: 'OFFLINE' },
        }),
      );
      expect(result.status).toBe('OFFLINE');
    });
  });
});
