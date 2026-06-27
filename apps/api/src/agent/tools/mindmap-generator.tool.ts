import { Injectable } from '@nestjs/common';
import { BaseTool, ToolResult } from './base-tool';
import { MindMapService } from '../../ai/services/mindmap.service';

@Injectable()
export class MindMapGeneratorTool extends BaseTool {
  readonly name = 'generate-mindmap';
  readonly description = 'Generate a mind map from document content';
  readonly inputSchema = { documentId: { type: 'string' } };
  readonly outputSchema = { mindmap: { type: 'object' } };
  readonly minRole = 'MEMBER';

  constructor(private mindMapService: MindMapService) {
    super();
  }

  async execute(workspaceId: string, userId: string, input: any): Promise<ToolResult> {
    try {
      const result = await this.mindMapService.generate(input.documentId);
      return { success: true, output: result };
    } catch (e: any) {
      return { success: false, output: null, error: e.message };
    }
  }
}
