import { Injectable } from '@nestjs/common';
import { BaseTool, ToolSchema } from './base-tool';

@Injectable()
export class ToolRegistry {
  private tools = new Map<string, BaseTool>();

  register(tool: BaseTool) {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): BaseTool {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Unknown tool: ${name}`);
    return tool;
  }

  async executeTool(
    workspaceId: string,
    userId: string,
    toolName: string,
    input: any,
  ): Promise<any> {
    const tool = this.getTool(toolName);
    const result = await tool.execute(workspaceId, userId, input);
    if (!result.success) throw new Error(`Tool ${toolName} failed: ${result.error}`);
    return result.output;
  }

  getToolSchemas(names?: string[]): ToolSchema[] {
    const entries = names
      ? (names.map((n) => this.tools.get(n)).filter(Boolean) as BaseTool[])
      : Array.from(this.tools.values());
    return entries.map((t) => t.getSchema());
  }

  listTools(): ToolSchema[] {
    return this.getToolSchemas();
  }
}
