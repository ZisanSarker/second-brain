import { Controller, Post, Get, Param, Body, UseGuards, Put, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AgentService } from './agent.service';
import { ExecutionService } from './execution.service';
import { WorkflowService } from './workflows/workflow.service';
import { ApprovalService } from './approvals/approval.service';
import { SchedulerService } from './scheduler/scheduler.service';
import { ToolRegistry } from './tools/tool-registry';
import { RunAgentDto } from './dto/agent.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WorkspaceId } from '../auth/decorators/current-user.decorator';

@Controller('agents')
@UseGuards(AuthGuard('jwt'))
export class AgentController {
  constructor(
    private agentService: AgentService,
    private executionService: ExecutionService,
    private workflowService: WorkflowService,
    private approvalService: ApprovalService,
    private schedulerService: SchedulerService,
    private toolRegistry: ToolRegistry,
  ) {}

  @Post('run')
  async runAgent(
    @Body() dto: RunAgentDto,
    @CurrentUser() user: { id: string },
    @WorkspaceId() workspaceId: string,
  ) {
    return this.agentService.runAgent({
      workspaceId,
      userId: user.id,
      type: dto.type,
      input: dto.input,
      context: dto.context,
      model: dto.model,
    });
  }

  @Get()
  listAgents() {
    return this.agentService.listAgents();
  }

  @Get('executions')
  async listExecutions(@WorkspaceId() workspaceId: string) {
    return this.executionService.list(workspaceId, {});
  }

  @Get('executions/:id')
  async getExecution(@Param('id') id: string, @WorkspaceId() workspaceId: string) {
    return this.executionService.getById(workspaceId, id);
  }

  @Post('executions/:id/cancel')
  async cancelExecution(@Param('id') id: string, @WorkspaceId() workspaceId: string) {
    return this.executionService.cancel(workspaceId, id);
  }

  @Post('executions/:id/retry')
  async retryExecution(@Param('id') id: string, @WorkspaceId() workspaceId: string) {
    return this.executionService.retry(workspaceId, id);
  }

  @Get('tools')
  listTools() {
    return this.toolRegistry.listTools();
  }

  @Post('workflows')
  async createWorkflow(
    @Body() data: any,
    @CurrentUser() user: { id: string },
    @WorkspaceId() workspaceId: string,
  ) {
    return this.workflowService.create(workspaceId, { ...data, createdBy: user.id });
  }

  @Get('workflows')
  async listWorkflows(@WorkspaceId() workspaceId: string) {
    return this.workflowService.list(workspaceId);
  }

  @Get('workflows/:id')
  async getWorkflow(@Param('id') id: string, @WorkspaceId() workspaceId: string) {
    return this.workflowService.getById(workspaceId, id);
  }

  @Put('workflows/:id')
  async updateWorkflow(
    @Param('id') id: string,
    @Body() data: any,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.workflowService.update(workspaceId, id, data);
  }

  @Delete('workflows/:id')
  async deleteWorkflow(@Param('id') id: string, @WorkspaceId() workspaceId: string) {
    return this.workflowService.delete(workspaceId, id);
  }

  @Post('workflows/:id/run')
  async runWorkflow(
    @Param('id') id: string,
    @Body() body: any,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.agentService.runWorkflow(workspaceId, id, body?.input || {});
  }

  @Get('approvals')
  async listApprovals(@WorkspaceId() workspaceId: string) {
    return this.approvalService.list(workspaceId);
  }

  @Get('approvals/:id')
  async getApproval(@Param('id') id: string, @WorkspaceId() workspaceId: string) {
    return this.approvalService.getById(workspaceId, id);
  }

  @Post('approvals/:id/approve')
  async approve(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @WorkspaceId() workspaceId: string,
  ) {
    return this.approvalService.approve(workspaceId, id, user.id);
  }

  @Post('approvals/:id/reject')
  async reject(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @WorkspaceId() workspaceId: string,
  ) {
    return this.approvalService.reject(workspaceId, id, user.id);
  }

  @Post('approvals/:id/modify')
  async modify(
    @Param('id') id: string,
    @Body() body: any,
    @CurrentUser() user: { id: string },
    @WorkspaceId() workspaceId: string,
  ) {
    return this.approvalService.modify(workspaceId, id, user.id, body.modification);
  }

  @Post('schedules')
  async createSchedule(
    @Body() data: any,
    @CurrentUser() user: { id: string },
    @WorkspaceId() workspaceId: string,
  ) {
    return this.schedulerService.create(workspaceId, { ...data, createdBy: user.id });
  }

  @Get('schedules')
  async listSchedules(@WorkspaceId() workspaceId: string) {
    return this.schedulerService.list(workspaceId);
  }

  @Put('schedules/:id')
  async updateSchedule(
    @Param('id') id: string,
    @Body() data: any,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.schedulerService.update(workspaceId, id, data);
  }

  @Delete('schedules/:id')
  async deleteSchedule(@Param('id') id: string, @WorkspaceId() workspaceId: string) {
    return this.schedulerService.delete(workspaceId, id);
  }
}
