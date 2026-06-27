import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';

@Injectable()
export class PresenceService {
  constructor(private prisma: PrismaService) {}

  async heartbeat(data: {
    workspaceId: string;
    userId: string;
    status: string;
    currentDocumentId?: string;
  }) {
    return this.prisma.presence.upsert({
      where: { workspaceId_userId: { workspaceId: data.workspaceId, userId: data.userId } },
      create: {
        workspaceId: data.workspaceId,
        userId: data.userId,
        status: data.status as any,
        currentDocumentId: data.currentDocumentId,
      },
      update: {
        status: data.status as any,
        currentDocumentId: data.currentDocumentId,
        lastSeenAt: new Date(),
      },
    });
  }

  async getActiveUsers(workspaceId: string) {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.prisma.presence.findMany({
      where: { workspaceId, lastSeenAt: { gte: fiveMinutesAgo } },
      include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      orderBy: { lastSeenAt: 'desc' },
    });
  }

  async markOffline(workspaceId: string, userId: string) {
    return this.prisma.presence.update({
      where: { workspaceId_userId: { workspaceId, userId } },
      data: { status: 'OFFLINE' },
    });
  }
}
