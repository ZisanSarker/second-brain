import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceId } from '../auth/decorators/current-user.decorator';
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
import { TemplateService } from './services/template.service';
import { TaskService } from './services/task.service';
import {
  GenerateContentDto,
  BatchGenerateDto,
  BatchCollectionDto,
  CreateTemplateDto,
  UpdateTemplateDto,
  CrossDocumentInsightsDto,
} from './dto/ai.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(
    private summaryService: SummaryService,
    private flashcardService: FlashcardService,
    private quizService: QuizService,
    private notesService: NotesService,
    private mindMapService: MindMapService,
    private comparisonService: ComparisonService,
    private translationService: TranslationService,
    private learningService: LearningService,
    private insightsService: InsightsService,
    private batchService: BatchService,
    private templateService: TemplateService,
    private taskService: TaskService,
  ) {}

  @Post('summary/generate')
  generateSummary(@Body() dto: GenerateContentDto) {
    return this.summaryService.generate(dto.documentId, dto.collectionId, dto.customPrompt, {
      language: dto.language,
      model: dto.model,
    });
  }

  @Get('summary')
  listSummary(
    @Query('documentId') documentId?: string,
    @Query('collectionId') collectionId?: string,
  ) {
    return this.summaryService.list(documentId, collectionId);
  }

  @Post('flashcards/generate')
  generateFlashcards(@Body() dto: GenerateContentDto) {
    return this.flashcardService.generate(dto.documentId, dto.collectionId, dto.customPrompt, {
      language: dto.language,
      model: dto.model,
    });
  }

  @Get('flashcards')
  listFlashcards(
    @Query('documentId') documentId?: string,
    @Query('collectionId') collectionId?: string,
  ) {
    return this.flashcardService.list(documentId, collectionId);
  }

  @Post('quiz/generate')
  generateQuiz(@Body() dto: GenerateContentDto) {
    return this.quizService.generate(dto.documentId, dto.collectionId, dto.customPrompt, {
      language: dto.language,
      model: dto.model,
    });
  }

  @Get('quiz')
  listQuiz(@Query('documentId') documentId?: string, @Query('collectionId') collectionId?: string) {
    return this.quizService.list(documentId, collectionId);
  }

  @Post('notes/generate')
  generateNotes(@Body() dto: GenerateContentDto) {
    return this.notesService.generate(dto.documentId, dto.collectionId, dto.customPrompt, {
      language: dto.language,
      model: dto.model,
    });
  }

  @Get('notes')
  listNotes(
    @Query('documentId') documentId?: string,
    @Query('collectionId') collectionId?: string,
  ) {
    return this.notesService.list(documentId, collectionId);
  }

  @Post('mindmap/generate')
  generateMindMap(@Body() dto: GenerateContentDto) {
    return this.mindMapService.generate(dto.documentId, dto.collectionId, dto.customPrompt, {
      language: dto.language,
      model: dto.model,
    });
  }

  @Get('mindmap')
  listMindMaps(
    @Query('documentId') documentId?: string,
    @Query('collectionId') collectionId?: string,
  ) {
    return this.mindMapService.list(documentId, collectionId);
  }

  @Post('comparison/generate')
  generateComparison(@Body() dto: GenerateContentDto) {
    return this.comparisonService.generate(dto.documentId, dto.collectionId, dto.customPrompt, {
      language: dto.language,
      model: dto.model,
    });
  }

  @Get('comparison')
  listComparisons(
    @Query('documentId') documentId?: string,
    @Query('collectionId') collectionId?: string,
  ) {
    return this.comparisonService.list(documentId, collectionId);
  }

  @Post('translation/generate')
  generateTranslation(@Body() dto: GenerateContentDto) {
    return this.translationService.generate(dto.documentId, dto.collectionId, dto.customPrompt, {
      language: dto.language,
      model: dto.model,
    });
  }

  @Get('translation')
  listTranslations(
    @Query('documentId') documentId?: string,
    @Query('collectionId') collectionId?: string,
  ) {
    return this.translationService.list(documentId, collectionId);
  }

  @Post('learning/takeaways')
  generateTakeaways(@Body() dto: GenerateContentDto) {
    return this.learningService.generateTakeaways(dto.documentId, dto.collectionId);
  }

  @Post('learning/glossary')
  generateGlossary(@Body() dto: GenerateContentDto) {
    return this.learningService.generateGlossary(dto.documentId, dto.collectionId);
  }

  @Post('learning/faq')
  generateFAQ(@Body() dto: GenerateContentDto) {
    return this.learningService.generateFAQ(dto.documentId, dto.collectionId);
  }

  @Post('learning/study-plan')
  generateStudyPlan(@Body() dto: GenerateContentDto) {
    return this.learningService.generateStudyPlan(dto.documentId, dto.collectionId);
  }

  @Post('learning/interview-questions')
  generateInterviewQuestions(@Body() dto: GenerateContentDto) {
    return this.learningService.generateInterviewQuestions(dto.documentId, dto.collectionId);
  }

  @Post('learning/timeline')
  generateTimeline(@Body() dto: GenerateContentDto) {
    return this.learningService.generateTimeline(dto.documentId, dto.collectionId);
  }

  @Post('insights/cross-document')
  generateCrossDocumentInsights(@Body() dto: CrossDocumentInsightsDto) {
    return this.insightsService.generateCrossDocumentInsights(dto.documentIds);
  }

  @Post('insights/workspace-trends')
  generateWorkspaceTrends(@WorkspaceId() workspaceId: string) {
    return this.insightsService.generateWorkspaceTrends(workspaceId);
  }

  @Post('batch/generate')
  batchGenerate(@Body() dto: BatchGenerateDto) {
    return this.batchService.batchGenerate(dto.documentId, dto.types);
  }

  @Post('batch/generate-collection')
  batchGenerateCollection(@Body() dto: BatchCollectionDto) {
    return this.batchService.batchGenerateCollection(dto.collectionId, dto.types);
  }

  @Get('tasks')
  listTasks(@WorkspaceId() workspaceId: string, @Query('status') status?: string) {
    return this.taskService.list(workspaceId, status);
  }

  @Get('tasks/:id')
  getTask(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.taskService.getById(workspaceId, id);
  }

  @Post('tasks/:id/retry')
  retryTask(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.taskService.retry(workspaceId, id);
  }

  @Post('tasks/:id/cancel')
  cancelTask(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.taskService.cancel(workspaceId, id);
  }

  @Get('content/:id')
  getContent(@Param('id') id: string) {
    return this.summaryService.getById(id);
  }

  @Delete('content/:id')
  deleteContent(@Param('id') id: string) {
    return this.summaryService.delete(id);
  }

  @Post('templates')
  createTemplate(@WorkspaceId() workspaceId: string, @Body() dto: CreateTemplateDto) {
    return this.templateService.create(workspaceId, dto);
  }

  @Get('templates')
  listTemplates(@WorkspaceId() workspaceId: string, @Query('type') type?: string) {
    return this.templateService.list(workspaceId, type);
  }

  @Get('templates/:id')
  getTemplate(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.templateService.getById(workspaceId, id);
  }

  @Patch('templates/:id')
  updateTemplate(
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.templateService.update(workspaceId, id, dto);
  }

  @Delete('templates/:id')
  deleteTemplate(@WorkspaceId() workspaceId: string, @Param('id') id: string) {
    return this.templateService.delete(workspaceId, id);
  }
}
