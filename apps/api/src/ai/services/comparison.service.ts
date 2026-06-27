import { Injectable } from '@nestjs/common';
import { AiGenerationBaseService } from './ai-generation.base';

@Injectable()
export class ComparisonService extends AiGenerationBaseService {
  readonly type = 'COMPARISON' as const;
}
