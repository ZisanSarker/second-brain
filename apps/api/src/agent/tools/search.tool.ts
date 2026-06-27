import { Injectable } from '@nestjs/common';
import { BaseTool, ToolResult } from './base-tool';
import { SearchService } from '../../search/search.service';

@Injectable()
export class SearchTool extends BaseTool {
  readonly name = 'search';
  readonly description =
    'Search documents and knowledge within the workspace using semantic search';
  readonly inputSchema = {
    query: { type: 'string', description: 'Search query' },
    limit: { type: 'number', default: 5 },
  };
  readonly outputSchema = { results: { type: 'array', items: { type: 'object' } } };
  readonly minRole = 'VIEWER';

  constructor(private searchService: SearchService) {
    super();
  }

  async execute(workspaceId: string, userId: string, input: any): Promise<ToolResult> {
    try {
      const results = await this.searchService.search(workspaceId, userId, {
        query: input.query,
        limit: input.limit ?? 5,
      });
      return { success: true, output: results };
    } catch (e: any) {
      return { success: false, output: null, error: e.message };
    }
  }
}
