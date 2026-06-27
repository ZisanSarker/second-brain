import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: HealthService;

  const mockHealthService = {
    checkReadiness: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: HealthService, useValue: mockHealthService }],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthService = module.get<HealthService>(HealthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('liveness', () => {
    it('should return ok with timestamp', () => {
      const result = controller.getLiveness();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(Date.parse(result.timestamp)).not.toBeNaN();
    });
  });

  describe('readiness', () => {
    it('should return ok when all services are healthy', async () => {
      const mockResponse = {
        status: 'ok',
        services: [
          { name: 'postgresql', status: 'healthy', latency: 5 },
          { name: 'redis', status: 'healthy', latency: 2 },
          { name: 'minio', status: 'healthy', latency: 10 },
        ],
        timestamp: new Date().toISOString(),
      };

      mockHealthService.checkReadiness.mockResolvedValue(mockResponse);

      const result = await controller.getReadiness();

      expect(result.status).toBe('ok');
      expect(result.services).toHaveLength(3);
      expect(result.services.every((s: any) => s.status === 'healthy')).toBe(true);
    });

    it('should propagate errors when service is down', async () => {
      const errorResponse = {
        status: 'degraded',
        services: [
          { name: 'postgresql', status: 'down', error: 'connection refused' },
          { name: 'redis', status: 'healthy', latency: 2 },
          { name: 'minio', status: 'healthy', latency: 10 },
        ],
        timestamp: new Date().toISOString(),
      };

      mockHealthService.checkReadiness.mockResolvedValue(errorResponse);

      const result = await controller.getReadiness();

      expect(result.status).toBe('degraded');
      expect(result.services[0].status).toBe('down');
    });
  });
});
