import { LlmProvider } from '../../chat/providers/llm-provider.interface';
import { ToolRegistry } from '../tools/tool-registry';
import { ExecutionService } from '../execution.service';
import { MemoryService } from '../memory.service';
import { LlmReasonerService } from '../llm-reasoner.service';

export interface AgentResult {
  output: any;
  steps: number;
  tokenUsage: { prompt: number; completion: number; total: number };
}

export abstract class BaseAgent {
  abstract readonly type: string;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly systemPrompt: string;
  abstract readonly defaultTools: string[];

  constructor(
    protected readonly llmProvider: LlmProvider,
    protected readonly toolRegistry: ToolRegistry,
    protected readonly executionService: ExecutionService,
    protected readonly memoryService: MemoryService,
    protected readonly reasoner: LlmReasonerService,
  ) {}

  abstract execute(
    executionId: string,
    workspaceId: string,
    userId: string,
    input: any,
    context?: Record<string, any>,
  ): Promise<AgentResult>;
}
