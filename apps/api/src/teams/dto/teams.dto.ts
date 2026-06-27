import { IsString, IsOptional } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateTeamDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class AddTeamMemberDto {
  @IsString()
  userId!: string;

  @IsOptional()
  @IsString()
  role?: string;
}
