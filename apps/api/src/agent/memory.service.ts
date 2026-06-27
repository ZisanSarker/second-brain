import { Injectable } from '@nestjs/common';
import { PrismaService } from '../shared/services/prisma.service';

@Injectable()
export class MemoryService {
  constructor(private prisma: PrismaService) {}

  async set(
    workspaceId: string,
    userId: string,
    key: string,
    value: any,
    options?: { agentId?: string; type?: string; ttl?: number },
  ) {
    return this.prisma.agentMemory.upsert({
      where: { workspaceId_userId_key: { workspaceId, userId, key } },
      create: {
        workspaceId,
        userId,
        key,
        value,
        agentId: options?.agentId ?? null,
        type: options?.type ?? 'TASK',
        ttl: options?.ttl ?? null,
      },
      update: { value, ttl: options?.ttl ?? null },
    });
  }

  async get(workspaceId: string, userId: string, key: string) {
    return this.prisma.agentMemory.findUnique({
      where: { workspaceId_userId_key: { workspaceId, userId, key } },
    });
  }

  async getRelevant(
    workspaceId: string,
    userId: string,
    agentId: string | undefined,
    query: string,
  ) {
    const memories = await this.prisma.agentMemory.findMany({
      where: { workspaceId, userId, ...(agentId ? { agentId } : {}) },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });
    return memories.filter((m) => {
      const str = JSON.stringify(m.value).toLowerCase();
      return str.includes(query.toLowerCase().slice(0, 20));
    });
  }

  async delete(workspaceId: string, userId: string, key: string) {
    await this.prisma.agentMemory.delete({
      where: { workspaceId_userId_key: { workspaceId, userId, key } },
    });
  }

  async clear(workspaceId: string, userId: string, type?: string) {
    const where: any = { workspaceId, userId };
    if (type) where.type = type;
    await this.prisma.agentMemory.deleteMany({ where });
  }
}
