import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, WorkspaceId } from '../auth/decorators/current-user.decorator';
import { TeamsService } from './services/teams.service';
import { CreateTeamDto, UpdateTeamDto, AddTeamMemberDto } from './dto/teams.dto';

@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Post()
  create(
    @Body() dto: CreateTeamDto,
    @WorkspaceId() workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.teamsService.create(workspaceId, { ...dto, createdBy: userId });
  }

  @Get()
  list(@WorkspaceId() workspaceId: string) {
    return this.teamsService.list(workspaceId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTeamDto, @CurrentUser('id') userId: string) {
    return this.teamsService.update(id, dto, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.teamsService.delete(id, userId);
  }

  @Post(':id/members')
  addMember(
    @Param('id') id: string,
    @Body() dto: AddTeamMemberDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.teamsService.addMember(id, dto.userId, dto.role || 'MEMBER', userId);
  }

  @Delete(':id/members/:memberId')
  removeMember(
    @Param('id') id: string,
    @Param('memberId') memberId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.teamsService.removeMember(id, memberId, userId);
  }
}
