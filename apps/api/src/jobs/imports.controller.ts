import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsUUID } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, WorkspaceId } from '../auth/decorators/current-user.decorator';
import { QueueService } from './queue.service';

class WebsiteImportDto {
  @IsString()
  url!: string;

  @IsUUID()
  @IsOptional()
  collectionId?: string;

  @IsUUID()
  @IsOptional()
  folderId?: string;
}

class GitHubImportDto {
  @IsString()
  repository!: string;

  @IsString()
  @IsOptional()
  branch?: string;

  @IsString()
  @IsOptional()
  accessToken?: string;

  @IsUUID()
  @IsOptional()
  collectionId?: string;

  @IsUUID()
  @IsOptional()
  folderId?: string;
}

class YouTubeImportDto {
  @IsString()
  videoId!: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  languages?: string[];

  @IsUUID()
  @IsOptional()
  collectionId?: string;

  @IsUUID()
  @IsOptional()
  folderId?: string;
}

@ApiTags('Imports')
@Controller('imports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ImportsController {
  constructor(private queue: QueueService) {}

  @Post('website')
  @ApiOperation({ summary: 'Import content from a website URL' })
  async importWebsite(
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
    @Body() dto: WebsiteImportDto,
  ) {
    const jobId = await this.queue.enqueueWebsiteImport(
      workspaceId,
      userId,
      dto.url,
      dto.collectionId,
      dto.folderId,
    );
    return { message: 'Website import queued', jobId };
  }

  @Post('github')
  @ApiOperation({ summary: 'Import a GitHub repository' })
  async importGitHub(
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
    @Body() dto: GitHubImportDto,
  ) {
    const jobId = await this.queue.enqueueGitHubImport(
      workspaceId,
      userId,
      dto.repository,
      dto.branch,
      dto.accessToken,
      dto.collectionId,
      dto.folderId,
    );
    return { message: 'GitHub import queued', jobId };
  }

  @Post('youtube')
  @ApiOperation({ summary: 'Import YouTube video transcript' })
  async importYouTube(
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
    @Body() dto: YouTubeImportDto,
  ) {
    const jobId = await this.queue.enqueueYouTubeImport(
      workspaceId,
      userId,
      dto.videoId,
      dto.languages,
      dto.collectionId,
      dto.folderId,
    );
    return { message: 'YouTube import queued', jobId };
  }
}
