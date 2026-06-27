import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    workspaceId: string;
    userId?: string;
    type: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }) {
    return this.prisma.activity.create({
      data: {
        ...data,
        type: data.type as any,
        metadata: (data.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async list(
    workspaceId: string,
    query: {
      type?: string;
      entityType?: string;
      entityId?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: any = { workspaceId };
    if (query.type) where.type = query.type;
    if (query.entityType) where.entityType = query.entityType;
    if (query.entityId) where.entityId = query.entityId;

    const [items, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        orderBy: { createdAt: 'desc' },
        take: query.limit ?? 50,
        skip: query.offset ?? 0,
      }),
      this.prisma.activity.count({ where }),
    ]);

    return { items, total };
  }

  async workspaceSummary(workspaceId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [activeMembers, recentActivity, recentComments, recentAiContent] = await Promise.all([
      this.prisma.presence.count({ where: { workspaceId, lastSeenAt: { gte: thirtyDaysAgo } } }),
      this.prisma.activity.count({ where: { workspaceId, createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.comment.count({
        where: { document: { workspaceId }, createdAt: { gte: thirtyDaysAgo }, deletedAt: null },
      }),
      this.prisma.generatedContent.count({
        where: { workspaceId, createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    return { activeMembers, recentActivity, recentComments, recentAiContent };
  }
}
