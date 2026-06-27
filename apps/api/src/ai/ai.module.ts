import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { SummaryService } from './services/summary.service';
import { FlashcardService } from './services/flashcard.service';
import { QuizService } from './services/quiz.service';
import { NotesService } from './services/notes.service';
import { MindMapService } from './services/mindmap.service';
import { ComparisonService } from './services/comparison.service';
import { TranslationService } from './services/translation.service';
import { LearningService } from './services/learning.service';
import { InsightsService } from './services/insights.service';
import { BatchService } from './services/batch.service';
import { ContentService } from './services/content.service';
import { TemplateService } from './services/template.service';
import { TaskService } from './services/task.service';
import { AiPromptBuilderService } from './services/ai-prompt-builder.service';
import { ChatModule } from '../chat/chat.module';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [ChatModule, SharedModule],
  controllers: [AiController],
  providers: [
    SummaryService,
    FlashcardService,
    QuizService,
    NotesService,
    MindMapService,
    ComparisonService,
    TranslationService,
    LearningService,
    InsightsService,
    BatchService,
    ContentService,
    TemplateService,
    TaskService,
    AiPromptBuilderService,
  ],
  exports: [
    SummaryService,
    FlashcardService,
    QuizService,
    NotesService,
    ContentService,
    TemplateService,
    TaskService,
    AiPromptBuilderService,
  ],
})
export class AiModule {}
