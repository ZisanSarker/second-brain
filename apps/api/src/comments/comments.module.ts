import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './services/comments.service';
import { MentionService } from './services/mention.service';
import { CollabModule } from '../collab/collab.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [CollabModule, AuditModule],
  controllers: [CommentsController],
  providers: [CommentsService, MentionService],
  exports: [CommentsService, MentionService],
})
export class CommentsModule {}
