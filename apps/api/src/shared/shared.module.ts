import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { PrismaService } from './services/prisma.service';
import { StorageService } from './services/storage.service';
import { CacheService } from './services/cache.service';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({
  providers: [
    PrismaService,
    StorageService,
    CacheService,
    {
      provide: REDIS_CLIENT,
      useFactory: (config: ConfigService) => {
        return new Redis({
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: Number(config.get<string>('REDIS_PORT', '6379')),
          keyPrefix: 'cache:',
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [PrismaService, StorageService, CacheService, REDIS_CLIENT],
})
export class SharedModule {}
