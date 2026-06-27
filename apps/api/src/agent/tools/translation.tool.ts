import { Injectable } from '@nestjs/common';
import { BaseTool, ToolResult } from './base-tool';
import { TranslationService } from '../../ai/services/translation.service';

@Injectable()
export class TranslationTool extends BaseTool {
  readonly name = 'translate';
  readonly description = 'Translate document content to a specified language';
  readonly inputSchema = {
    documentId: { type: 'string' },
    language: { type: 'string', default: 'es' },
  };
  readonly outputSchema = { translation: { type: 'object' } };
  readonly minRole = 'MEMBER';

  constructor(private translationService: TranslationService) {
    super();
  }

  async execute(workspaceId: string, userId: string, input: any): Promise<ToolResult> {
    try {
      const result = await this.translationService.generate(
        input.documentId,
        undefined,
        undefined,
        { language: input.language || 'es' },
      );
      return { success: true, output: result };
    } catch (e: any) {
      return { success: false, output: null, error: e.message };
    }
  }
}
