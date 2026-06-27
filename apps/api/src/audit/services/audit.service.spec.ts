import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../shared/services/prisma.service';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: any;

  const mockPrisma = {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<AuditService>(AuditService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  const auditFixture = {
    id: 'a-1',
    workspaceId: 'ws-1',
    userId: 'user-1',
    action: 'COMMENT_ADDED',
    ipAddress: null,
    details: {},
    createdAt: new Date(),
  };

  describe('log', () => {
    it('should create an immutable audit log entry', async () => {
      mockPrisma.auditLog.create.mockResolvedValue(auditFixture);

      const result = await service.log({
        workspaceId: 'ws-1',
        userId: 'user-1',
        action: 'COMMENT_ADDED',
        details: { commentId: 'cm-1' },
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            workspaceId: 'ws-1',
            userId: 'user-1',
            action: 'COMMENT_ADDED',
          }),
        }),
      );
      expect(result.action).toBe('COMMENT_ADDED');
    });

    it('should work without userId for system actions', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ ...auditFixture, userId: null });

      await service.log({
        workspaceId: 'ws-1',
        action: 'SYSTEM_CLEANUP',
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ workspaceId: 'ws-1', action: 'SYSTEM_CLEANUP' }),
        }),
      );
    });
  });

  describe('list', () => {
    it('should return paginated audit logs', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([auditFixture]);
      mockPrisma.auditLog.count.mockResolvedValue(1);

      const result = await service.list('ws-1', {});

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    it('should filter by action', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      await service.list('ws-1', { action: 'COMMENT_ADDED' });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ action: 'COMMENT_ADDED' }) }),
      );
    });

    it('should filter by date range', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([]);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      await service.list('ws-1', { dateFrom: '2024-01-01', dateTo: '2024-12-31' });

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: {
              gte: expect.any(Date),
              lte: expect.any(Date),
            },
          }),
        }),
      );
    });
  });
});
