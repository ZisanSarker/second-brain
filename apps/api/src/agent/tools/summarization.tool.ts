import { Injectable } from '@nestjs/common';
import { BaseTool, ToolResult } from './base-tool';
import { SummaryService } from '../../ai/services/summary.service';

@Injectable()
export class SummarizationTool extends BaseTool {
  readonly name = 'summarize';
  readonly description = 'Generate a summary of a document or collection';
  readonly inputSchema = {
    documentId: { type: 'string', description: 'Document UUID' },
    collectionId: { type: 'string', description: 'Collection UUID (alternative)' },
  };
  readonly outputSchema = { summary: { type: 'object' } };
  readonly minRole = 'MEMBER';

  constructor(private summaryService: SummaryService) {
    super();
  }

  async execute(workspaceId: string, userId: string, input: any): Promise<ToolResult> {
    try {
      const result = await this.summaryService.generate(input.documentId, input.collectionId);
      return { success: true, output: result };
    } catch (e: any) {
      return { success: false, output: null, error: e.message };
    }
  }
}
