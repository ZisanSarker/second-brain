import { Injectable } from '@nestjs/common';
import { AiGenerationBaseService } from './ai-generation.base';

@Injectable()
export class NotesService extends AiGenerationBaseService {
  readonly type = 'NOTES' as const;
}
