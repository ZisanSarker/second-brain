import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../shared/services/prisma.service';

@Injectable()
export class ExecutionService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    workspaceId: string;
    agentId?: string;
    userId?: string;
    type: string;
    input: any;
    metadata?: any;
  }) {
    return this.prisma.agentExecution.create({
      data: {
        workspaceId: data.workspaceId,
        agentId: data.agentId,
        userId: data.userId,
        type: data.type,
        status: 'QUEUED',
        input: data.input ?? {},
        metadata: data.metadata ?? {},
      },
    });
  }

  async getById(workspaceId: string, id: string) {
    const execution = await this.prisma.agentExecution.findFirst({
      where: { id, workspaceId },
      include: {
        steps: { orderBy: { stepIndex: 'asc' } },
        approvals: true,
      },
    });
    if (!execution) throw new NotFoundException('Execution not found');
    return execution;
  }

  async list(
    workspaceId: string,
    query: { status?: string; type?: string; limit?: number; offset?: number },
  ) {
    const where: any = { workspaceId };
    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;

    const [items, total] = await Promise.all([
      this.prisma.agentExecution.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.limit ?? 50,
        skip: query.offset ?? 0,
      }),
      this.prisma.agentExecution.count({ where }),
    ]);
    return { items, total };
  }

  async updateStatus(id: string, status: string, error?: string) {
    return this.prisma.agentExecution.update({
      where: { id },
      data: {
        status: status as any,
        error,
        ...(status === 'RUNNING' ? { startedAt: new Date() } : {}),
        ...(['COMPLETED', 'FAILED', 'CANCELLED'].includes(status)
          ? { completedAt: new Date() }
          : {}),
      },
    });
  }

  async updateOutput(
    id: string,
    output: any,
    tokenUsage?: { prompt: number; completion: number; total: number },
  ) {
    return this.prisma.agentExecution.update({
      where: { id },
      data: {
        output,
        tokenUsage: tokenUsage ?? undefined,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });
  }

  async updatePlan(id: string, plan: any) {
    return this.prisma.agentExecution.update({
      where: { id },
      data: { plan, status: 'RUNNING', startedAt: new Date() },
    });
  }

  async createStep(data: {
    executionId: string;
    stepIndex: number;
    type: string;
    toolName?: string;
    toolInput?: any;
    llmPrompt?: string;
  }) {
    return this.prisma.agentExecutionStep.create({
      data: {
        executionId: data.executionId,
        stepIndex: data.stepIndex,
        type: data.type,
        toolName: data.toolName,
        toolInput: data.toolInput ?? null,
        llmPrompt: data.llmPrompt ?? null,
        status: 'RUNNING',
        startedAt: new Date(),
      },
    });
  }

  async completeStep(id: string, output: any) {
    return this.prisma.agentExecutionStep.update({
      where: { id },
      data: { toolOutput: output, status: 'COMPLETED', completedAt: new Date() },
    });
  }

  async failStep(id: string, error: string) {
    return this.prisma.agentExecutionStep.update({
      where: { id },
      data: { status: 'FAILED', error, completedAt: new Date() },
    });
  }

  async cancel(workspaceId: string, id: string) {
    const execution = await this.getById(workspaceId, id);
    if (!['QUEUED', 'RUNNING', 'PLANNING', 'WAITING_APPROVAL'].includes(execution.status)) {
      throw new Error('Execution cannot be cancelled');
    }
    return this.updateStatus(id, 'CANCELLED');
  }

  async retry(workspaceId: string, id: string) {
    const execution = await this.getById(workspaceId, id);
    if (execution.status !== 'FAILED') throw new Error('Only failed executions can be retried');
    return this.updateStatus(id, 'QUEUED');
  }
}
