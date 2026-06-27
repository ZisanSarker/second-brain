import { Controller, Get } from '@nestjs/common';
import { HealthService, ReadinessResponse } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('liveness')
  getLiveness(): { status: string; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('readiness')
  async getReadiness(): Promise<ReadinessResponse> {
    return this.healthService.checkReadiness();
  }
}
