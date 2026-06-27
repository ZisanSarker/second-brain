export interface ToolSchema {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
  minRole: string;
}

export interface ToolResult {
  success: boolean;
  output: any;
  error?: string;
  metadata?: Record<string, any>;
}

export abstract class BaseTool {
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly inputSchema: Record<string, any>;
  abstract readonly outputSchema: Record<string, any>;
  abstract readonly minRole: string;

  abstract execute(workspaceId: string, userId: string, input: any): Promise<ToolResult>;

  getSchema(): ToolSchema {
    return {
      name: this.name,
      description: this.description,
      inputSchema: this.inputSchema,
      outputSchema: this.outputSchema,
      minRole: this.minRole,
    };
  }
}
