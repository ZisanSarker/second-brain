import { Injectable } from '@nestjs/common';
import { AiGenerationBaseService } from './ai-generation.base';

@Injectable()
export class TranslationService extends AiGenerationBaseService {
  readonly type = 'TRANSLATION' as const;
}
