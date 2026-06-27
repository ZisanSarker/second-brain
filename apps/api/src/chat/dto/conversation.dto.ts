import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class CreateConversationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  systemPromptId?: string;
}

export class UpdateConversationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  pin?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  archive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  systemPromptId?: string;
}

export class SearchConversationsDto {
  @ApiProperty()
  @IsString()
  q!: string;
}
