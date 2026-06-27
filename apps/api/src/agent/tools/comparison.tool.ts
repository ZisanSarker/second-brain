import { Injectable } from '@nestjs/common';
import { BaseTool, ToolResult } from './base-tool';
import { ComparisonService } from '../../ai/services/comparison.service';

@Injectable()
export class ComparisonTool extends BaseTool {
  readonly name = 'compare';
  readonly description = 'Compare two or more documents for similarities and differences';
  readonly inputSchema = {
    documentId: { type: 'string', description: 'Primary document' },
    collectionId: { type: 'string', description: 'Collection with documents to compare against' },
  };
  readonly outputSchema = { comparison: { type: 'object' } };
  readonly minRole = 'MEMBER';

  constructor(private comparisonService: ComparisonService) {
    super();
  }

  async execute(workspaceId: string, userId: string, input: any): Promise<ToolResult> {
    try {
      const result = await this.comparisonService.generate(input.documentId, input.collectionId);
      return { success: true, output: result };
    } catch (e: any) {
      return { success: false, output: null, error: e.message };
    }
  }
}
