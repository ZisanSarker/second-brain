import { Injectable } from '@nestjs/common';
import { AiGenerationBaseService } from './ai-generation.base';

@Injectable()
export class MindMapService extends AiGenerationBaseService {
  readonly type = 'MINDMAP' as const;
}
