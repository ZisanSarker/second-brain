import { IsString, IsOptional, IsObject } from 'class-validator';

export class RunAgentDto {
  @IsString()
  type!: string;

  @IsString()
  @IsOptional()
  input?: string;

  @IsObject()
  @IsOptional()
  context?: Record<string, any>;

  @IsString()
  @IsOptional()
  model?: string;
}

export class StopExecutionDto {
  @IsString()
  reason?: string;
}

export class RunWorkflowDto {
  @IsString()
  workflowId!: string;

  @IsObject()
  @IsOptional()
  input?: Record<string, any>;
}
