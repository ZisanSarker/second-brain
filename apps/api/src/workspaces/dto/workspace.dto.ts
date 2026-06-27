import { IsString, IsOptional, IsEmail, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class CreateWorkspaceDto {
  @ApiProperty({ example: 'My Knowledge Base' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'my-knowledge-base', required: false })
  @IsString()
  @IsOptional()
  slug?: string;
}

export class UpdateWorkspaceDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  slug?: string;
}

export class AddMemberDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: UserRole, default: 'MEMBER' })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}

export class UpdateMemberRoleDto {
  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  role!: UserRole;
}

export class CreateInvitationDto {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: UserRole, default: 'MEMBER' })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}

export class UpdateWorkspaceSettingsDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  aiModel?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  embeddingModel?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  chunkSize?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  chunkOverlap?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  maxTokens?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  temperature?: number;
}
