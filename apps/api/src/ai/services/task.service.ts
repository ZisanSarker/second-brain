import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { AiTaskStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';

@Injectable()
export class TaskService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    workspaceId: string;
    type: string;
    documentId?: string;
    collectionId?: string;
    parentTaskId?: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    return this.prisma.aiTask.create({
      data: { ...data, status: 'QUEUED', metadata: data.metadata ?? Prisma.JsonNull },
    });
  }

  async list(workspaceId: string, status?: string, limit = 50) {
    const where: any = { workspaceId };
    if (status) where.status = status;
    return this.prisma.aiTask.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit });
  }

  async getById(workspaceId: string, id: string) {
    const task = await this.prisma.aiTask.findFirst({ where: { id, workspaceId } });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async updateStatus(id: string, status: AiTaskStatus, errorMessage?: string) {
    return this.prisma.aiTask.update({
      where: { id },
      data: { status, errorMessage, updatedAt: new Date() },
    });
  }

  async updateProgress(id: string, progress: number) {
    return this.prisma.aiTask.update({ where: { id }, data: { progress } });
  }

  async setResult(id: string, resultId: string) {
    return this.prisma.aiTask.update({
      where: { id },
      data: { resultId, status: 'COMPLETED', progress: 100 },
    });
  }

  async retry(workspaceId: string, id: string) {
    const task = await this.getById(workspaceId, id);
    if (task.status !== 'FAILED') throw new Error('Only failed tasks can be retried');
    return this.prisma.aiTask.update({
      where: { id },
      data: { status: 'QUEUED', errorMessage: null, progress: 0 },
    });
  }

  async cancel(workspaceId: string, id: string) {
    const task = await this.getById(workspaceId, id);
    if (!['QUEUED', 'RUNNING'].includes(task.status)) throw new Error('Task cannot be cancelled');
    return this.prisma.aiTask.update({ where: { id }, data: { status: 'CANCELLED' } });
  }
}
