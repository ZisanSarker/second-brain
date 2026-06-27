import { IsString, IsOptional, IsUUID, IsInt, IsArray, Min, Max, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ALLOWED_MIME_TYPES } from '../constants/upload.constants';

export class CreateDocumentDto {
  @ApiProperty()
  @IsString()
  title!: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  originalName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  fileType?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsIn(ALLOWED_MIME_TYPES)
  @IsOptional()
  mimeType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => (value ? BigInt(value) : undefined))
  fileSize?: bigint;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  collectionId?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  folderId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  storageKey?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  checksum?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  author?: string;
}

export class UpdateDocumentDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  collectionId?: string | null;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  folderId?: string | null;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  author?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  source?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  docCreatedAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  docModifiedAt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  pageCount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  wordCount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  readingTime?: number;
}

export class DocumentFilterDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  collectionId?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  folderId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  fileType?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  tagId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  author?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class AssignTagsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds!: string[];
}

export class CreateVersionDto {
  @ApiProperty()
  @IsString()
  storageKey!: string;

  @ApiProperty()
  @IsString()
  fileName!: string;

  @ApiProperty()
  @IsString()
  mimeType!: string;

  @ApiProperty()
  @Transform(({ value }) => BigInt(value))
  fileSize!: bigint;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  checksum?: string;
}
