import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchHistoryEntryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  query!: string;

  @ApiPropertyOptional({ type: Object })
  filters?: Record<string, unknown>;

  @ApiPropertyOptional()
  resultCount?: number;

  @ApiProperty()
  createdAt!: string;
}

export class SaveSearchHistoryDto {
  @ApiProperty()
  @IsString()
  query!: string;

  @ApiPropertyOptional({ type: Object })
  @IsOptional()
  filters?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  resultCount?: number;
}

export class RelatedDocumentsDto {
  @ApiProperty()
  documentId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  score!: number;
}
