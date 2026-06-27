import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../shared/services/prisma.service';

@Injectable()
export class RecentService {
  constructor(private prisma: PrismaService) {}

  async findAll(workspaceId: string, userId: string, limit = 20) {
    await this.requireMember(workspaceId, userId);

    return this.prisma.recentDocument.findMany({
      where: { userId, document: { workspaceId, deletedAt: null } },
      include: {
        document: {
          include: {
            collection: { select: { id: true, name: true } },
            tags: { select: { id: true, name: true, color: true } },
          },
        },
      },
      orderBy: { lastAccessedAt: 'desc' },
      take: limit,
    });
  }

  private async requireMember(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this workspace');
  }
}
