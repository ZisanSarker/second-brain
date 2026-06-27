import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../shared/services/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, workspaceId: string) {
    await this.requireMember(workspaceId, userId);

    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Filter document favorites to current workspace
    const docIds = favorites.filter((f) => f.entityType === 'DOCUMENT').map((f) => f.entityId);

    const docs =
      docIds.length > 0
        ? await this.prisma.document.findMany({
            where: { id: { in: docIds }, workspaceId },
            select: {
              id: true,
              title: true,
              fileType: true,
              status: true,
              createdAt: true,
              updatedAt: true,
              workspaceId: true,
            },
          })
        : [];

    const docMap = new Map(docs.map((d) => [d.id, d]));

    return favorites
      .filter((f) => f.entityType !== 'DOCUMENT' || docMap.has(f.entityId))
      .map((f) => ({
        ...f,
        document: f.entityType === 'DOCUMENT' ? docMap.get(f.entityId) || null : null,
      }));
  }

  async toggle(userId: string, entityId: string, entityType: string) {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_entityId_entityType: { userId, entityId, entityType } },
    });

    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
      return { favorited: false };
    }

    await this.prisma.favorite.create({
      data: { userId, entityId, entityType },
    });
    return { favorited: true };
  }

  async remove(userId: string, entityId: string, entityType: string) {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_entityId_entityType: { userId, entityId, entityType } },
    });
    if (existing) {
      await this.prisma.favorite.delete({ where: { id: existing.id } });
    }
  }

  async isFavorited(userId: string, entityId: string, entityType: string) {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_entityId_entityType: { userId, entityId, entityType } },
    });
    return !!existing;
  }

  private async requireMember(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this workspace');
  }
}
