import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SearchHitDto {
  @ApiProperty()
  documentId!: string;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  source!: string;

  @ApiProperty()
  sourceType!: string;

  @ApiProperty()
  score!: number;

  @ApiPropertyOptional()
  keywordScore?: number;

  @ApiPropertyOptional()
  semanticScore?: number;

  @ApiProperty()
  matchedContent!: string;

  @ApiPropertyOptional()
  chunkIndex?: number;

  @ApiPropertyOptional()
  pageNumber?: number;

  @ApiPropertyOptional()
  section?: string;

  @ApiPropertyOptional()
  fileType?: string;

  @ApiPropertyOptional()
  author?: string;

  @ApiPropertyOptional()
  language?: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({ type: [Object] })
  tags?: { id: string; name: string; color?: string }[];

  @ApiPropertyOptional()
  collectionId?: string;

  @ApiPropertyOptional()
  collectionName?: string;

  @ApiPropertyOptional()
  folderName?: string;
}

export class SearchResultsDto {
  @ApiProperty({ type: [SearchHitDto] })
  data!: SearchHitDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  totalPages!: number;

  @ApiProperty()
  query!: string;

  @ApiProperty()
  mode!: string;

  @ApiProperty()
  took!: number;
}
