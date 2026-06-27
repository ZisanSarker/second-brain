import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, WorkspaceId } from '../auth/decorators/current-user.decorator';
import { TagsService } from './tags.service';
import { CreateTagDto, UpdateTagDto } from './dto/tag.dto';

@ApiTags('Tags')
@Controller('tags')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TagsController {
  constructor(private tags: TagsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a workspace tag' })
  create(
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
    @Body() dto: CreateTagDto,
  ) {
    return this.tags.create(workspaceId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List workspace tags' })
  findAll(@CurrentUser('id') userId: string, @WorkspaceId() workspaceId: string) {
    return this.tags.findAll(workspaceId, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update tag name or color' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
    @Body() dto: UpdateTagDto,
  ) {
    return this.tags.update(workspaceId, id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete tag' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
  ) {
    await this.tags.delete(workspaceId, id, userId);
    return { message: 'Tag deleted.' };
  }
}
