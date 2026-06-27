import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { PrismaService } from '../shared/services/prisma.service';
import { CacheService } from '../shared/services/cache.service';
import { StorageService } from '../shared/services/storage.service';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latency?: number;
  error?: string;
}

export interface ReadinessResponse {
  status: string;
  services: ServiceStatus[];
  timestamp: string;
}

@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly storage: StorageService,
  ) {}

  async checkReadiness(): Promise<ReadinessResponse> {
    const services = await Promise.all([
      this.checkPostgres(),
      this.checkRedis(),
      this.checkMinio(),
    ]);

    const allHealthy = services.every((s) => s.status !== 'down');

    if (!allHealthy) {
      throw new HttpException(
        { status: 'degraded', services, timestamp: new Date().toISOString() },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return { status: 'ok', services, timestamp: new Date().toISOString() };
  }

  private async checkPostgres(): Promise<ServiceStatus> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { name: 'postgresql', status: 'healthy', latency: Date.now() - start };
    } catch (error) {
      return { name: 'postgresql', status: 'down', error: (error as Error).message };
    }
  }

  private async checkRedis(): Promise<ServiceStatus> {
    const start = Date.now();
    try {
      const client = this.cache.getRedisClient();
      await client.ping();
      return { name: 'redis', status: 'healthy', latency: Date.now() - start };
    } catch (error) {
      return { name: 'redis', status: 'down', error: (error as Error).message };
    }
  }

  private async checkMinio(): Promise<ServiceStatus> {
    const start = Date.now();
    try {
      const healthy = await this.storage.healthCheck();
      if (!healthy) {
        return { name: 'minio', status: 'degraded', error: 'bucket not found' };
      }
      return { name: 'minio', status: 'healthy', latency: Date.now() - start };
    } catch (error) {
      return { name: 'minio', status: 'down', error: (error as Error).message };
    }
  }
}
