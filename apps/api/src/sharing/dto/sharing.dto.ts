import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  entityType!: string;

  @IsString()
  entityId!: string;

  @IsString()
  userId!: string;

  @IsString()
  role!: string;
}

export class UpdatePermissionDto {
  @IsString()
  role!: string;
}

export class CreateLinkDto {
  @IsOptional()
  @IsString()
  documentId?: string;

  @IsOptional()
  @IsString()
  collectionId?: string;

  @IsOptional()
  @IsString()
  generatedContentId?: string;

  @IsOptional()
  @IsString()
  permission?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
