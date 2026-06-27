import { Global, Module } from '@nestjs/common';
import { PrismaService } from './services/prisma.service';
import { StorageService } from './services/storage.service';
import { CacheService } from './services/cache.service';

@Global()
@Module({
  providers: [PrismaService, StorageService, CacheService],
  exports: [PrismaService, StorageService, CacheService],
})
export class SharedModule {}
