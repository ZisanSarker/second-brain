import { Injectable } from '@nestjs/common';
import { BaseTool, ToolResult } from './base-tool';
import { QuizService } from '../../ai/services/quiz.service';

@Injectable()
export class QuizGeneratorTool extends BaseTool {
  readonly name = 'generate-quiz';
  readonly description = 'Generate a quiz from document content';
  readonly inputSchema = { documentId: { type: 'string' } };
  readonly outputSchema = { quiz: { type: 'object' } };
  readonly minRole = 'MEMBER';

  constructor(private quizService: QuizService) {
    super();
  }

  async execute(workspaceId: string, userId: string, input: any): Promise<ToolResult> {
    try {
      const result = await this.quizService.generate(input.documentId);
      return { success: true, output: result };
    } catch (e: any) {
      return { success: false, output: null, error: e.message };
    }
  }
}
