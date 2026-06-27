import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, WorkspaceId } from '../auth/decorators/current-user.decorator';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { SearchResultsDto } from './dto/search-result.dto';
import { SearchSuggestionsDto } from './dto/suggestion.dto';
import { SaveSearchHistoryDto, SearchHistoryEntryDto } from './dto/search-history.dto';

@ApiTags('Search')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get('search')
  @ApiOperation({ summary: 'Hybrid search across all knowledge sources' })
  async searchQuery(
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
    @Query() query: SearchQueryDto,
  ): Promise<SearchResultsDto> {
    return this.searchService.search(workspaceId, userId, {
      query: query.q,
      mode: query.mode,
      collectionId: query.collectionId,
      folderId: query.folderId,
      tagId: query.tagId,
      tagIds: query.tagIds,
      fileType: query.fileType,
      author: query.author,
      language: query.language,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      page: query.page,
      limit: query.limit,
      keywordWeight: query.keywordWeight,
      semanticWeight: query.semanticWeight,
    });
  }

  @Get('search/suggestions')
  @ApiOperation({ summary: 'Get search suggestions' })
  async suggestions(
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
    @Query('q') prefix: string,
  ): Promise<SearchSuggestionsDto> {
    const suggestions = await this.searchService.suggestions(workspaceId, userId, prefix);
    return { suggestions };
  }

  @Get('search/history')
  @ApiOperation({ summary: 'Get search history' })
  async history(
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
  ): Promise<SearchHistoryEntryDto[]> {
    return this.searchService.searchHistory(workspaceId, userId);
  }

  @Post('search/history')
  @ApiOperation({ summary: 'Save search history entry' })
  @HttpCode(HttpStatus.CREATED)
  async saveHistory(
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
    @Body() dto: SaveSearchHistoryDto,
  ): Promise<void> {
    return this.searchService.saveHistory(workspaceId, userId, dto);
  }

  @Delete('search/history/:id')
  @ApiOperation({ summary: 'Delete a search history entry' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteHistory(
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
    @Param('id') id: string,
  ): Promise<void> {
    return this.searchService.deleteHistory(workspaceId, userId, id);
  }

  @Get('documents/:id/related')
  @ApiOperation({ summary: 'Get related documents' })
  async relatedDocuments(
    @CurrentUser('id') userId: string,
    @WorkspaceId() workspaceId: string,
    @Param('id') documentId: string,
    @Query('limit') limit?: string,
  ): Promise<{ documentId: string; title: string; score: number }[]> {
    return this.searchService.relatedDocuments(
      workspaceId,
      userId,
      documentId,
      limit ? parseInt(limit) : 5,
    );
  }
}
