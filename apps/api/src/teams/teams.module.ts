import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { TeamsService } from './services/teams.service';
import { CollabModule } from '../collab/collab.module';

@Module({
  imports: [CollabModule],
  controllers: [TeamsController],
  providers: [TeamsService],
})
export class TeamsModule {}
