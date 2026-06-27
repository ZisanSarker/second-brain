import { Module } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { InvitationsService } from './invitations.service';

@Module({
  controllers: [WorkspacesController],
  providers: [WorkspacesService, InvitationsService],
  exports: [WorkspacesService, InvitationsService],
})
export class WorkspacesModule {}
