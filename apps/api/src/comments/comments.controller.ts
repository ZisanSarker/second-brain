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
import { CommentsService } from './services/comments.service';
import { CreateCommentDto, UpdateCommentDto, AddReactionDto } from './dto/comments.dto';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Post()
  create(
    @Body() dto: CreateCommentDto,
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
  ) {
    return this.commentsService.create({ ...dto, userId, workspaceId });
  }

  @Get()
  list(@Query('entityType') entityType: string, @Query('entityId') entityId: string) {
    return this.commentsService.list(entityType, entityId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.commentsService.update(id, dto.content, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.commentsService.softDelete(id, userId);
  }

  @Post(':id/resolve')
  resolve(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.commentsService.resolve(id, userId);
  }

  @Post(':id/reactions')
  addReaction(
    @Param('id') id: string,
    @Body() dto: AddReactionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.commentsService.addReaction(id, userId, dto.type);
  }

  @Delete(':id/reactions/:type')
  removeReaction(
    @Param('id') id: string,
    @Param('type') type: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.commentsService.removeReaction(id, userId, type);
  }
}
