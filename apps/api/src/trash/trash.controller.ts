import { Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, WorkspaceId } from '../auth/decorators/current-user.decorator';
import { TrashService } from './trash.service';

@ApiTags('Trash')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TrashController {
  constructor(private trash: TrashService) {}

  @Get('trash')
  @ApiOperation({ summary: 'List trashed items' })
  findAll(
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.trash.findAll(workspaceId, userId, page || 1, Math.min(limit || 50, 100));
  }

  @Post('trash/documents/:id/restore')
  @ApiOperation({ summary: 'Restore document from trash' })
  restoreDocument(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.trash.restoreDocument(workspaceId, id, userId);
  }

  @Delete('trash/documents/:id')
  @ApiOperation({ summary: 'Permanently delete document' })
  async permanentDeleteDocument(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
  ) {
    await this.trash.permanentDeleteDocument(workspaceId, id, userId);
    return { message: 'Document permanently deleted.' };
  }

  @Delete('trash')
  @ApiOperation({ summary: 'Empty trash' })
  async emptyTrash(@CurrentUser('id') userId: string, @WorkspaceId() workspaceId: string) {
    const result = await this.trash.emptyTrash(workspaceId, userId);
    return {
      message: 'Trash emptied.',
      deletedDocuments: result.deletedDocuments,
      deletedCollections: result.deletedCollections,
    };
  }
}
