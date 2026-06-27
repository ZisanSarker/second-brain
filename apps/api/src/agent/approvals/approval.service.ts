import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { ExecutionService } from '../execution.service';

@Injectable()
export class ApprovalService {
  constructor(
    private prisma: PrismaService,
    private executionService: ExecutionService,
  ) {}

  async create(data: {
    workspaceId: string;
    executionId?: string;
    stepId?: string;
    requestedBy?: string;
    assignedTo?: string;
    action: string;
    context: any;
  }) {
    return this.prisma.approval.create({
      data: { ...data, status: 'PENDING', context: data.context ?? {} },
    });
  }

  async list(workspaceId: string, status?: string) {
    const where: any = { workspaceId };
    if (status) where.status = status;
    else where.status = 'PENDING';
    return this.prisma.approval.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async getById(workspaceId: string, id: string) {
    const approval = await this.prisma.approval.findFirst({ where: { id, workspaceId } });
    if (!approval) throw new NotFoundException('Approval not found');
    return approval;
  }

  async approve(workspaceId: string, id: string, userId: string) {
    const approval = await this.getById(workspaceId, id);
    if (approval.status !== 'PENDING') throw new Error('Approval is not pending');

    const result = await this.prisma.approval.update({
      where: { id },
      data: { status: 'APPROVED', decidedBy: userId, decidedAt: new Date() },
    });

    if (approval.executionId) {
      await this.executionService.updateStatus(approval.executionId, 'RUNNING');
    }
    return result;
  }

  async reject(workspaceId: string, id: string, userId: string) {
    const approval = await this.getById(workspaceId, id);
    if (approval.status !== 'PENDING') throw new Error('Approval is not pending');

    const result = await this.prisma.approval.update({
      where: { id },
      data: { status: 'REJECTED', decidedBy: userId, decidedAt: new Date() },
    });

    if (approval.executionId) {
      await this.executionService.updateStatus(approval.executionId, 'CANCELLED');
    }
    return result;
  }

  async modify(workspaceId: string, id: string, userId: string, modification: any) {
    const approval = await this.getById(workspaceId, id);
    if (approval.status !== 'PENDING') throw new Error('Approval is not pending');

    const result = await this.prisma.approval.update({
      where: { id },
      data: { status: 'MODIFIED', modification, decidedBy: userId, decidedAt: new Date() },
    });

    if (approval.executionId) {
      await this.executionService.updateStatus(approval.executionId, 'RUNNING');
    }
    return result;
  }
}
