import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';

@Injectable()
export class WorkflowService {
  constructor(private prisma: PrismaService) {}

  async create(
    workspaceId: string,
    data: { name: string; description?: string; steps?: any[]; trigger?: any; createdBy: string },
  ) {
    return this.prisma.workflow.create({
      data: {
        workspaceId,
        name: data.name,
        description: data.description,
        steps: data.steps ?? [],
        trigger: data.trigger ?? { type: 'MANUAL' },
        createdBy: data.createdBy,
      },
    });
  }

  async list(workspaceId: string) {
    return this.prisma.workflow.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(workspaceId: string, id: string) {
    const wf = await this.prisma.workflow.findFirst({ where: { id, workspaceId } });
    if (!wf) throw new NotFoundException('Workflow not found');
    return wf;
  }

  async update(
    workspaceId: string,
    id: string,
    data: { name?: string; description?: string; steps?: any[]; trigger?: any; isActive?: boolean },
  ) {
    await this.getById(workspaceId, id);
    return this.prisma.workflow.update({ where: { id }, data });
  }

  async delete(workspaceId: string, id: string) {
    await this.getById(workspaceId, id);
    await this.prisma.workflow.delete({ where: { id } });
  }
}
