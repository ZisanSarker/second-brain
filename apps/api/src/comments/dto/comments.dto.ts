import { IsString, IsOptional } from 'class-validator';

export class CreateCommentDto {
  @IsOptional()
  @IsString()
  documentId?: string;

  @IsOptional()
  @IsString()
  collectionId?: string;

  @IsOptional()
  @IsString()
  generatedContentId?: string;

  @IsString()
  content!: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

export class UpdateCommentDto {
  @IsString()
  content!: string;
}

export class AddReactionDto {
  @IsString()
  type!: string;
}
