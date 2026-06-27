import { Injectable } from '@nestjs/common';
import { BaseTool, ToolResult } from './base-tool';
import { ContentService } from '../../ai/services/content.service';

@Injectable()
export class DocumentReaderTool extends BaseTool {
  readonly name = 'document-reader';
  readonly description = 'Read the content of a specific document by ID';
  readonly inputSchema = { documentId: { type: 'string', description: 'Document UUID to read' } };
  readonly outputSchema = {
    content: { type: 'string' },
    title: { type: 'string' },
    metadata: { type: 'object' },
  };
  readonly minRole = 'VIEWER';

  constructor(private contentService: ContentService) {
    super();
  }

  async execute(workspaceId: string, userId: string, input: any): Promise<ToolResult> {
    try {
      const content = await this.contentService.getDocumentContent(input.documentId);
      const metadata = await this.contentService.getDocumentMetadata(input.documentId);
      return { success: true, output: { content, title: metadata?.title || '', metadata } };
    } catch (e: any) {
      return { success: false, output: null, error: e.message };
    }
  }
}
