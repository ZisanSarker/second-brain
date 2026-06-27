import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, WorkspaceId } from '../auth/decorators/current-user.decorator';
import { SearchService } from './search.service';

@ApiTags('Search')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get('search')
  @ApiOperation({ summary: 'Metadata search across documents' })
  searchQuery(
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
    @Query('q') query?: string,
    @Query('collectionId') collectionId?: string,
    @Query('folderId') folderId?: string,
    @Query('tagId') tagId?: string,
    @Query('fileType') fileType?: string,
    @Query('author') author?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.searchService.search(workspaceId, userId, {
      query,
      collectionId,
      folderId,
      tagId,
      fileType,
      author,
      dateFrom,
      dateTo,
      sortBy,
      sortOrder,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('search/history')
  @ApiOperation({ summary: 'Get search history' })
  history(@CurrentUser('id') userId: string, @WorkspaceId() workspaceId: string) {
    return this.searchService.searchHistory(workspaceId, userId);
  }
}
