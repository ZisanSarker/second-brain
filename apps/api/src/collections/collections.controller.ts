import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, WorkspaceId } from '../auth/decorators/current-user.decorator';
import { CollectionsService } from './collections.service';
import { CreateCollectionDto, UpdateCollectionDto } from './dto/collection.dto';

@ApiTags('Collections')
@Controller('collections')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CollectionsController {
  constructor(private collections: CollectionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a collection' })
  create(
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
    @Body() dto: CreateCollectionDto,
  ) {
    return this.collections.create(workspaceId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List workspace collections' })
  findAll(@CurrentUser('id') userId: string, @WorkspaceId() workspaceId: string) {
    return this.collections.findAll(workspaceId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get collection details' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.collections.findOne(workspaceId, id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update collection' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
    @Body() dto: UpdateCollectionDto,
  ) {
    return this.collections.update(workspaceId, id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete collection' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
  ) {
    await this.collections.softDelete(workspaceId, id, userId);
    return { message: 'Collection moved to trash.' };
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive collection' })
  archive(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.collections.archive(workspaceId, id, userId);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore collection from trash' })
  restore(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.collections.restore(workspaceId, id, userId);
  }
}
