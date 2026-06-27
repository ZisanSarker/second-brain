import { Injectable } from '@nestjs/common';
import { AgentRouterService } from './agent-router.service';
import { ExecutionService } from './execution.service';
import { TaskPlannerService } from './task-planner.service';
import { ToolRegistry } from './tools/tool-registry';

@Injectable()
export class AgentService {
  constructor(
    private agentRouter: AgentRouterService,
    private executionService: ExecutionService,
    private taskPlanner: TaskPlannerService,
    private toolRegistry: ToolRegistry,
  ) {}

  async runAgent(params: {
    workspaceId: string;
    userId: string;
    type: string;
    input?: string;
    context?: Record<string, any>;
    model?: string;
  }) {
    const agent = this.agentRouter.getAgent(params.type);
    const execution = await this.executionService.create({
      workspaceId: params.workspaceId,
      userId: params.userId,
      type: params.type,
      input: { task: params.input, context: params.context },
    });

    try {
      await this.executionService.updateStatus(execution.id, 'PLANNING');
      const plan = await this.taskPlanner.createPlan(
        params.workspaceId,
        params.input || '',
        params.type,
        agent.systemPrompt,
        agent.defaultTools,
      );
      await this.executionService.updatePlan(execution.id, plan.steps);

      const result = await agent.execute(
        execution.id,
        params.workspaceId,
        params.userId,
        { task: params.input, ...params.context },
        params.context,
      );

      await this.executionService.updateOutput(execution.id, result.output, result.tokenUsage);
      return { executionId: execution.id, output: result.output, status: 'COMPLETED' };
    } catch (e: any) {
      await this.executionService.updateStatus(execution.id, 'FAILED', e.message);
      return { executionId: execution.id, error: e.message, status: 'FAILED' };
    }
  }

  async runWorkflow(workspaceId: string, workflowId: string, input: Record<string, any>) {
    const execution = await this.executionService.create({
      workspaceId,
      type: 'WORKFLOW',
      input,
      metadata: { workflowId },
    });

    return { executionId: execution.id, status: 'QUEUED' };
  }

  listAgents() {
    return this.agentRouter.listAgents();
  }
}
