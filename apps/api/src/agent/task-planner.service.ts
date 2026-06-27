import { Injectable } from '@nestjs/common';
import { OpenRouterProvider } from '../chat/providers/openrouter.provider';
import { ToolRegistry } from './tools/tool-registry';

@Injectable()
export class TaskPlannerService {
  constructor(
    private llmProvider: OpenRouterProvider,
    private toolRegistry: ToolRegistry,
  ) {}

  async createPlan(
    workspaceId: string,
    userInput: string,
    agentType: string,
    agentSystemPrompt: string,
    availableTools: string[],
  ): Promise<{ steps: any[]; reasoning: string }> {
    const tools = this.toolRegistry.getToolSchemas(availableTools);
    const toolsDesc = tools
      .map((t) => `  - ${t.name}: ${t.description}\n    Input: ${JSON.stringify(t.inputSchema)}`)
      .join('\n');

    const messages = [
      {
        role: 'system' as const,
        content: `${agentSystemPrompt}\n\nYou are a task planner. Break down the user's request into a step-by-step plan using available tools. Respond with JSON only.\n\nAvailable tools:\n${toolsDesc}\n\nOutput format: { "reasoning": "...", "steps": [{ "type": "TOOL_CALL" | "LLM_REASONING", "tool": "...", "input": {...}, "description": "..." }] }`,
      },
      { role: 'user' as const, content: userInput },
    ];

    const result = await this.llmProvider.generateChat({ messages, temperature: 0.3 });
    try {
      const parsed = JSON.parse(result.content);
      return { steps: parsed.steps || [], reasoning: parsed.reasoning || '' };
    } catch {
      return {
        steps: [
          {
            type: 'LLM_REASONING',
            tool: null,
            input: { task: userInput },
            description: 'Process request',
          },
        ],
        reasoning: result.content,
      };
    }
  }
}
