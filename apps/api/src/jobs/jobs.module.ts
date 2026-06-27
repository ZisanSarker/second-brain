import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { AiModule } from '../ai/ai.module';
import { QueueService } from './queue.service';
import { DocumentProcessingProcessor } from './document-processing.processor';
import { ImportsProcessor } from './imports.processor';
import { AiGenerationProcessor } from './ai-generation.processor';
import { ImportsController } from './imports.controller';

@Module({
  imports: [
    AiModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
        },
      }),
    }),
    BullModule.registerQueue({ name: 'documents' }, { name: 'imports' }, { name: 'ai-generation' }),
  ],
  controllers: [ImportsController],
  providers: [QueueService, DocumentProcessingProcessor, ImportsProcessor, AiGenerationProcessor],
  exports: [QueueService],
})
export class JobsModule {}
