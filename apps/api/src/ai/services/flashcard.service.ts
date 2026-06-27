import { Injectable } from '@nestjs/common';
import { AiGenerationBaseService } from './ai-generation.base';

@Injectable()
export class FlashcardService extends AiGenerationBaseService {
  readonly type = 'FLASHCARD' as const;
}
