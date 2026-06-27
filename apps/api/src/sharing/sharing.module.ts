import { Module } from '@nestjs/common';
import { SharingController } from './sharing.controller';
import { SharingService } from './services/sharing.service';
import { CollabModule } from '../collab/collab.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [CollabModule, AuditModule],
  controllers: [SharingController],
  providers: [SharingService],
})
export class SharingModule {}
