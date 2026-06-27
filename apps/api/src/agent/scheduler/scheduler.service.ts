import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';

@Injectable()
export class SchedulerService {
  constructor(private prisma: PrismaService) {}

  async create(
    workspaceId: string,
    data: {
      name: string;
      cron: string;
      agentId?: string;
      workflowId?: string;
      input?: any;
      createdBy: string;
    },
  ) {
    return this.prisma.agentSchedule.create({
      data: {
        workspaceId,
        name: data.name,
        cron: data.cron,
        agentId: data.agentId,
        workflowId: data.workflowId,
        input: data.input ?? {},
        createdBy: data.createdBy,
      },
    });
  }

  async list(workspaceId: string) {
    return this.prisma.agentSchedule.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getById(workspaceId: string, id: string) {
    const schedule = await this.prisma.agentSchedule.findFirst({ where: { id, workspaceId } });
    if (!schedule) throw new NotFoundException('Schedule not found');
    return schedule;
  }

  async update(
    workspaceId: string,
    id: string,
    data: { name?: string; cron?: string; input?: any; isActive?: boolean },
  ) {
    await this.getById(workspaceId, id);
    return this.prisma.agentSchedule.update({ where: { id }, data });
  }

  async delete(workspaceId: string, id: string) {
    await this.getById(workspaceId, id);
    await this.prisma.agentSchedule.delete({ where: { id } });
  }

  async getDueSchedules() {
    const now = new Date();
    return this.prisma.agentSchedule.findMany({
      where: { isActive: true, OR: [{ nextRunAt: null }, { nextRunAt: { lte: now } }] },
    });
  }

  async updateLastRun(id: string) {
    const schedule = await this.prisma.agentSchedule.findUnique({ where: { id } });
    if (!schedule) return;
    const nextRun = this.computeNextRun(schedule.cron);
    return this.prisma.agentSchedule.update({
      where: { id },
      data: { lastRunAt: new Date(), nextRunAt: nextRun },
    });
  }

  private computeNextRun(cron: string): Date {
    return new Date(Date.now() + 60 * 60 * 1000);
  }
}
