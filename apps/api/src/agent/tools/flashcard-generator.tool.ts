import { Injectable } from '@nestjs/common';
import { BaseTool, ToolResult } from './base-tool';
import { FlashcardService } from '../../ai/services/flashcard.service';

@Injectable()
export class FlashcardGeneratorTool extends BaseTool {
  readonly name = 'generate-flashcards';
  readonly description = 'Generate flashcards from document content for study';
  readonly inputSchema = { documentId: { type: 'string' } };
  readonly outputSchema = { flashcards: { type: 'object' } };
  readonly minRole = 'MEMBER';

  constructor(private flashcardService: FlashcardService) {
    super();
  }

  async execute(workspaceId: string, userId: string, input: any): Promise<ToolResult> {
    try {
      const result = await this.flashcardService.generate(input.documentId);
      return { success: true, output: result };
    } catch (e: any) {
      return { success: false, output: null, error: e.message };
    }
  }
}
