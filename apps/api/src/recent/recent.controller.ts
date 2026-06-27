import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, WorkspaceId } from '../auth/decorators/current-user.decorator';
import { RecentService } from './recent.service';

@ApiTags('Recent')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RecentController {
  constructor(private recent: RecentService) {}

  @Get('recent')
  @ApiOperation({ summary: 'List recently viewed documents' })
  findAll(
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
    @Query('limit') limit?: string,
  ) {
    return this.recent.findAll(workspaceId, userId, limit ? parseInt(limit) : 20);
  }
}
