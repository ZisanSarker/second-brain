import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../shared/services/prisma.service';
import { ToolRegistry } from '../tools/tool-registry';
import { LlmProvider } from '../../chat/providers/llm-provider.interface';
import { ExecutionService } from '../execution.service';

@Injectable()
export class WorkflowExecutorService {
  constructor(
    private prisma: PrismaService,
    private toolRegistry: ToolRegistry,
    @Inject('LLM_PROVIDER') private llmProvider: LlmProvider,
    private executionService: ExecutionService,
  ) {}

  async execute(
    workspaceId: string,
    workflowId: string,
    executionId: string,
    userId: string,
    input: any,
  ) {
    const workflow = await this.prisma.workflow.findFirst({
      where: { id: workflowId, workspaceId },
    });
    if (!workflow) throw new Error('Workflow not found');

    const steps: any[] = (workflow.steps as any[]) || [];
    let context = { ...input };

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const stepRecord = await this.executionService.createStep({
        executionId,
        stepIndex: i,
        type: step.type || 'TOOL_CALL',
        toolName: step.tool,
        toolInput: this.resolveInput(step.input, context),
      });

      try {
        let output: any;
        if (step.type === 'TOOL_CALL' && step.tool) {
          output = await this.toolRegistry.executeTool(
            workspaceId,
            userId,
            step.tool,
            stepRecord.toolInput,
          );
        } else if (step.type === 'LLM_REASONING') {
          const result = await this.llmProvider.generateChat({
            messages: [
              { role: 'user', content: step.prompt || JSON.stringify(stepRecord.toolInput) },
            ],
          });
          output = { response: result.content };
        } else {
          output = null;
        }

        await this.executionService.completeStep(stepRecord.id, output);
        context = { ...context, [`step_${i}_output`]: output };
      } catch (e: any) {
        await this.executionService.failStep(stepRecord.id, e.message);
        if (!step.optional) throw e;
      }
    }

    return { output: context };
  }

  private resolveInput(template: any, context: Record<string, any>): any {
    if (typeof template === 'string') {
      return template.replace(/\{\{(\w+)\}\}/g, (_, key) => context[key] ?? `{{${key}}}`);
    }
    if (typeof template === 'object' && template !== null) {
      const resolved: any = {};
      for (const [k, v] of Object.entries(template)) {
        resolved[k] = this.resolveInput(v, context);
      }
      return resolved;
    }
    return template;
  }
}
