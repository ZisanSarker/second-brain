import { Injectable } from '@nestjs/common';
import { AiGenerationBaseService } from './ai-generation.base';

@Injectable()
export class QuizService extends AiGenerationBaseService {
  readonly type = 'QUIZ' as const;
}
