import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, WorkspaceId } from '../auth/decorators/current-user.decorator';
import { DocumentsService } from './documents.service';
import {
  CreateDocumentDto,
  UpdateDocumentDto,
  DocumentFilterDto,
  AssignTagsDto,
  CreateVersionDto,
} from './dto/document.dto';

@ApiTags('Documents')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DocumentsController {
  constructor(private documents: DocumentsService) {}

  @Post('documents')
  @ApiOperation({ summary: 'Create a document (after upload)' })
  create(
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
    @Body() dto: CreateDocumentDto,
  ) {
    return this.documents.create(userId, workspaceId, dto);
  }

  @Get('documents')
  @ApiOperation({ summary: 'List documents with filters and pagination' })
  findAll(
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
    @Query() filter: DocumentFilterDto,
  ) {
    return this.documents.findAll(workspaceId, userId, filter);
  }

  @Get('documents/:id')
  @ApiOperation({ summary: 'Get document details' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
  ) {
    const doc = await this.documents.findOne(workspaceId, id, userId);
    await this.documents.trackView(id, userId);
    return doc;
  }

  @Patch('documents/:id')
  @ApiOperation({ summary: 'Update document metadata' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.documents.update(workspaceId, id, userId, dto);
  }

  @Delete('documents/:id')
  @ApiOperation({ summary: 'Soft delete document' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
  ) {
    await this.documents.softDelete(workspaceId, id, userId);
    return { message: 'Document moved to trash.' };
  }

  @Post('documents/:id/restore')
  @ApiOperation({ summary: 'Restore document from trash' })
  async restore(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
  ) {
    await this.documents.restore(workspaceId, id, userId);
    return { message: 'Document restored.' };
  }

  @Delete('documents/:id/permanent')
  @ApiOperation({ summary: 'Permanently delete document' })
  async permanentDelete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
  ) {
    await this.documents.permanentDelete(workspaceId, id, userId);
    return { message: 'Document permanently deleted.' };
  }

  @Post('documents/:id/versions')
  @ApiOperation({ summary: 'Upload new version' })
  addVersion(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
    @Body() dto: CreateVersionDto,
  ) {
    return this.documents.addVersion(workspaceId, id, userId, dto);
  }

  @Get('documents/:id/versions')
  @ApiOperation({ summary: 'Get version history' })
  getVersions(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.documents.getVersions(workspaceId, id, userId);
  }

  @Get('documents/:id/versions/:versionId')
  @ApiOperation({ summary: 'Get specific version' })
  getVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.documents.getVersion(workspaceId, id, versionId, userId);
  }

  @Post('documents/:id/versions/:versionNumber/restore')
  @ApiOperation({ summary: 'Restore a previous version' })
  restoreVersion(
    @Param('id') id: string,
    @Param('versionNumber') versionNumber: string,
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.documents.restoreVersion(workspaceId, id, parseInt(versionNumber), userId);
  }

  @Get('documents/:id/processing')
  @ApiOperation({ summary: 'Get document processing status' })
  getProcessingStatus(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.documents.getProcessingStatus(workspaceId, id, userId);
  }

  @Post('documents/:id/retry')
  @ApiOperation({ summary: 'Retry document processing' })
  retryProcessing(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.documents.retryProcessing(workspaceId, id, userId);
  }

  @Post('documents/:id/tags')
  @ApiOperation({ summary: 'Assign tags to document' })
  assignTags(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
    @Body() dto: AssignTagsDto,
  ) {
    return this.documents.assignTags(workspaceId, id, userId, dto);
  }

  @Delete('documents/:id/tags/:tagId')
  @ApiOperation({ summary: 'Remove tag from document' })
  removeTag(
    @Param('id') id: string,
    @Param('tagId') tagId: string,
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.documents.removeTag(workspaceId, id, tagId, userId);
  }

  @Get('upload/presigned')
  @ApiOperation({ summary: 'Get presigned upload URL' })
  getPresignedUploadUrl(
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
    @Query('fileName') fileName: string,
  ) {
    return this.documents.getPresignedUploadUrl(workspaceId, userId, fileName);
  }

  @Get('documents/:id/download')
  @ApiOperation({ summary: 'Get presigned download URL' })
  async getDownloadUrl(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
  ) {
    const versions = await this.documents.getVersions(workspaceId, id, userId);
    const latestVersion = versions[0];
    if (!latestVersion) return { url: null };
    const url = await this.documents.getPresignedUrl(workspaceId, latestVersion.storageKey);
    return { url, fileName: latestVersion.fileName };
  }
}
