import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../shared/services/prisma.service';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: any;

  const mockPrisma = {
    notification: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    notificationSetting: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationsService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get(PrismaService);
    jest.clearAllMocks();
  });

  const notifFixture = {
    id: 'n-1',
    workspaceId: 'ws-1',
    userId: 'user-1',
    type: 'COMMENT_MENTION',
    title: 'New mention',
    body: 'Bob mentioned you',
    data: {},
    readAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('create', () => {
    it('should create notification when no setting overrides it', async () => {
      mockPrisma.notificationSetting.findUnique.mockResolvedValue(null);
      mockPrisma.notification.create.mockResolvedValue(notifFixture);

      const result = await service.create({
        workspaceId: 'ws-1',
        userId: 'user-1',
        type: 'COMMENT_MENTION',
        title: 'New mention',
      });

      expect(result).toBeDefined();
      expect(mockPrisma.notification.create).toHaveBeenCalled();
    });

    it('should skip when setting disables inApp', async () => {
      mockPrisma.notificationSetting.findUnique.mockResolvedValue({ inApp: false });

      const result = await service.create({
        workspaceId: 'ws-1',
        userId: 'user-1',
        type: 'COMMENT_MENTION',
        title: 'New mention',
      });

      expect(result).toBeNull();
      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
    });

    it('should create when setting has inApp enabled', async () => {
      mockPrisma.notificationSetting.findUnique.mockResolvedValue({ inApp: true });
      mockPrisma.notification.create.mockResolvedValue(notifFixture);

      const result = await service.create({
        workspaceId: 'ws-1',
        userId: 'user-1',
        type: 'COMMENT_MENTION',
        title: 'New mention',
      });

      expect(result).toBeDefined();
    });
  });

  describe('list', () => {
    it('should return paginated notifications with unread count', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([notifFixture]);
      mockPrisma.notification.count.mockResolvedValueOnce(1); // total
      mockPrisma.notification.count.mockResolvedValueOnce(0); // unread

      const result = await service.list('user-1', {});

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.unreadCount).toBe(0);
    });

    it('should filter to unread only', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);

      await service.list('user-1', { unreadOnly: true });

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ readAt: null }) }),
      );
    });

    it('should filter by type', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockPrisma.notification.count.mockResolvedValue(0);

      await service.list('user-1', { type: 'COMMENT_MENTION' });

      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ type: 'COMMENT_MENTION' }) }),
      );
    });
  });

  describe('markRead', () => {
    it('should set readAt', async () => {
      mockPrisma.notification.update.mockResolvedValue({ ...notifFixture, readAt: new Date() });

      await service.markRead('n-1');

      expect(mockPrisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'n-1' }, data: { readAt: expect.any(Date) } }),
      );
    });
  });

  describe('markAllRead', () => {
    it('should update all unread to read', async () => {
      await service.markAllRead('user-1');

      expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1', readAt: null },
          data: { readAt: expect.any(Date) },
        }),
      );
    });
  });

  describe('getSettings', () => {
    it('should return notification settings', async () => {
      mockPrisma.notificationSetting.findMany.mockResolvedValue([
        { id: 's-1', userId: 'user-1', type: 'COMMENT_MENTION' },
      ]);

      const result = await service.getSettings('user-1');

      expect(result).toHaveLength(1);
    });
  });

  describe('updateSetting', () => {
    it('should upsert notification setting', async () => {
      mockPrisma.notificationSetting.upsert.mockResolvedValue({ id: 's-1', inApp: false });

      await service.updateSetting('user-1', 'COMMENT_MENTION', { inApp: false });

      expect(mockPrisma.notificationSetting.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_type: { userId: 'user-1', type: 'COMMENT_MENTION' } },
          create: expect.objectContaining({ userId: 'user-1', inApp: false }),
        }),
      );
    });
  });
});
