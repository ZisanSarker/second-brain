import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { WorkspacesService } from './workspaces.service';
import { InvitationsService } from './invitations.service';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  CreateInvitationDto,
  UpdateMemberRoleDto,
  UpdateWorkspaceSettingsDto,
} from './dto/workspace.dto';

@ApiTags('Workspaces')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkspacesController {
  constructor(
    private workspaces: WorkspacesService,
    private invitations: InvitationsService,
  ) {}

  @Post('workspaces')
  @ApiOperation({ summary: 'Create a new workspace' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateWorkspaceDto) {
    return this.workspaces.create(userId, dto);
  }

  @Get('workspaces')
  @ApiOperation({ summary: 'List user workspaces' })
  findAll(@CurrentUser('id') userId: string) {
    return this.workspaces.findByUser(userId);
  }

  @Get('workspaces/:workspaceId')
  @ApiOperation({ summary: 'Get workspace details' })
  findOne(@Param('workspaceId') workspaceId: string, @CurrentUser('id') userId: string) {
    return this.workspaces.findById(workspaceId, userId);
  }

  @Patch('workspaces/:workspaceId')
  @ApiOperation({ summary: 'Update workspace' })
  update(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateWorkspaceDto,
  ) {
    return this.workspaces.update(workspaceId, userId, dto);
  }

  @Delete('workspaces/:workspaceId')
  @ApiOperation({ summary: 'Delete workspace' })
  async remove(@Param('workspaceId') workspaceId: string, @CurrentUser('id') userId: string) {
    await this.workspaces.delete(workspaceId, userId);
    return { message: 'Workspace deleted successfully.' };
  }

  // Members
  @Get('workspaces/:workspaceId/members')
  @ApiOperation({ summary: 'List workspace members' })
  getMembers(@Param('workspaceId') workspaceId: string, @CurrentUser('id') userId: string) {
    return this.workspaces.getMembers(workspaceId, userId);
  }

  @Get('workspaces/:workspaceId/members/me')
  @ApiOperation({ summary: 'Get my membership' })
  getMyMember(@Param('workspaceId') workspaceId: string, @CurrentUser('id') userId: string) {
    return this.workspaces.getMyMembership(workspaceId, userId);
  }

  @Get('workspaces/:workspaceId/members/:memberId')
  @ApiOperation({ summary: 'Get member details' })
  getMember(@Param('workspaceId') workspaceId: string, @Param('memberId') memberId: string) {
    return this.workspaces.getMember(workspaceId, memberId);
  }

  @Patch('workspaces/:workspaceId/members/:memberId/role')
  @ApiOperation({ summary: 'Update member role' })
  updateMemberRole(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
    @Param('memberId') targetUserId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.workspaces.updateMemberRole(workspaceId, userId, targetUserId, dto.role);
  }

  @Delete('workspaces/:workspaceId/members/:memberId')
  @ApiOperation({ summary: 'Remove member' })
  async removeMember(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
    @Param('memberId') targetUserId: string,
  ) {
    await this.workspaces.removeMember(workspaceId, userId, targetUserId);
    return { message: 'Member removed successfully.' };
  }

  // Invitations
  @Post('workspaces/:workspaceId/invitations')
  @ApiOperation({ summary: 'Create invitation' })
  createInvitation(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.invitations.create(workspaceId, userId, dto);
  }

  @Get('workspaces/:workspaceId/invitations')
  @ApiOperation({ summary: 'List workspace invitations' })
  getInvitations(@Param('workspaceId') workspaceId: string, @CurrentUser('id') userId: string) {
    return this.invitations.findByWorkspace(workspaceId, userId);
  }

  @Delete('workspaces/:workspaceId/invitations/:invitationId')
  @ApiOperation({ summary: 'Revoke invitation' })
  async revokeInvitation(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
    @Param('invitationId') invitationId: string,
  ) {
    await this.invitations.revoke(workspaceId, userId, invitationId);
    return { message: 'Invitation revoked successfully.' };
  }

  @Get('invitations/:token')
  @ApiOperation({ summary: 'Get invitation details' })
  getInvitation(@Param('token') token: string) {
    return this.invitations.getInvitation(token);
  }

  @Post('invitations/:token/accept')
  @ApiOperation({ summary: 'Accept invitation' })
  async acceptInvitation(@Param('token') token: string, @CurrentUser('id') userId: string) {
    const member = await this.invitations.accept(token, userId);
    return member;
  }

  @Post('invitations/:token/reject')
  @ApiOperation({ summary: 'Reject invitation' })
  async rejectInvitation(@Param('token') token: string) {
    await this.invitations.reject(token);
    return { message: 'Invitation rejected.' };
  }

  // Settings
  @Get('workspaces/:workspaceId/settings')
  @ApiOperation({ summary: 'Get workspace settings' })
  getSettings(@Param('workspaceId') workspaceId: string, @CurrentUser('id') userId: string) {
    return this.workspaces.getSettings(workspaceId, userId);
  }

  @Patch('workspaces/:workspaceId/settings')
  @ApiOperation({ summary: 'Update workspace settings' })
  updateSettings(
    @Param('workspaceId') workspaceId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateWorkspaceSettingsDto,
  ) {
    return this.workspaces.updateSettings(workspaceId, userId, dto);
  }
}
