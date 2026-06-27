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
  HttpCode,
  HttpStatus,
  Res,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, WorkspaceId } from '../auth/decorators/current-user.decorator';
import { ConversationService } from './services/conversation.service';
import { MessageService } from './services/message.service';
import { CitationService } from './services/citation.service';
import { ContextBuilderService } from './services/context-builder.service';
import { PromptBuilderService } from './services/prompt-builder.service';
import { QueryOptimizerService } from './services/query-optimizer.service';
import { StreamingService } from './services/streaming.service';
import { OpenRouterProvider } from './providers/openrouter.provider';
import { SendMessageDto, RegenerateDto } from './dto/chat-request.dto';
import { CreateConversationDto, UpdateConversationDto } from './dto/conversation.dto';

@ApiTags('Chat')
@Controller('chat')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(
    private conversationService: ConversationService,
    private messageService: MessageService,
    private citationService: CitationService,
    private contextBuilder: ContextBuilderService,
    private promptBuilder: PromptBuilderService,
    private queryOptimizer: QueryOptimizerService,
    private streamingService: StreamingService,
    private llm: OpenRouterProvider,
  ) {}

  // ── Send Message (SSE Stream) ────────────────────────────────────────

  @Post()
  @ApiOperation({ summary: 'Send a message and receive streaming response via SSE' })
  async sendMessage(
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
    @Body() dto: SendMessageDto,
    @Res() res: Response,
    @Req() req: any,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      // 1. Resolve or create conversation
      let conversationId = dto.conversationId;
      if (!conversationId) {
        const conv = await this.conversationService.create(workspaceId, userId);
        conversationId = conv.id;
      }

      // 2. Save user message
      await this.messageService.addMessage(
        workspaceId,
        userId,
        conversationId,
        'user',
        dto.message,
      );

      // 3. Optimize query
      const lastMsg = await this.messageService.getLastMessage(conversationId);
      const optimized = this.queryOptimizer.optimize(dto.message, lastMsg?.content);

      // 4. Build context
      const context = await this.contextBuilder.buildContext(
        workspaceId,
        userId,
        optimized.optimized,
      );

      // 5. Build prompt
      const conv = await this.conversationService.findById(workspaceId, userId, conversationId);
      const messages = await this.promptBuilder.buildChatPrompt({
        workspaceId,
        question: dto.message,
        context,
        conversationId,
        systemPromptId: conv.systemPromptId || undefined,
      });

      // 6. Update title on first message
      if (conv.title === 'New Chat' && context.chunkCount > 0) {
        const title = dto.message.length > 100 ? dto.message.slice(0, 97) + '...' : dto.message;
        await this.conversationService.update(workspaceId, userId, conversationId, { title });
      }

      // 7. Create streaming subject
      const subject = this.streamingService.createStream(conversationId);
      let fullContent = '';

      // Subscribe to stream events
      const sub = subject.subscribe({
        next: (event) => {
          if (event.type === 'token') {
            res.write(`data: ${JSON.stringify({ type: 'token', token: event.data })}\n\n`);
          } else if (event.type === 'citations') {
            res.write(`data: ${JSON.stringify({ type: 'citations', citations: event.data })}\n\n`);
          } else if (event.type === 'metadata') {
            res.write(`data: ${JSON.stringify({ type: 'metadata', ...(event.data as any) })}\n\n`);
          }
        },
        error: (err) => {
          res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
          res.end();
        },
        complete: () => {
          res.write(`data: ${JSON.stringify({ type: 'done', messageId: 'pending' })}\n\n`);
          res.end();
        },
      });

      req.on('close', () => {
        sub.unsubscribe();
        this.streamingService.cleanupStream(conversationId);
      });

      // 8. Stream from LLM
      try {
        const stream$ = this.llm.generateChatStream({
          messages,
          model: dto.model || conv.model,
          temperature: dto.temperature,
          maxTokens: dto.maxTokens,
        });

        const tokenSub = stream$.subscribe({
          next: (token) => {
            fullContent += token;
            subject.next({ type: 'token', data: token });
          },
          error: (err) => {
            subject.error(err);
            // Save partial response
            if (fullContent) {
              this.saveAssistantMessage(
                workspaceId,
                userId,
                conversationId,
                fullContent,
                context.citations,
              );
            }
          },
          complete: async () => {
            tokenSub.unsubscribe();
            // Save assistant message + citations
            const msg = await this.saveAssistantMessage(
              workspaceId,
              userId,
              conversationId,
              fullContent,
              context.citations,
            );
            subject.next({ type: 'done', data: { messageId: msg?.id } });
            subject.complete();
            this.streamingService.cleanupStream(conversationId);
          },
        });

        req.on('close', () => {
          tokenSub.unsubscribe();
          this.streamingService.cleanupStream(conversationId);
          if (fullContent) {
            this.saveAssistantMessage(
              workspaceId,
              userId,
              conversationId,
              fullContent,
              context.citations,
            );
          }
        });
      } catch (err: any) {
        subject.error(err);
      }
    } catch (err: any) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
      res.end();
    }
  }

  // ── Regenerate ───────────────────────────────────────────────────────

  @Post(':id/regenerate')
  @ApiOperation({ summary: 'Regenerate the last assistant response' })
  async regenerate(
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
    @Param('id') conversationId: string,
    @Body() dto: RegenerateDto,
    @Res() res: Response,
    @Req() req: any,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      const conv = await this.conversationService.findById(workspaceId, userId, conversationId);
      const lastUserMsg = [...conv.messages].reverse().find((m) => m.role === 'user');
      if (!lastUserMsg) {
        res.write(
          `data: ${JSON.stringify({ type: 'error', message: 'No user message to regenerate from' })}\n\n`,
        );
        res.end();
        return;
      }

      // Mark last assistant message as not-final
      await this.messageService.markLastAsNotFinal(workspaceId, userId, conversationId);

      // Rebuild context and prompt
      const context = await this.contextBuilder.buildContext(
        workspaceId,
        userId,
        lastUserMsg.content,
      );
      const messages = await this.promptBuilder.buildChatPrompt({
        workspaceId,
        question: lastUserMsg.content,
        context,
        conversationId,
        systemPromptId: conv.systemPromptId || undefined,
      });

      const subject = this.streamingService.createStream(conversationId);
      let fullContent = '';

      const sub = subject.subscribe({
        next: (event) => {
          if (event.type === 'token') {
            res.write(`data: ${JSON.stringify({ type: 'token', token: event.data })}\n\n`);
          } else if (event.type === 'citations') {
            res.write(`data: ${JSON.stringify({ type: 'citations', citations: event.data })}\n\n`);
          }
        },
        error: (err) => {
          res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
          res.end();
        },
        complete: () => {
          res.end();
        },
      });

      req.on('close', () => {
        sub.unsubscribe();
        this.streamingService.cleanupStream(conversationId);
      });

      const stream$ = this.llm.generateChatStream({
        messages,
        temperature: dto.temperature,
      });

      stream$.subscribe({
        next: (token) => {
          fullContent += token;
          subject.next({ type: 'token', data: token });
        },
        error: (err) => subject.error(err),
        complete: async () => {
          if (fullContent) {
            await this.saveAssistantMessage(
              workspaceId,
              userId,
              conversationId,
              fullContent,
              context.citations,
            );
          }
          subject.next({ type: 'done', data: {} });
          subject.complete();
          this.streamingService.cleanupStream(conversationId);
        },
      });
    } catch (err: any) {
      res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
      res.end();
    }
  }

  // ── Stop Generation ─────────────────────────────────────────────────

  @Post(':id/stop')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stop the ongoing generation' })
  stopGeneration(@Param('id') conversationId: string) {
    const stopped = this.streamingService.stopStream(conversationId);
    return { stopped };
  }

  // ── Conversations ────────────────────────────────────────────────────

  @Get('conversations')
  @ApiOperation({ summary: 'List all conversations' })
  listConversations(
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
    @Query('q') searchQuery?: string,
  ) {
    if (searchQuery) {
      return this.conversationService.search(workspaceId, userId, searchQuery);
    }
    return this.conversationService.list(workspaceId, userId);
  }

  @Post('conversations')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new conversation' })
  createConversation(
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
    @Body() dto: CreateConversationDto,
  ) {
    return this.conversationService.create(workspaceId, userId, dto.title, dto.systemPromptId);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get conversation with messages' })
  getConversation(
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.conversationService.findById(workspaceId, userId, id);
  }

  @Patch('conversations/:id')
  @ApiOperation({ summary: 'Update conversation (rename, pin, archive)' })
  async updateConversation(
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateConversationDto,
  ) {
    const data: any = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.pin !== undefined) data.pinnedAt = dto.pin ? new Date() : null;
    if (dto.archive !== undefined) data.archivedAt = dto.archive ? new Date() : null;
    if (dto.systemPromptId !== undefined) data.systemPromptId = dto.systemPromptId;
    return this.conversationService.update(workspaceId, userId, id, data);
  }

  @Delete('conversations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete a conversation' })
  deleteConversation(
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.conversationService.softDelete(workspaceId, userId, id);
  }

  @Post('conversations/:id/duplicate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Duplicate a conversation' })
  duplicateConversation(
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.conversationService.duplicate(workspaceId, userId, id);
  }

  // ── Messages ─────────────────────────────────────────────────────────

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get messages for a conversation (paginated)' })
  getMessages(
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
    @Param('id') conversationId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.messageService.getMessages(
      workspaceId,
      userId,
      conversationId,
      limit ? parseInt(limit) : 100,
      offset ? parseInt(offset) : 0,
    );
  }

  // ── Suggestions & Models ─────────────────────────────────────────────

  @Get('suggestions')
  @ApiOperation({ summary: 'Get suggested questions' })
  getSuggestions() {
    return {
      suggestions: [
        'Summarize my recent documents',
        'What did I learn this week?',
        'Find documents about machine learning',
        'What are my most important notes?',
      ],
    };
  }

  @Get('models')
  @ApiOperation({ summary: 'List available AI models' })
  getModels() {
    return {
      models: [
        { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
        { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI' },
        { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
        { id: 'google/gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'Google' },
        { id: 'meta-llama/llama-3.3-70b', name: 'Llama 3.3 70B', provider: 'Meta' },
        { id: 'mistralai/mistral-7b', name: 'Mistral 7B', provider: 'Mistral' },
      ],
    };
  }

  // ── Export ───────────────────────────────────────────────────────────

  @Get('conversations/:id/export/json')
  @ApiOperation({ summary: 'Export conversation as JSON' })
  exportJson(
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.conversationService.exportJson(workspaceId, userId, id);
  }

  @Get('conversations/:id/export/markdown')
  @ApiOperation({ summary: 'Export conversation as Markdown' })
  async exportMarkdown(
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const md = await this.conversationService.exportMarkdown(workspaceId, userId, id);
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="conversation-${id.slice(0, 8)}.md"`,
    );
    res.send(md);
  }

  // ── Private Helpers ──────────────────────────────────────────────────

  private async saveAssistantMessage(
    workspaceId: string,
    userId: string,
    conversationId: string,
    content: string,
    citations: any[],
  ) {
    if (!content.trim()) return null;
    const msg = await this.messageService.addMessage(
      workspaceId,
      userId,
      conversationId,
      'assistant',
      content,
      0,
    );
    if (citations.length > 0) {
      await this.citationService.saveCitations(msg.id, citations);
    }
    return msg;
  }
}
