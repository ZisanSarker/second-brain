import { Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, WorkspaceId } from '../auth/decorators/current-user.decorator';
import { FavoritesService } from './favorites.service';

@ApiTags('Favorites')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class FavoritesController {
  constructor(private favorites: FavoritesService) {}

  @Get('favorites')
  @ApiOperation({ summary: 'List user favorites' })
  findAll(@CurrentUser('id') userId: string, @WorkspaceId() workspaceId: string) {
    return this.favorites.findAll(userId, workspaceId);
  }

  @Post('favorites/:entityType/:entityId')
  @ApiOperation({ summary: 'Toggle favorite' })
  toggle(
    @CurrentUser('id') userId: string,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.favorites.toggle(userId, entityId, entityType.toUpperCase());
  }

  @Delete('favorites/:entityType/:entityId')
  @ApiOperation({ summary: 'Remove favorite' })
  async remove(
    @CurrentUser('id') userId: string,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    await this.favorites.remove(userId, entityId, entityType.toUpperCase());
    return { message: 'Removed from favorites.' };
  }

  @Get('favorites/:entityType/:entityId')
  @ApiOperation({ summary: 'Check if favorited' })
  check(
    @CurrentUser('id') userId: string,
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.favorites.isFavorited(userId, entityId, entityType.toUpperCase());
  }
}
