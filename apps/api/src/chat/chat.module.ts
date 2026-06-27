import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { ConversationService } from './services/conversation.service';
import { MessageService } from './services/message.service';
import { CitationService } from './services/citation.service';
import { ContextBuilderService } from './services/context-builder.service';
import { PromptBuilderService } from './services/prompt-builder.service';
import { QueryOptimizerService } from './services/query-optimizer.service';
import { StreamingService } from './services/streaming.service';
import { OpenAiCompatProvider } from './providers/openai-compat.provider';
import { SearchModule } from '../search/search.module';

const LLM_PROVIDER = 'LLM_PROVIDER';

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
    OpenAiCompatProvider,
    {
      provide: LLM_PROVIDER,
      useFactory: (config: ConfigService) => {
        const provider = config.get<string>('LLM_PROVIDER', 'openrouter');
        switch (provider) {
          case 'openai-compat':
            return new OpenAiCompatProvider(config);
          default:
            return new OpenAiCompatProvider(config);
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: [
    ConversationService,
    MessageService,
    CitationService,
    StreamingService,
    LLM_PROVIDER,
    PromptBuilderService,
    ContextBuilderService,
  ],
})
export class ChatModule {}
