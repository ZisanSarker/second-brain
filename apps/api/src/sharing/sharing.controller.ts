import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, WorkspaceId } from '../auth/decorators/current-user.decorator';
import { SharingService } from './services/sharing.service';
import { CreatePermissionDto, UpdatePermissionDto, CreateLinkDto } from './dto/sharing.dto';

@Controller('share')
@UseGuards(JwtAuthGuard)
export class SharingController {
  constructor(private sharingService: SharingService) {}

  @Post()
  createPermission(
    @Body() dto: CreatePermissionDto,
    @WorkspaceId() workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.sharingService.createPermission({ ...dto, workspaceId, createdBy: userId });
  }

  @Get()
  listPermissions(
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.sharingService.listPermissions(entityType, entityId, userId);
  }

  @Patch(':id')
  updatePermission(
    @Param('id') id: string,
    @Body() dto: UpdatePermissionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.sharingService.updatePermission(id, dto.role, userId);
  }

  @Delete(':id')
  deletePermission(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.sharingService.deletePermission(id, userId);
  }

  @Post('link')
  createLink(
    @Body() dto: CreateLinkDto,
    @WorkspaceId() workspaceId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.sharingService.createLink({
      ...dto,
      workspaceId,
      createdBy: userId,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
    });
  }

  @Get('link/:token')
  getLink(@Param('token') token: string) {
    return this.sharingService.getLinkByToken(token);
  }

  @Get('links')
  listLinks(@Query('entityType') entityType: string, @Query('entityId') entityId: string) {
    return this.sharingService.listLinks(entityType, entityId);
  }

  @Delete('link/:id')
  deleteLink(@Param('id') id: string) {
    return this.sharingService.deleteLink(id);
  }
}
