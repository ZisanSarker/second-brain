import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    workspaceId: string;
    userId?: string;
    action: string;
    ipAddress?: string;
    details?: Record<string, unknown>;
  }) {
    return this.prisma.auditLog.create({
      data: { ...params, details: (params.details ?? {}) as Prisma.InputJsonValue },
    });
  }

  async list(
    workspaceId: string,
    query: {
      action?: string;
      userId?: string;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const where: any = { workspaceId };
    if (query.action) where.action = query.action;
    if (query.userId) where.userId = query.userId;
    if (query.dateFrom || query.dateTo) {
      where.createdAt = {};
      if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
    }
    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.limit ?? 50,
        skip: query.offset ?? 0,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items, total };
  }
}
