import { Injectable } from '@nestjs/common';
import { AiGenerationBaseService } from './ai-generation.base';

@Injectable()
export class SummaryService extends AiGenerationBaseService {
  readonly type = 'SUMMARY' as const;
}
