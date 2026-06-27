import { Module } from '@nestjs/common';
import { SharedModule } from '../shared/shared.module';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [SharedModule],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
