import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ConversationService } from './services/conversation.service';
import { MessageService } from './services/message.service';
import { CitationService } from './services/citation.service';
import { ContextBuilderService } from './services/context-builder.service';
import { PromptBuilderService } from './services/prompt-builder.service';
import { QueryOptimizerService } from './services/query-optimizer.service';
import { StreamingService } from './services/streaming.service';
import { OpenRouterProvider } from './providers/openrouter.provider';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [SearchModule],
  controllers: [ChatController],
  providers: [
    ConversationService,
    MessageService,
    CitationService,
    ContextBuilderService,
    PromptBuilderService,
    QueryOptimizerService,
    StreamingService,
    OpenRouterProvider,
  ],
  exports: [
    ConversationService,
    MessageService,
    CitationService,
    StreamingService,
    OpenRouterProvider,
    PromptBuilderService,
    ContextBuilderService,
  ],
})
export class ChatModule {}
