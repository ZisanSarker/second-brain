import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, WorkspaceId } from '../auth/decorators/current-user.decorator';
import { FoldersService } from './folders.service';
import { CreateFolderDto, UpdateFolderDto } from './dto/folder.dto';

@ApiTags('Folders')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FoldersController {
  constructor(private folders: FoldersService) {}

  @Post('folders')
  @ApiOperation({ summary: 'Create a folder' })
  create(
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
    @Body() dto: CreateFolderDto,
  ) {
    return this.folders.create(workspaceId, userId, dto);
  }

  @Get('folders')
  @ApiOperation({ summary: 'List workspace folders' })
  findAll(@CurrentUser('id') userId: string, @WorkspaceId() workspaceId: string) {
    return this.folders.findAll(workspaceId, userId);
  }

  @Get('folders/tree')
  @ApiOperation({ summary: 'Get folder tree' })
  getTree(@CurrentUser('id') userId: string, @WorkspaceId() workspaceId: string) {
    return this.folders.getTree(workspaceId, userId);
  }

  @Get('folders/:id')
  @ApiOperation({ summary: 'Get folder details' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.folders.findOne(workspaceId, id, userId);
  }

  @Patch('folders/:id')
  @ApiOperation({ summary: 'Update folder' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
    @Body() dto: UpdateFolderDto,
  ) {
    return this.folders.update(workspaceId, id, userId, dto);
  }

  @Delete('folders/:id')
  @ApiOperation({ summary: 'Delete folder' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
  ) {
    await this.folders.delete(workspaceId, id, userId);
    return { message: 'Folder deleted.' };
  }
}
