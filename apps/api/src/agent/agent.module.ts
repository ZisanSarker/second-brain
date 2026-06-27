import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';
import { AgentRouterService } from './agent-router.service';
import { TaskPlannerService } from './task-planner.service';
import { LlmReasonerService } from './llm-reasoner.service';
import { ExecutionService } from './execution.service';
import { MemoryService } from './memory.service';
import { ToolRegistry } from './tools/tool-registry';
import { SearchTool } from './tools/search.tool';
import { DocumentReaderTool } from './tools/document-reader.tool';
import { SummarizationTool } from './tools/summarization.tool';
import { TranslationTool } from './tools/translation.tool';
import { ComparisonTool } from './tools/comparison.tool';
import { QuizGeneratorTool } from './tools/quiz-generator.tool';
import { FlashcardGeneratorTool } from './tools/flashcard-generator.tool';
import { MindMapGeneratorTool } from './tools/mindmap-generator.tool';
import { NotificationTool } from './tools/notification.tool';
import { KnowledgeAgent } from './agents/knowledge.agent';
import { ResearchAgent } from './agents/research.agent';
import { DocumentationAgent } from './agents/documentation.agent';
import { WritingAgent } from './agents/writing.agent';
import { CodeExplainAgent } from './agents/code-explain.agent';
import { WorkflowService } from './workflows/workflow.service';
import { WorkflowExecutorService } from './workflows/workflow-executor.service';
import { ApprovalService } from './approvals/approval.service';
import { SchedulerService } from './scheduler/scheduler.service';
import { AgentProcessor } from './processors/agent.processor';
import { ScheduleProcessor } from './processors/schedule.processor';
import { ChatModule } from '../chat/chat.module';
import { SearchModule } from '../search/search.module';
import { AiModule } from '../ai/ai.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SharedModule } from '../shared/shared.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'agents' }, { name: 'schedules' }),
    ChatModule,
    SearchModule,
    AiModule,
    NotificationsModule,
    SharedModule,
  ],
  controllers: [AgentController],
  providers: [
    AgentService,
    AgentRouterService,
    TaskPlannerService,
    LlmReasonerService,
    ExecutionService,
    MemoryService,
    ToolRegistry,
    SearchTool,
    DocumentReaderTool,
    SummarizationTool,
    TranslationTool,
    ComparisonTool,
    QuizGeneratorTool,
    FlashcardGeneratorTool,
    MindMapGeneratorTool,
    NotificationTool,
    KnowledgeAgent,
    ResearchAgent,
    DocumentationAgent,
    WritingAgent,
    CodeExplainAgent,
    WorkflowService,
    WorkflowExecutorService,
    ApprovalService,
    SchedulerService,
    AgentProcessor,
    ScheduleProcessor,
  ],
  exports: [
    AgentService,
    ExecutionService,
    ToolRegistry,
    WorkflowService,
    ApprovalService,
    SchedulerService,
  ],
})
export class AgentModule {
  constructor(
    private router: AgentRouterService,
    private knowledgeAgent: KnowledgeAgent,
    private researchAgent: ResearchAgent,
    private documentationAgent: DocumentationAgent,
    private writingAgent: WritingAgent,
    private codeExplainAgent: CodeExplainAgent,
    private registry: ToolRegistry,
    private searchTool: SearchTool,
    private docReaderTool: DocumentReaderTool,
    private summaryTool: SummarizationTool,
    private translationTool: TranslationTool,
    private comparisonTool: ComparisonTool,
    private quizTool: QuizGeneratorTool,
    private flashcardTool: FlashcardGeneratorTool,
    private mindmapTool: MindMapGeneratorTool,
    private notifTool: NotificationTool,
  ) {
    this.router.register(this.knowledgeAgent);
    this.router.register(this.researchAgent);
    this.router.register(this.documentationAgent);
    this.router.register(this.writingAgent);
    this.router.register(this.codeExplainAgent);

    this.registry.register(this.searchTool);
    this.registry.register(this.docReaderTool);
    this.registry.register(this.summaryTool);
    this.registry.register(this.translationTool);
    this.registry.register(this.comparisonTool);
    this.registry.register(this.quizTool);
    this.registry.register(this.flashcardTool);
    this.registry.register(this.mindmapTool);
    this.registry.register(this.notifTool);
  }
}
