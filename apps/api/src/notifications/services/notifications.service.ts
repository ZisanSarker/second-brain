import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    workspaceId: string;
    userId: string;
    type: string;
    title: string;
    body?: string;
    data?: Record<string, unknown>;
  }) {
    const setting = await this.prisma.notificationSetting.findUnique({
      where: { userId_type: { userId: data.userId, type: data.type as any } },
    });
    if (setting && !setting.inApp) return null;

    return this.prisma.notification.create({
      data: {
        workspaceId: data.workspaceId,
        userId: data.userId,
        type: data.type as any,
        title: data.title,
        body: data.body,
        data: (data.data ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async list(
    userId: string,
    query: { unreadOnly?: boolean; type?: string; limit?: number; offset?: number },
  ) {
    const where: any = { userId };
    if (query.unreadOnly) where.readAt = null;
    if (query.type) where.type = query.type;

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.limit ?? 50,
        skip: query.offset ?? 0,
      }),
      this.prisma.notification.count({ where }),
      this.prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    return { items, total, unreadCount };
  }

  async markRead(id: string) {
    return this.prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async getSettings(userId: string) {
    return this.prisma.notificationSetting.findMany({ where: { userId } });
  }

  async updateSetting(
    userId: string,
    type: string,
    data: { enabled?: boolean; email?: boolean; inApp?: boolean },
  ) {
    return this.prisma.notificationSetting.upsert({
      where: { userId_type: { userId, type: type as any } },
      create: { userId, type: type as any, ...data },
      update: data,
    });
  }
}
