import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../shared/services/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(
    workspaceId: string,
    userId: string,
    params: {
      query?: string;
      collectionId?: string;
      folderId?: string;
      tagId?: string;
      fileType?: string;
      author?: string;
      dateFrom?: string;
      dateTo?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    },
  ) {
    await this.requireMember(workspaceId, userId);

    const where: Prisma.DocumentWhereInput = {
      workspaceId,
      deletedAt: null,
    };

    const conditions: Prisma.DocumentWhereInput[] = [];

    if (params.query) {
      conditions.push({
        OR: [
          { title: { contains: params.query, mode: 'insensitive' } },
          { originalName: { contains: params.query, mode: 'insensitive' } },
          { description: { contains: params.query, mode: 'insensitive' } },
          { author: { contains: params.query, mode: 'insensitive' } },
        ],
      });
    }
    if (params.collectionId) {
      conditions.push({ collectionId: params.collectionId });
    }
    if (params.folderId) {
      conditions.push({ folderId: params.folderId });
    }
    if (params.tagId) {
      conditions.push({ tags: { some: { id: params.tagId } } });
    }
    if (params.fileType) {
      conditions.push({ fileType: params.fileType });
    }
    if (params.author) {
      conditions.push({ author: { contains: params.author, mode: 'insensitive' } });
    }
    if (params.dateFrom) {
      conditions.push({ createdAt: { gte: new Date(params.dateFrom) } });
    }
    if (params.dateTo) {
      conditions.push({ createdAt: { lte: new Date(params.dateTo) } });
    }

    if (conditions.length > 0) {
      where.AND = conditions;
    }

    const orderBy: Prisma.DocumentOrderByWithRelationInput = {};
    const sortField = params.sortBy || 'updatedAt';
    const sortDir = params.sortOrder || 'desc';
    if (['title', 'createdAt', 'updatedAt', 'fileType', 'fileSize', 'author'].includes(sortField)) {
      orderBy[sortField as keyof Prisma.DocumentOrderByWithRelationInput] = sortDir;
    } else {
      orderBy.updatedAt = 'desc';
    }

    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        include: {
          collection: { select: { id: true, name: true } },
          folder: { select: { id: true, name: true } },
          tags: { select: { id: true, name: true, color: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.document.count({ where }),
    ]);

    // Save search history
    if (params.query) {
      await this.prisma.searchHistory.create({
        data: {
          workspaceId,
          userId,
          query: params.query,
          filters: params as any,
          resultCount: total,
        },
      });
    }

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async searchHistory(workspaceId: string, userId: string) {
    return this.prisma.searchHistory.findMany({
      where: { workspaceId, userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      distinct: ['query'],
    });
  }

  private async requireMember(workspaceId: string, userId: string) {
    const member = await this.prisma.workspaceMember.findUnique({
      where: { workspaceId_userId: { workspaceId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this workspace');
  }
}
