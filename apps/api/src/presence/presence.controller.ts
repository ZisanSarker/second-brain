import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, WorkspaceId } from '../auth/decorators/current-user.decorator';
import { PresenceService } from './services/presence.service';
import { HeartbeatDto } from './dto/presence.dto';

@Controller('presence')
@UseGuards(JwtAuthGuard)
export class PresenceController {
  constructor(private presenceService: PresenceService) {}

  @Post('heartbeat')
  heartbeat(
    @Body() dto: HeartbeatDto,
    @WorkspaceId() workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.presenceService.heartbeat({
      workspaceId,
      userId,
      status: dto.status,
      currentDocumentId: dto.currentDocumentId,
    });
  }

  @Get('workspace')
  getActiveUsers(@WorkspaceId() workspaceId: string) {
    return this.presenceService.getActiveUsers(workspaceId);
  }

  @Post('offline')
  markOffline(@WorkspaceId() workspaceId: string, @CurrentUser('id') userId: string) {
    return this.presenceService.markOffline(workspaceId, userId);
  }
}
