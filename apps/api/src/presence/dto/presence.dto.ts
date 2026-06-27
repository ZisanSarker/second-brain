import { IsString, IsOptional } from 'class-validator';

export class HeartbeatDto {
  @IsString()
  status!: string;

  @IsOptional()
  @IsString()
  currentDocumentId?: string;
}
