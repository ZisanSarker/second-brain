import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceId } from '../auth/decorators/current-user.decorator';
import { ActivityService } from './services/activity.service';

@Controller('activity')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private activityService: ActivityService) {}

  @Get()
  list(
    @WorkspaceId() workspaceId: string,
    @Query('type') type?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.activityService.list(workspaceId, { type, entityType, entityId, limit, offset });
  }

  @Get('workspace-summary')
  summary(@WorkspaceId() workspaceId: string) {
    return this.activityService.workspaceSummary(workspaceId);
  }
}
