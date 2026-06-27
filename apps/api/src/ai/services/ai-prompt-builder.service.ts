import { Injectable } from '@nestjs/common';
import { PromptBuilderService } from '../../chat/services/prompt-builder.service';
import { TemplateService } from './template.service';

@Injectable()
export class AiPromptBuilderService {
  constructor(
    private promptBuilder: PromptBuilderService,
    private templateService: TemplateService,
  ) {}

  async buildPrompt(
    workspaceId: string,
    type: string,
    content: string,
    language?: string,
  ): Promise<{ systemPrompt: string; userPrompt: string }> {
    const template = await this.templateService.resolve(workspaceId, type);
    let systemPrompt = template.systemPrompt;
    let userPrompt = template.userPrompt || '';

    if (language) {
      systemPrompt += `\n\nRespond in ${language}.`;
    }

    if (content) {
      userPrompt = `${userPrompt}\n\n---\n${content}\n---`.trim();
    }

    return { systemPrompt, userPrompt };
  }
}
