import { IsString, IsOptional, IsArray } from 'class-validator';

export class GenerateContentDto {
  @IsOptional()
  @IsString()
  documentId?: string;

  @IsOptional()
  @IsString()
  collectionId?: string;

  @IsOptional()
  @IsString()
  customPrompt?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  model?: string;
}

export class BatchGenerateDto {
  @IsString()
  documentId!: string;

  @IsArray()
  @IsString({ each: true })
  types!: string[];
}

export class BatchCollectionDto {
  @IsString()
  collectionId!: string;

  @IsArray()
  @IsString({ each: true })
  types!: string[];
}

export class CreateTemplateDto {
  @IsString()
  name!: string;

  @IsString()
  type!: string;

  @IsString()
  systemPrompt!: string;

  @IsOptional()
  @IsString()
  userPrompt?: string;

  @IsOptional()
  outputSchema?: any;
}

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @IsOptional()
  @IsString()
  userPrompt?: string;

  @IsOptional()
  outputSchema?: any;

  @IsOptional()
  isDefault?: boolean;
}

export class CrossDocumentInsightsDto {
  @IsArray()
  @IsString({ each: true })
  documentIds!: string[];
}

export class RetryTaskDto {
  @IsOptional()
  @IsString()
  id?: string;
}
